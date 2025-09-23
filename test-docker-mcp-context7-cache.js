#!/usr/bin/env node

/**
 * Docker MCP Context7 Cache Test
 * 
 * This test properly connects to the running Docker container
 * using the MCP protocol (the normal way it's used) to test
 * Context7 caching behavior.
 */

import { spawn } from 'child_process';
import { performance } from 'perf_hooks';

class DockerMCPContext7CacheTest {
    constructor() {
        this.results = [];
        this.mcpClient = null;
    }

    async runTest() {
        console.log('🐳 Docker MCP Context7 Cache Test');
        console.log('==================================\n');

        try {
            // Connect to Docker container via MCP
            await this.connectToDockerMCP();
            
            // Run cache test sequence
            await this.runCacheTestSequence();
            
            // Analyze results
            this.analyzeResults();
            
        } catch (error) {
            console.error('❌ Test failed:', error.message);
        } finally {
            await this.cleanup();
        }
    }

    async connectToDockerMCP() {
        console.log('🔌 Connecting to Docker container via MCP...');
        
        // Connect to the Docker container's MCP server
        // The Docker container should be running the MCP server on stdio
        this.mcpClient = spawn('docker', ['exec', '-i', 'promptmcp-server', 'node', 'dist/mcp/server.js'], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        // Initialize MCP connection
        await this.initializeMCPConnection();
        
        console.log('   ✅ Connected to Docker MCP server');
    }

    async initializeMCPConnection() {
        return new Promise((resolve, reject) => {
            const initRequest = {
                jsonrpc: '2.0',
                id: 1,
                method: 'initialize',
                params: {
                    protocolVersion: '2024-11-05',
                    capabilities: {},
                    clientInfo: {
                        name: 'docker-cache-test',
                        version: '1.0.0'
                    }
                }
            };

            let responseReceived = false;

            const onData = (data) => {
                const output = data.toString();
                if (output.includes('"id":1')) {
                    try {
                        const response = JSON.parse(output);
                        if (response.id === 1) {
                            responseReceived = true;
                            this.mcpClient.stdout.removeListener('data', onData);
                            resolve(response);
                        }
                    } catch (e) {
                        // Continue waiting
                    }
                }
            };

            this.mcpClient.stdout.on('data', onData);
            this.mcpClient.stderr.on('data', (data) => {
                console.log('MCP stderr:', data.toString());
            });

            this.mcpClient.stdin.write(JSON.stringify(initRequest) + '\n');

            setTimeout(() => {
                if (!responseReceived) {
                    reject(new Error('MCP initialization timeout'));
                }
            }, 10000);
        });
    }

    async runCacheTestSequence() {
        const testPrompt = 'Create a modern React component with TypeScript, hooks, and styled-components';
        
        console.log('\n📤 MCP Cache Test Sequence:');
        console.log('============================\n');
        
        // Test 1: First request (cold cache)
        console.log('1️⃣  First Request (Cold Cache)');
        const firstResult = await this.makeMCPEnhanceRequest(testPrompt, 'First Request');
        this.results.push(firstResult);
        
        await this.sleep(1000);
        
        // Test 2: Identical request (should hit cache)
        console.log('\n2️⃣  Identical Request (Cache Hit Expected)');
        const secondResult = await this.makeMCPEnhanceRequest(testPrompt, 'Identical Request');
        this.results.push(secondResult);
        
        await this.sleep(1000);
        
        // Test 3: Another identical request (should definitely hit cache)
        console.log('\n3️⃣  Another Identical Request (Cache Hit Expected)');
        const thirdResult = await this.makeMCPEnhanceRequest(testPrompt, 'Another Identical');
        this.results.push(thirdResult);
        
        await this.sleep(1000);
        
        // Test 4: Different request (should miss cache)
        console.log('\n4️⃣  Different Request (Cache Miss Expected)');
        const differentPrompt = 'Create a Vue.js component with composition API and TypeScript';
        const fourthResult = await this.makeMCPEnhanceRequest(differentPrompt, 'Different Request');
        this.results.push(fourthResult);
        
        await this.sleep(1000);
        
        // Test 5: Back to original (should hit cache again)
        console.log('\n5️⃣  Back to Original (Cache Hit Expected)');
        const fifthResult = await this.makeMCPEnhanceRequest(testPrompt, 'Back to Original');
        this.results.push(fifthResult);
    }

    async makeMCPEnhanceRequest(prompt, testName) {
        const startTime = performance.now();
        
        try {
            const request = {
                jsonrpc: '2.0',
                id: Date.now(),
                method: 'tools/call',
                params: {
                    name: 'promptmcp.enhance',
                    arguments: {
                        prompt: prompt,
                        context: { framework: 'react' },
                        options: { useCache: true }
                    }
                }
            };

            const response = await this.sendMCPRequest(request);
            const endTime = performance.now();
            const responseTime = Math.round(endTime - startTime);

            console.log(`   ✅ Response time: ${responseTime}ms`);
            
            return {
                testName,
                responseTime,
                success: true,
                hasResponse: !!response?.result?.content,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            const endTime = performance.now();
            const responseTime = Math.round(endTime - startTime);
            
            console.log(`   ❌ Error: ${error.message} (${responseTime}ms)`);
            
            return {
                testName,
                responseTime,
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    async sendMCPRequest(request) {
        return new Promise((resolve, reject) => {
            if (!this.mcpClient) {
                reject(new Error('MCP client not connected'));
                return;
            }

            let responseData = '';
            let timeoutId;

            const onData = (data) => {
                responseData += data.toString();
                
                const lines = responseData.split('\n');
                for (const line of lines) {
                    if (line.trim().startsWith('{')) {
                        try {
                            const response = JSON.parse(line);
                            if (response.id === request.id) {
                                clearTimeout(timeoutId);
                                this.mcpClient.stdout.removeListener('data', onData);
                                resolve(response);
                                return;
                            }
                        } catch (e) {
                            // Continue parsing
                        }
                    }
                }
            };

            this.mcpClient.stdout.on('data', onData);
            this.mcpClient.stdin.write(JSON.stringify(request) + '\n');

            timeoutId = setTimeout(() => {
                this.mcpClient.stdout.removeListener('data', onData);
                reject(new Error('MCP request timeout'));
            }, 15000);
        });
    }

    analyzeResults() {
        console.log('\n📊 Docker MCP Cache Analysis Results');
        console.log('=====================================\n');

        const successfulResults = this.results.filter(r => r.success);
        
        if (successfulResults.length === 0) {
            console.log('❌ No successful requests to analyze');
            return;
        }

        const firstRequest = successfulResults.find(r => r.testName === 'First Request');
        const identicalRequests = successfulResults.filter(r => 
            r.testName === 'Identical Request' || r.testName === 'Another Identical' || r.testName === 'Back to Original'
        );
        const differentRequest = successfulResults.find(r => r.testName === 'Different Request');

        console.log('⏱️  Response Time Analysis:');
        console.log('===========================');
        
        if (firstRequest) {
            console.log(`   First Request (Cold): ${firstRequest.responseTime}ms`);
        }

        if (identicalRequests.length > 0) {
            const avgIdenticalTime = identicalRequests.reduce((sum, r) => sum + r.responseTime, 0) / identicalRequests.length;
            const minIdenticalTime = Math.min(...identicalRequests.map(r => r.responseTime));
            const maxIdenticalTime = Math.max(...identicalRequests.map(r => r.responseTime));
            
            console.log(`   Identical Requests: ${avgIdenticalTime.toFixed(0)}ms avg (${minIdenticalTime}-${maxIdenticalTime}ms range)`);
            
            if (firstRequest) {
                const speedup = (firstRequest.responseTime / avgIdenticalTime).toFixed(1);
                console.log(`   Speedup: ${speedup}x faster than cold start`);
            }
        }

        if (differentRequest) {
            console.log(`   Different Request: ${differentRequest.responseTime}ms`);
            
            if (firstRequest) {
                const speedup = (firstRequest.responseTime / differentRequest.responseTime).toFixed(1);
                console.log(`   Speedup: ${speedup}x faster than cold start`);
            }
        }

        // Cache effectiveness analysis
        console.log('\n🎯 Cache Effectiveness Analysis:');
        console.log('=================================');
        
        if (firstRequest && identicalRequests.length > 0) {
            const avgIdenticalTime = identicalRequests.reduce((sum, r) => sum + r.responseTime, 0) / identicalRequests.length;
            const speedupRatio = firstRequest.responseTime / avgIdenticalTime;
            
            console.log(`   Cold Start Time: ${firstRequest.responseTime}ms`);
            console.log(`   Cache Hit Time: ${avgIdenticalTime.toFixed(0)}ms`);
            console.log(`   Speedup Ratio: ${speedupRatio.toFixed(1)}x`);
            
            if (speedupRatio > 5) {
                console.log('   ✅ EXCELLENT: Very strong caching evidence (5x+ speedup)');
            } else if (speedupRatio > 3) {
                console.log('   ✅ STRONG: Strong caching evidence (3x+ speedup)');
            } else if (speedupRatio > 2) {
                console.log('   ✅ GOOD: Clear caching evidence (2x+ speedup)');
            } else if (speedupRatio > 1.5) {
                console.log('   ⚠️  MODERATE: Some caching evidence (1.5x+ speedup)');
            } else {
                console.log('   ❌ WEAK: Minimal caching evidence');
            }
        }

        // Final verdict
        console.log('\n🏆 DOCKER MCP CACHE VERDICT:');
        console.log('=============================');
        
        if (firstRequest && identicalRequests.length > 0) {
            const avgIdenticalTime = identicalRequests.reduce((sum, r) => sum + r.responseTime, 0) / identicalRequests.length;
            const speedupRatio = firstRequest.responseTime / avgIdenticalTime;
            
            if (speedupRatio > 2) {
                console.log('   ✅ PROVEN: Context7 caching is working in Docker MCP');
                console.log('   📈 Evidence: Identical requests are significantly faster');
                console.log('   🐳 Method: Docker container MCP protocol testing');
                console.log('   📊 Speedup: ' + speedupRatio.toFixed(1) + 'x improvement');
                console.log('   🔌 Protocol: MCP (Model Context Protocol)');
            } else {
                console.log('   ❌ NOT PROVEN: Insufficient evidence of effective caching');
                console.log('   📊 Speedup: Only ' + speedupRatio.toFixed(1) + 'x improvement');
            }
        } else {
            console.log('   ❓ INCONCLUSIVE: Not enough data to determine caching effectiveness');
        }

        // Show cache database evidence from Docker container
        console.log('\n💾 Docker Cache Database Evidence:');
        console.log('===================================');
        
        try {
            const { exec } = require('child_process');
            exec('docker exec promptmcp-server ls -la /app/*.db*', (error, stdout, stderr) => {
                if (error) {
                    console.log('   ⚠️  Could not check Docker cache files');
                } else {
                    console.log('   📁 Docker container cache files:');
                    console.log(stdout);
                }
            });
        } catch (e) {
            console.log('   ⚠️  Could not check Docker cache files');
        }
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async cleanup() {
        if (this.mcpClient) {
            console.log('\n🛑 Disconnecting from Docker MCP server...');
            this.mcpClient.kill();
            await this.sleep(1000);
        }
    }
}

// Run the Docker MCP cache test
const test = new DockerMCPContext7CacheTest();
test.runTest().catch(console.error);
