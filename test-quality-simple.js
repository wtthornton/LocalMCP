#!/usr/bin/env node

/**
 * Simple Quality Check Test
 * Tests the enhancement system with call tree analysis
 */

import { Logger } from './dist/services/logger/logger.js';
import { ConfigService } from './dist/config/config.service.js';
import { Context7MCPComplianceService } from './dist/services/context7/context7-mcp-compliance.service.js';
import { Context7MonitoringService } from './dist/services/context7/context7-monitoring.service.js';
import { Context7AdvancedCacheService } from './dist/services/context7/context7-advanced-cache.service.js';
import { EnhancedContext7EnhanceTool } from './dist/tools/enhanced-context7-enhance.tool.js';

async function runQualityCheck() {
  console.log('🔍 Quality Check Test: "create a new hello page that is fancy, modern and fun"\n');
  
  const logger = new Logger('QualityCheck');
  const config = new ConfigService();
  const callTree = [];
  const startTime = Date.now();

  function logCall(method, context = {}) {
    const timestamp = Date.now() - startTime;
    callTree.push({ timestamp, method, context, level: callTree.length });
    console.log(`[${timestamp}ms] → ${method}`, context);
  }

  function logReturn(method, result, context = {}) {
    const timestamp = Date.now() - startTime;
    callTree.push({ timestamp, method: `← ${method}`, result, context, level: callTree.length });
    console.log(`[${timestamp}ms] ← ${method}`, { result: typeof result, ...context });
  }

  try {
    // Initialize services
    logCall('initializeServices');
    const mcpCompliance = new Context7MCPComplianceService(logger, config);
    const monitoring = new Context7MonitoringService(logger, config);
    const cache = new Context7AdvancedCacheService(logger, config);
    const enhanceTool = new EnhancedContext7EnhanceTool(logger, config, mcpCompliance, monitoring, cache);
    logReturn('initializeServices', 'success', { services: ['mcpCompliance', 'monitoring', 'cache', 'enhanceTool'] });

    // Test Context7 library resolution
    logCall('testContext7Resolution');
    const libraries = await mcpCompliance.resolveLibraryId('react');
    logReturn('testContext7Resolution', libraries.length, { count: libraries.length, success: libraries.length > 0 });

    // Test Context7 documentation
    let docsContent = '';
    if (libraries.length > 0) {
      logCall('testContext7Docs');
      const docs = await mcpCompliance.getLibraryDocumentation(libraries[0].id, 'components', 1000);
      docsContent = docs.content;
      logReturn('testContext7Docs', docs.content.length, { contentLength: docs.content.length, success: docs.content.length > 0 });
    }

    // Test enhancement
    logCall('testEnhancement');
    const enhancementStart = Date.now();
    const result = await enhanceTool.enhance({
      prompt: 'create a new hello page that is fancy, modern and fun',
      context: { framework: 'react', style: 'modern' }
    });
    const enhancementTime = Date.now() - enhancementStart;
    logReturn('testEnhancement', result.success, { 
      responseTime: enhancementTime,
      contextLengths: {
        repo_facts: result.context_used.repo_facts.length,
        code_snippets: result.context_used.code_snippets.length,
        context7_docs: result.context_used.context7_docs.length
      }
    });

    // Calculate scores
    const scores = {
      context7Resolution: libraries.length > 0 ? 100 : 0,
      context7Docs: docsContent.length > 0 ? 100 : 0,
      enhancementSuccess: result.success ? 100 : 0,
      context7DocsInEnhancement: result.context_used.context7_docs.length > 0 ? 100 : 0,
      repoFactsInEnhancement: result.context_used.repo_facts.length > 0 ? 100 : 0,
      codeSnippetsInEnhancement: result.context_used.code_snippets.length > 0 ? 100 : 0,
      responseTime: enhancementTime < 1000 ? 100 : Math.max(0, 100 - (enhancementTime - 1000) / 10)
    };

    const overallScore = Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length;

    // Generate report
    console.log('\n' + '='.repeat(60));
    console.log('📊 QUALITY CHECK RESULTS');
    console.log('='.repeat(60));

    console.log('\n🎯 SCORES:');
    console.log(`  Context7 Resolution:        ${scores.context7Resolution}/100`);
    console.log(`  Context7 Documentation:     ${scores.context7Docs}/100`);
    console.log(`  Enhancement Success:        ${scores.enhancementSuccess}/100`);
    console.log(`  Context7 Docs in Enhancement: ${scores.context7DocsInEnhancement}/100`);
    console.log(`  Repo Facts in Enhancement:   ${scores.repoFactsInEnhancement}/100`);
    console.log(`  Code Snippets in Enhancement: ${scores.codeSnippetsInEnhancement}/100`);
    console.log(`  Response Time:              ${scores.responseTime.toFixed(1)}/100`);
    console.log(`  Overall Score:              ${overallScore.toFixed(1)}/100`);

    console.log('\n📋 CALL TREE:');
    callTree.forEach(call => {
      const indent = '  '.repeat(call.level);
      const timestamp = call.timestamp.toString().padStart(4);
      console.log(`[${timestamp}ms] ${indent}${call.method}`);
      if (call.context && Object.keys(call.context).length > 0) {
        console.log(`[${timestamp}ms] ${indent}  Context:`, call.context);
      }
    });

    console.log('\n🚨 ISSUES:');
    const issues = [];
    if (scores.context7DocsInEnhancement === 0) issues.push('Context7 docs not populated in enhancement');
    if (scores.repoFactsInEnhancement === 0) issues.push('Repo facts not populated');
    if (scores.codeSnippetsInEnhancement === 0) issues.push('Code snippets not populated');
    if (scores.responseTime < 50) issues.push('Response time too slow');

    if (issues.length === 0) {
      console.log('  ✅ No issues found!');
    } else {
      issues.forEach((issue, i) => console.log(`  ${i + 1}. ${issue}`));
    }

    console.log('\n📈 METRICS:');
    console.log(`  Total Test Time: ${Date.now() - startTime}ms`);
    console.log(`  Enhancement Time: ${enhancementTime}ms`);
    console.log(`  Call Tree Depth: ${Math.max(...callTree.map(c => c.level)) + 1}`);
    console.log(`  Total Calls: ${callTree.length}`);

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('🔍 Error details:', error);
  }
}

runQualityCheck().catch(console.error);
