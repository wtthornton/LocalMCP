#!/usr/bin/env node

/**
 * Debug Framework Detection
 * Tests the framework detection and library selection logic
 */

import { Logger } from './dist/services/logger/logger.js';
import { ConfigService } from './dist/config/config.service.js';
import { Context7MCPComplianceService } from './dist/services/context7/context7-mcp-compliance.service.js';
import { Context7RealIntegrationService } from './dist/services/context7/context7-real-integration.service.js';
import { Context7MonitoringService } from './dist/services/context7/context7-monitoring.service.js';
import { Context7AdvancedCacheService } from './dist/services/context7/context7-advanced-cache.service.js';
import { FrameworkDetectorService, Context7CacheService } from './dist/services/framework-detector/index.js';

async function debugFrameworkDetection() {
  console.log('🔍 Debugging Framework Detection...\n');
  
  const logger = new Logger('debug');
  const config = new ConfigService();
  const mcpCompliance = new Context7MCPComplianceService(logger, config);
  const realContext7 = new Context7RealIntegrationService(logger, config);
  const monitoring = new Context7MonitoringService(logger, config);
  const cache = new Context7AdvancedCacheService(logger, config);
  
  const frameworkCache = new Context7CacheService();
  const frameworkDetector = new FrameworkDetectorService(realContext7, frameworkCache);

  try {
    const prompt = 'create a new hello page that is fancy, modern and fun';
    
    console.log('1. Testing framework detection...');
    const frameworkDetection = await frameworkDetector.detectFrameworks(prompt);
    console.log('   Detected frameworks:', frameworkDetection.detectedFrameworks);
    console.log('   Confidence scores:', frameworkDetection.confidenceScores);
    
    console.log('\n2. Testing library selection logic...');
    
    // Simulate the library selection logic
    const promptLower = prompt.toLowerCase();
    const promptKeywords = promptLower.split(' ').filter(word => word.length > 3);
    
    const libraryMap = {
      'html': { id: '/mdn/html', score: 0, topics: ['elements', 'attributes', 'semantic', 'accessibility'] },
      'css': { id: '/mdn/css', score: 0, topics: ['styling', 'layout', 'flexbox', 'grid', 'animations'] },
      'javascript': { id: '/mdn/javascript', score: 0, topics: ['functions', 'objects', 'arrays', 'async', 'dom'] },
      'react': { id: '/facebook/react', score: 0, topics: ['components', 'hooks', 'state', 'props', 'jsx'] },
      'nextjs': { id: '/vercel/next.js', score: 0, topics: ['routing', 'api', 'ssr', 'ssg', 'middleware'] },
      'typescript': { id: '/microsoft/typescript', score: 0, topics: ['types', 'interfaces', 'generics', 'enums'] }
    };
    
    // Calculate scores
    for (const [framework, library] of Object.entries(libraryMap)) {
      let score = 0;
      
      if (frameworkDetection.detectedFrameworks.includes(framework)) {
        score += 10;
      }
      
      for (const keyword of promptKeywords) {
        if (library.topics.some(topic => topic.includes(keyword))) {
          score += 3;
        }
        if (promptLower.includes(keyword) && library.topics.some(topic => topic.includes(keyword))) {
          score += 5;
        }
      }
      
      library.score = score;
    }
    
    const sortedLibraries = Object.entries(libraryMap)
      .filter(([_, library]) => library.score > 0)
      .sort(([_, a], [__, b]) => b.score - a.score);
    
    console.log('   Library scores:');
    sortedLibraries.forEach(([name, lib]) => {
      console.log(`     ${name}: ${lib.score} (ID: ${lib.id})`);
    });
    
    const selectedLibraries = sortedLibraries
      .slice(0, 1)
      .map(([_, library]) => library.id);
    
    console.log('   Selected libraries:', selectedLibraries);
    
    console.log('\n3. Testing actual Context7 library resolution...');
    const actualLibraries = await mcpCompliance.resolveLibraryId('react');
    console.log('   Actual Context7 libraries found:', actualLibraries.length);
    if (actualLibraries.length > 0) {
      console.log('   First library ID:', actualLibraries[0].id);
      console.log('   Expected ID:', selectedLibraries[0]);
      console.log('   Match:', actualLibraries[0].id === selectedLibraries[0]);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugFrameworkDetection().catch(console.error);
