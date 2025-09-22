#!/usr/bin/env node

/**
 * Test PromptMCP enhance tool with girly hello world request
 */

import { EnhancedContext7EnhanceTool } from './dist/tools/enhanced-context7-enhance.tool.js';
import { Logger } from './dist/services/logger/logger.js';
import { ConfigService } from './dist/config/config.service.js';
import { Context7RealIntegrationService } from './dist/services/context7/context7-real-integration.service.js';
import { FrameworkDetectorService } from './dist/services/framework-detector/framework-detector.service.js';
import { PromptCacheService } from './dist/services/cache/prompt-cache.service.js';
import { ProjectContextAnalyzer } from './dist/services/framework-detector/project-context-analyzer.service.js';
import { Context7MonitoringService } from './dist/services/context7/context7-monitoring.service.js';
import { CacheAnalyticsService } from './dist/services/cache/cache-analytics.service.js';
import { Context7CacheService } from './dist/services/framework-detector/context7-cache.service.js';
import { Context7AdvancedCacheService } from './dist/services/context7/context7-advanced-cache.service.js';

async function testGirlyHelloWorld() {
  console.log('🌸 Testing PromptMCP with girly hello world request...\n');

  try {
    // Initialize dependencies
    console.log('📦 Initializing dependencies...');
    const logger = new Logger();
    const config = new ConfigService();
    const realContext7 = new Context7RealIntegrationService(logger, config);
    const frameworkCache = new Context7CacheService();
    const frameworkDetector = new FrameworkDetectorService(realContext7, frameworkCache);
    const promptCache = new PromptCacheService(logger, config);
    const projectAnalyzer = new ProjectContextAnalyzer(logger);
    const monitoring = new Context7MonitoringService(logger);
    const cache = new Context7AdvancedCacheService(logger, config);
    const cacheAnalytics = new CacheAnalyticsService(logger, cache, promptCache);
    
    // Create enhance tool with dependencies
    const enhanceTool = new EnhancedContext7EnhanceTool(
      logger,
      config,
      realContext7,
      frameworkDetector,
      promptCache,
      projectAnalyzer,
      monitoring,
      cacheAnalytics
    );
    
    const testRequest = {
      prompt: "Create a slick girly hello world page",
      context: {
        framework: "html/css/javascript",
        style: "modern, girly, pink, cute, animated"
      }
    };

    console.log('🌸 Original prompt:', testRequest.prompt);
    console.log('💅 Context:', testRequest.context);
    console.log('\n⏳ Enhancing prompt...\n');

    const result = await enhanceTool.enhance(testRequest);
    
    console.log('✨ Enhanced prompt:');
    console.log('='.repeat(80));
    console.log(result.enhanced_prompt);
    console.log('='.repeat(80));
    console.log('\n📊 Context used:');
    console.log(JSON.stringify(result.context_used, null, 2));
    console.log('\n✅ Success:', result.success);
    
    if (result.error) {
      console.log('❌ Error:', result.error);
    }
    
    console.log('\n🌸 Girly Hello World test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testGirlyHelloWorld();
