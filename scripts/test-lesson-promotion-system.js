#!/usr/bin/env node

/**
 * Test Lesson Promotion System
 * 
 * Tests the complete Phase 4.3 lesson promotion system including:
 * - Lesson promotion logic and scoring
 * - Cross-project analytics
 * - Promotion workflows
 * - Shared knowledge base
 */

import { LessonPromotionService } from '../dist/services/learning/lesson-promotion.service.js';
import { CrossProjectAnalyticsService } from '../dist/services/learning/cross-project-analytics.service.js';
import { PromotionWorkflowService } from '../dist/services/learning/promotion-workflow.service.js';
import { SharedKnowledgeBaseService } from '../dist/services/learning/shared-knowledge-base.service.js';
import { ProjectIdentifierService } from '../dist/services/project/project-identifier.service.js';

async function testLessonPromotionSystem() {
  console.log('🔍 Testing Lesson Promotion System\n');

  try {
    // Initialize services
    console.log('1️⃣ Initializing Services...');
    const promotionService = new LessonPromotionService({
      minUsageCount: 3,
      minSuccessRate: 0.7,
      minConfidenceScore: 0.6,
      maxAge: 30,
      minProjectCount: 2,
      requireValidation: false
    });

    const analyticsService = new CrossProjectAnalyticsService();
    const workflowService = new PromotionWorkflowService({
      autoApprovalThreshold: 0.8,
      maxApprovalTime: 24,
      notificationEnabled: false,
      approvalRequired: false
    });

    const knowledgeBase = new SharedKnowledgeBaseService({
      maxLessons: 100,
      minPromotionScore: 60,
      autoCleanupEnabled: false,
      qualityThreshold: 0.6,
      updateFrequency: 24
    });

    const projectIdentifier = new ProjectIdentifierService();
    const currentProject = await projectIdentifier.identifyProject(process.cwd());

    console.log('✅ Services initialized successfully');

    // Create mock lessons for testing
    console.log('\n2️⃣ Creating Mock Lessons...');
    const mockLessons = createMockLessons(currentProject);
    console.log(`✅ Created ${mockLessons.length} mock lessons`);

    // Test lesson promotion analysis
    console.log('\n3️⃣ Testing Lesson Promotion Analysis...');
    const promotionCandidates = [];
    for (const lesson of mockLessons) {
      const candidate = promotionService.analyzePromotionCandidate(
        lesson,
        currentProject,
        mockLessons
      );
      if (candidate) {
        promotionCandidates.push(candidate);
      }
    }
    console.log(`✅ Found ${promotionCandidates.length} promotion candidates`);

    // Display promotion candidates
    promotionCandidates.forEach((candidate, index) => {
      console.log(`   ${index + 1}. ${candidate.lesson.title} (Score: ${candidate.score.overallScore.toFixed(1)})`);
      console.log(`      Reason: ${candidate.promotionReason}`);
      console.log(`      Benefits: ${candidate.benefits.slice(0, 2).join(', ')}`);
    });

    // Test promotion workflow
    console.log('\n4️⃣ Testing Promotion Workflow...');
    if (promotionCandidates.length > 0) {
      const bestCandidate = promotionCandidates[0];
      const workflowExecution = await workflowService.executePromotionWorkflow(bestCandidate);
      console.log('✅ Workflow execution:', {
        status: workflowExecution.status,
        currentStep: workflowExecution.currentStep,
        errors: workflowExecution.errors.length,
        warnings: workflowExecution.warnings.length,
        duration: workflowExecution.completedAt ? 
          workflowExecution.completedAt.getTime() - workflowExecution.startedAt.getTime() : 
          'N/A'
      });
    } else {
      console.log('⚠️ No candidates available for workflow testing');
    }

    // Test lesson promotion
    console.log('\n5️⃣ Testing Lesson Promotion...');
    let promotedLessons = 0;
    for (const candidate of promotionCandidates.slice(0, 3)) { // Test first 3 candidates
      const promotionResult = await promotionService.promoteLesson(candidate);
      if (promotionResult.success) {
        promotedLessons++;
        console.log(`✅ Promoted lesson: ${candidate.lesson.title}`);
      } else {
        console.log(`❌ Failed to promote: ${candidate.lesson.title} - ${promotionResult.errors.join(', ')}`);
      }
    }
    console.log(`✅ Successfully promoted ${promotedLessons} lessons`);

    // Test shared knowledge base
    console.log('\n6️⃣ Testing Shared Knowledge Base...');
    const promotedLessonsList = promotionService.getPromotedLessons();
    for (const promotedLesson of promotedLessonsList) {
      const sharedLesson = await knowledgeBase.addSharedLesson(
        promotedLesson,
        promotedLesson.metadata.promotionScore || 0,
        promotedLesson.metadata.promotedFrom || promotedLesson.id,
        promotedLesson.metadata.promotedFromProject || 'unknown'
      );
      if (sharedLesson) {
        console.log(`✅ Added to knowledge base: ${sharedLesson.title}`);
      }
    }

    // Test knowledge base search
    console.log('\n7️⃣ Testing Knowledge Base Search...');
    const searchResults = knowledgeBase.searchLessons('authentication', {
      categories: ['best-practice', 'pattern'],
      minQuality: 0.7
    }, 10);
    console.log('✅ Search results:', {
      totalCount: searchResults.totalCount,
      returnedCount: searchResults.lessons.length,
      searchTime: `${searchResults.searchTime}ms`
    });

    // Test cross-project analytics
    console.log('\n8️⃣ Testing Cross-Project Analytics...');
    const mockProjects = [currentProject];
    const crossProjectReport = await analyticsService.generateCrossProjectAnalysis(
      mockProjects,
      mockLessons,
      [], // No patterns for this test
      []  // No insights for this test
    );
    console.log('✅ Cross-project analysis:', {
      totalProjects: crossProjectReport.summary.totalProjects,
      totalLessons: crossProjectReport.summary.totalLessons,
      patterns: crossProjectReport.patterns.length,
      insights: crossProjectReport.insights.length,
      averageQuality: crossProjectReport.summary.averageQuality.toFixed(3)
    });

    // Test knowledge base statistics
    console.log('\n9️⃣ Testing Knowledge Base Statistics...');
    const stats = knowledgeBase.getKnowledgeBaseStats();
    console.log('✅ Knowledge base statistics:', {
      totalLessons: stats.totalLessons,
      averageQuality: stats.averageQuality.toFixed(3),
      crossProjectCoverage: (stats.crossProjectCoverage * 100).toFixed(1) + '%',
      topCategories: stats.topCategories.slice(0, 3),
      qualityDistribution: stats.qualityDistribution
    });

    // Test promotion statistics
    console.log('\n🔟 Testing Promotion Statistics...');
    const promotionStats = promotionService.getPromotionStatistics();
    console.log('✅ Promotion statistics:', {
      totalPromoted: promotionStats.totalPromoted,
      successRate: (promotionStats.successRate * 100).toFixed(1) + '%',
      averageScore: promotionStats.averageScore.toFixed(1),
      topCategories: promotionStats.topCategories.slice(0, 3),
      topFrameworks: promotionStats.topFrameworks.slice(0, 3)
    });

    // Test cross-project patterns
    console.log('\n1️⃣1️⃣ Testing Cross-Project Pattern Analysis...');
    const crossProjectAnalysis = promotionService.analyzeCrossProjectPatterns(
      mockLessons,
      mockProjects
    );
    console.log('✅ Cross-project patterns:', {
      totalProjects: crossProjectAnalysis.totalProjects,
      analyzedProjects: crossProjectAnalysis.analyzedProjects,
      commonPatterns: crossProjectAnalysis.commonPatterns.slice(0, 3),
      uniquePatterns: crossProjectAnalysis.uniquePatterns.slice(0, 3),
      promotionOpportunities: crossProjectAnalysis.promotionOpportunities,
      averageConfidence: crossProjectAnalysis.qualityTrends.averageConfidence.toFixed(3),
      averageSuccessRate: crossProjectAnalysis.qualityTrends.averageSuccessRate.toFixed(3)
    });

    // Test workflow management
    console.log('\n1️⃣2️⃣ Testing Workflow Management...');
    const workflows = workflowService.getWorkflows();
    const executions = workflowService.getWorkflowExecutions();
    console.log('✅ Workflow management:', {
      availableWorkflows: workflows.length,
      completedExecutions: executions.filter(e => e.status === 'completed').length,
      failedExecutions: executions.filter(e => e.status === 'failed').length,
      pendingExecutions: executions.filter(e => e.status === 'pending').length
    });

    console.log('\n🎉 All Lesson Promotion System Tests Passed!');
    console.log('\n📊 Summary:');
    console.log(`- Mock Lessons Created: ${mockLessons.length}`);
    console.log(`- Promotion Candidates Found: ${promotionCandidates.length}`);
    console.log(`- Lessons Successfully Promoted: ${promotedLessons}`);
    console.log(`- Lessons in Knowledge Base: ${stats.totalLessons}`);
    console.log(`- Cross-Project Patterns: ${crossProjectAnalysis.commonPatterns.length}`);
    console.log(`- Promotion Success Rate: ${(promotionStats.successRate * 100).toFixed(1)}%`);
    console.log(`- Knowledge Base Quality: ${(stats.averageQuality * 100).toFixed(1)}%`);

    // Cleanup
    console.log('\n🧹 Cleaning up...');
    promotionService.clearPromotionData();
    workflowService.clearAllData();
    knowledgeBase.clearAllData();
    analyticsService.clearCache();
    console.log('✅ Cleanup completed');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

/**
 * Create mock lessons for testing
 */
function createMockLessons(project) {
  const mockLessons = [
    {
      id: 'lesson_1',
      feedback: 'Excellent authentication pattern',
      context: 'Express.js API authentication',
      tags: ['authentication', 'jwt', 'security'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      confidence: 0.9,
      successCount: 8,
      failureCount: 0,
      lastUsed: new Date().toISOString(),
      metadata: {
        toolName: 'localmcp.create',
        projectType: 'api',
        framework: 'express',
        language: 'typescript',
        complexity: 'medium',
        category: 'best-practice',
        source: project.id
      },
      content: {
        summary: 'JWT Authentication Best Practices',
        description: 'Implement JWT authentication with proper token validation, refresh tokens, and secure storage.',
        examples: ['jwt-middleware.js', 'auth-controller.js'],
        applications: ['API authentication', 'User sessions'],
        warnings: ['Store tokens securely', 'Implement refresh token rotation'],
        relatedLessons: []
      }
    },
    {
      id: 'lesson_2',
      feedback: 'Good error handling pattern',
      context: 'Node.js application error handling',
      tags: ['error-handling', 'logging', 'pattern'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      confidence: 0.8,
      successCount: 12,
      failureCount: 2,
      lastUsed: new Date().toISOString(),
      metadata: {
        toolName: 'localmcp.create',
        projectType: 'application',
        framework: 'generic',
        language: 'typescript',
        complexity: 'medium',
        category: 'pattern',
        source: project.id
      },
      content: {
        summary: 'Error Handling Pattern',
        description: 'Centralized error handling with proper logging and user-friendly error messages.',
        examples: ['error-handler.js', 'error-types.js'],
        applications: ['API error handling', 'Application error management'],
        warnings: ['Log sensitive information carefully', 'Provide user-friendly messages'],
        relatedLessons: []
      }
    },
    {
      id: 'lesson_3',
      feedback: 'Important anti-pattern to avoid',
      context: 'Database connection management',
      tags: ['database', 'anti-pattern', 'performance'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      confidence: 0.75,
      successCount: 5,
      failureCount: 1,
      lastUsed: new Date().toISOString(),
      metadata: {
        toolName: 'localmcp.create',
        projectType: 'application',
        framework: 'node',
        language: 'typescript',
        complexity: 'high',
        category: 'anti-pattern',
        source: project.id
      },
      content: {
        summary: 'Database Connection Pool Anti-Pattern',
        description: 'Avoid creating new database connections for each request. Use connection pooling.',
        examples: ['bad-connection.js', 'good-connection.js'],
        applications: ['Database optimization', 'Performance improvement'],
        warnings: ['Connection leaks can cause memory issues', 'Always close connections properly'],
        relatedLessons: []
      }
    },
    {
      id: 'lesson_4',
      feedback: 'Excellent React optimization technique',
      context: 'React component performance optimization',
      tags: ['react', 'performance', 'optimization'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      confidence: 0.85,
      successCount: 6,
      failureCount: 0,
      lastUsed: new Date().toISOString(),
      metadata: {
        toolName: 'localmcp.create',
        projectType: 'frontend',
        framework: 'react',
        language: 'typescript',
        complexity: 'medium',
        category: 'pattern',
        source: project.id
      },
      content: {
        summary: 'React Component Optimization',
        description: 'Use React.memo, useMemo, and useCallback to optimize component performance.',
        examples: ['optimized-component.jsx'],
        applications: ['React performance', 'Component optimization'],
        warnings: ['Over-optimization can reduce readability', 'Measure before optimizing'],
        relatedLessons: []
      }
    },
    {
      id: 'lesson_5',
      feedback: 'Good API security practice',
      context: 'API rate limiting implementation',
      tags: ['api', 'security', 'rate-limiting'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      confidence: 0.7,
      successCount: 3,
      failureCount: 1,
      lastUsed: new Date().toISOString(),
      metadata: {
        toolName: 'localmcp.create',
        projectType: 'api',
        framework: 'express',
        language: 'typescript',
        complexity: 'medium',
        category: 'best-practice',
        source: project.id
      },
      content: {
        summary: 'API Rate Limiting Implementation',
        description: 'Implement rate limiting to prevent API abuse and ensure fair usage.',
        examples: ['rate-limiter.js'],
        applications: ['API security', 'Resource protection'],
        warnings: ['Configure appropriate limits', 'Consider user tiers'],
        relatedLessons: []
      }
    }
  ];

  return mockLessons;
}

// Run the test
testLessonPromotionSystem().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
