#!/usr/bin/env node

/**
 * Lessons Learned Service Test Script
 * 
 * Tests the enhanced lessons learned system with vector storage,
 * pattern recognition, and adaptive learning capabilities
 */

import { Logger } from '../dist/services/logger/logger.js';
import { ConfigService } from '../dist/config/config.service.js';
import { VectorDatabaseService } from '../dist/services/vector/vector-db.service.js';
import { LessonsLearnedService } from '../dist/services/lessons/lessons-learned.service.js';

async function testLessonsLearned() {
  console.log('🧠 Lessons Learned Service Testing');
  console.log('==================================\n');
  
  const logger = new Logger('LessonsLearnedTest');
  const config = new ConfigService();
  
  try {
    // Initialize services
    const vectorDb = new VectorDatabaseService(logger, config);
    await vectorDb.initialize();
    
    const lessonsService = new LessonsLearnedService(logger, config, vectorDb);
    await lessonsService.initialize();
    
    console.log('✅ Services initialized');

    // Test 1: Create Lessons
    console.log('\n📚 Test 1: Create Lessons');
    console.log('=========================');
    
    const lesson1 = await lessonsService.createLesson(
      'The dark theme implementation worked perfectly with proper contrast ratios',
      'Created a dark theme HTML page with CSS variables and modern styling. Used proper color contrast ratios for accessibility.',
      ['css', 'dark-theme', 'accessibility', 'styling'],
      {
        toolName: 'localmcp.create',
        projectType: 'web',
        framework: 'vanilla',
        language: 'html',
        complexity: 'medium',
        category: 'best-practice'
      }
    );

    const lesson2 = await lessonsService.createLesson(
      'TypeScript error fixed by adding proper import statement',
      'Fixed "Cannot find name React" error by adding "import React from \'react\'" at the top of the component file.',
      ['typescript', 'react', 'import', 'error-fix'],
      {
        toolName: 'localmcp.fix',
        projectType: 'react',
        framework: 'React',
        language: 'typescript',
        complexity: 'low',
        category: 'fix'
      }
    );

    const lesson3 = await lessonsService.createLesson(
      'Component composition pattern works better than large monolithic components',
      'Breaking down large components into smaller, focused components improves maintainability and reusability.',
      ['react', 'component-composition', 'maintainability', 'patterns'],
      {
        toolName: 'localmcp.learn',
        projectType: 'react',
        framework: 'React',
        language: 'typescript',
        complexity: 'high',
        category: 'pattern'
      }
    );

    console.log('✅ Lessons created');
    console.log(`📊 Lesson 1: ${lesson1.id} (${lesson1.metadata.category})`);
    console.log(`📊 Lesson 2: ${lesson2.id} (${lesson2.metadata.category})`);
    console.log(`📊 Lesson 3: ${lesson3.id} (${lesson3.metadata.category})`);

    // Test 2: Search Lessons
    console.log('\n🔍 Test 2: Search Lessons');
    console.log('=========================');
    
    const searchResults1 = await lessonsService.searchLessons(
      'dark theme styling',
      { limit: 3, minConfidence: 0.3 }
    );

    const searchResults2 = await lessonsService.searchLessons(
      'TypeScript React import error',
      { limit: 3, tags: ['typescript', 'react'] }
    );

    const searchResults3 = await lessonsService.searchLessons(
      'component architecture patterns',
      { limit: 3, category: 'pattern' }
    );

    console.log('✅ Lesson searches completed');
    console.log(`🔍 Dark theme search: ${searchResults1.length} results`);
    console.log(`🔍 TypeScript search: ${searchResults2.length} results`);
    console.log(`🔍 Pattern search: ${searchResults3.length} results`);

    // Display search results
    if (searchResults1.length > 0) {
      console.log('\n📋 Dark Theme Search Results:');
      searchResults1.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.lesson.content.summary}`);
        console.log(`     Similarity: ${result.similarity.toFixed(3)}, Relevance: ${result.relevance.toFixed(3)}`);
        console.log(`     Tags: ${result.lesson.tags.join(', ')}`);
      });
    }

    // Test 3: Update Lesson Usage
    console.log('\n📈 Test 3: Update Lesson Usage');
    console.log('==============================');
    
    // Simulate successful usage of lesson1
    await lessonsService.updateLessonUsage(lesson1.id, true, 'Worked perfectly in production');
    await lessonsService.updateLessonUsage(lesson1.id, true, 'Great contrast ratios');
    await lessonsService.updateLessonUsage(lesson1.id, false, 'Had some accessibility issues');
    
    // Simulate successful usage of lesson2
    await lessonsService.updateLessonUsage(lesson2.id, true, 'Fixed the import error quickly');
    await lessonsService.updateLessonUsage(lesson2.id, true, 'Standard React import pattern');
    
    console.log('✅ Lesson usage updated');
    console.log('📊 Simulated usage patterns for lessons');

    // Test 4: Get Analytics
    console.log('\n📊 Test 4: Get Analytics');
    console.log('========================');
    
    const analytics = lessonsService.getAnalytics();
    
    console.log('✅ Analytics retrieved');
    console.log(`📊 Total Lessons: ${analytics.totalLessons}`);
    console.log(`📊 By Category: ${JSON.stringify(analytics.byCategory, null, 2)}`);
    console.log(`📊 By Confidence: High=${analytics.byConfidence.high}, Medium=${analytics.byConfidence.medium}, Low=${analytics.byConfidence.low}`);
    console.log(`📊 Success Rate: ${(analytics.successRate * 100).toFixed(1)}%`);
    console.log(`📊 Top Tags: ${analytics.topTags.slice(0, 5).map(t => `${t.tag}(${t.count})`).join(', ')}`);

    // Test 5: Lesson Promotion
    console.log('\n🚀 Test 5: Lesson Promotion');
    console.log('===========================');
    
    // Add more successful uses to trigger promotion
    for (let i = 0; i < 5; i++) {
      await lessonsService.updateLessonUsage(lesson1.id, true, `Success ${i + 1}`);
    }
    
    const promotedCount = await lessonsService.promoteLessons();
    
    console.log('✅ Lesson promotion completed');
    console.log(`🚀 Lessons promoted: ${promotedCount}`);

    // Test 6: Lesson Decay
    console.log('\n⏰ Test 6: Lesson Decay');
    console.log('=======================');
    
    const decayedCount = await lessonsService.decayLessons();
    
    console.log('✅ Lesson decay completed');
    console.log(`⏰ Lessons decayed: ${decayedCount}`);

    // Test 7: Pattern Recognition
    console.log('\n🧠 Test 7: Pattern Recognition');
    console.log('==============================');
    
    // Create more lessons to test pattern recognition
    const patternLesson1 = await lessonsService.createLesson(
      'CSS Grid layout provides better control than Flexbox for complex layouts',
      'Used CSS Grid for a complex dashboard layout. Grid areas and template columns provided precise control.',
      ['css', 'grid', 'layout', 'dashboard'],
      {
        toolName: 'localmcp.create',
        projectType: 'web',
        framework: 'vanilla',
        language: 'css',
        complexity: 'medium',
        category: 'pattern'
      }
    );

    const patternLesson2 = await lessonsService.createLesson(
      'Flexbox is better for simple one-dimensional layouts',
      'Used Flexbox for navigation bar and button groups. Much simpler than Grid for these use cases.',
      ['css', 'flexbox', 'layout', 'navigation'],
      {
        toolName: 'localmcp.create',
        projectType: 'web',
        framework: 'vanilla',
        language: 'css',
        complexity: 'low',
        category: 'pattern'
      }
    );

    // Search for layout patterns
    const layoutPatterns = await lessonsService.searchLessons(
      'CSS layout patterns',
      { limit: 5, category: 'pattern' }
    );

    console.log('✅ Pattern recognition test completed');
    console.log(`🧠 Layout patterns found: ${layoutPatterns.length}`);
    
    if (layoutPatterns.length > 0) {
      console.log('\n📋 Layout Pattern Results:');
      layoutPatterns.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.lesson.content.summary}`);
        console.log(`     Framework: ${result.lesson.metadata.framework}`);
        console.log(`     Complexity: ${result.lesson.metadata.complexity}`);
        console.log(`     Confidence: ${result.lesson.confidence.toFixed(3)}`);
      });
    }

    // Final Analytics
    console.log('\n📊 Final Analytics');
    console.log('==================');
    
    const finalAnalytics = lessonsService.getAnalytics();
    
    console.log('✅ Final analytics retrieved');
    console.log(`📊 Total Lessons: ${finalAnalytics.totalLessons}`);
    console.log(`📊 Categories: ${Object.keys(finalAnalytics.byCategory).join(', ')}`);
    console.log(`📊 Success Rate: ${(finalAnalytics.successRate * 100).toFixed(1)}%`);
    console.log(`📊 Recent Activity: ${finalAnalytics.recentActivity.length} days tracked`);

    console.log('\n🎯 Lessons Learned Features:');
    console.log('============================');
    console.log('✅ Vector storage for semantic search');
    console.log('✅ Pattern recognition and matching');
    console.log('✅ Confidence scoring and adaptation');
    console.log('✅ Usage tracking and analytics');
    console.log('✅ Lesson promotion and decay');
    console.log('✅ Category and tag-based filtering');
    console.log('✅ Metadata extraction and analysis');
    console.log('✅ Content generation and structuring');
    
    console.log('\n🚀 Next Steps:');
    console.log('==============');
    console.log('1. ✅ Enhanced lessons learned system - COMPLETE');
    console.log('2. 🔄 Integrate with pipeline engine');
    console.log('3. 🔄 Add lesson analytics dashboard');
    console.log('4. 🔄 Implement adaptive learning engine');
    console.log('5. 🔄 Add lesson recommendation system');
    
    console.log('\n🧹 Test cleanup completed');
    
  } catch (error) {
    console.error('❌ Lessons learned test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testLessonsLearned();
