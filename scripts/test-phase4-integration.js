#!/usr/bin/env node

/**
 * Test Phase 4 Complete Integration
 * 
 * Tests the complete Phase 4 system integration including:
 * - Project identification and separation
 * - Multi-project management
 * - Lesson promotion system
 * - Cross-project analytics
 * - Shared knowledge base
 */

import { ProjectIdentifierService } from '../dist/services/project/project-identifier.service.js';
import { ProjectManagerService } from '../dist/services/project/project-manager.service.js';
import { ProjectStorageService } from '../dist/services/project/project-storage.service.js';
import { LessonPromotionService } from '../dist/services/learning/lesson-promotion.service.js';
import { CrossProjectAnalyticsService } from '../dist/services/learning/cross-project-analytics.service.js';
import { PromotionWorkflowService } from '../dist/services/learning/promotion-workflow.service.js';
import { SharedKnowledgeBaseService } from '../dist/services/learning/shared-knowledge-base.service.js';
import { MultiProjectAdmin } from '../dist/admin/multi-project-admin.js';

async function testPhase4Integration() {
  console.log('🔍 Testing Phase 4 Complete Integration\n');

  try {
    // Initialize all Phase 4 services
    console.log('1️⃣ Initializing Phase 4 Services...');
    const projectIdentifier = new ProjectIdentifierService();
    const projectManager = new ProjectManagerService({
      autoDiscovery: false,
      discoveryPaths: [process.cwd()],
      maxProjects: 10
    });
    const projectStorage = new ProjectStorageService({
      enableIsolation: true,
      autoCleanup: false,
      maxStorageSize: 100
    });
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
    const multiProjectAdmin = new MultiProjectAdmin(projectManager, projectStorage);

    console.log('✅ All Phase 4 services initialized successfully');

    // Test project identification and management
    console.log('\n2️⃣ Testing Project Identification & Management...');
    const currentProject = await projectIdentifier.identifyProject(process.cwd());
    console.log('✅ Current project identified:', {
      id: currentProject.id,
      name: currentProject.name,
      gitUrl: currentProject.gitInfo.gitUrl,
      techStack: currentProject.techStack.languages.join(', ')
    });

    // Test project discovery
    const discoveredProjects = await projectManager.discoverProjects({
      searchPaths: [process.cwd()],
      maxDepth: 1,
      includeHidden: false
    });
    console.log(`✅ Discovered ${discoveredProjects.length} projects`);

    // Test project storage initialization
    const storageContext = await projectStorage.initializeProjectStorage(currentProject);
    console.log('✅ Project storage initialized:', {
      projectId: storageContext.projectId,
      dataTypes: storageContext.dataTypes,
      storageStats: storageContext.storageStats
    });

    // Create mock lessons for testing
    console.log('\n3️⃣ Creating Mock Lessons for Testing...');
    const mockLessons = createMockLessons(currentProject);
    console.log(`✅ Created ${mockLessons.length} mock lessons`);

    // Test lesson promotion system
    console.log('\n4️⃣ Testing Lesson Promotion System...');
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

    // Promote lessons
    let promotedLessons = 0;
    for (const candidate of promotionCandidates.slice(0, 3)) {
      const promotionResult = await promotionService.promoteLesson(candidate);
      if (promotionResult.success) {
        promotedLessons++;
      }
    }
    console.log(`✅ Successfully promoted ${promotedLessons} lessons`);

    // Test shared knowledge base
    console.log('\n5️⃣ Testing Shared Knowledge Base...');
    const promotedLessonsList = promotionService.getPromotedLessons();
    for (const promotedLesson of promotedLessonsList) {
      await knowledgeBase.addSharedLesson(
        promotedLesson,
        promotedLesson.metadata.promotionScore || 0,
        promotedLesson.metadata.promotedFrom || promotedLesson.id,
        promotedLesson.metadata.promotedFromProject || 'unknown'
      );
    }
    console.log(`✅ Added ${promotedLessonsList.length} lessons to shared knowledge base`);

    // Test cross-project analytics
    console.log('\n6️⃣ Testing Cross-Project Analytics...');
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

    // Test admin console integration
    console.log('\n7️⃣ Testing Admin Console Integration...');
    const dashboardHtml = multiProjectAdmin.generateMultiProjectDashboard();
    console.log('✅ Admin dashboard generated:', {
      htmlLength: dashboardHtml.length,
      includesProjects: dashboardHtml.includes('projects-grid'),
      includesStats: dashboardHtml.includes('stats-grid'),
      includesCurrentProject: dashboardHtml.includes('Current Active Project')
    });

    // Test API integration
    const projectsApiResponse = await multiProjectAdmin.handleApiRequest('/api/projects', 'GET');
    const statsApiResponse = await multiProjectAdmin.handleApiRequest('/api/projects/stats', 'GET');
    console.log('✅ API integration:', {
      projectsCount: projectsApiResponse.projects?.length || 0,
      statsAvailable: !!statsApiResponse.projects,
      storageStatsAvailable: !!statsApiResponse.storage
    });

    // Test complete system integration
    console.log('\n8️⃣ Testing Complete System Integration...');
    
    // Test project switching
    const projects = projectManager.getProjects();
    if (projects.length > 1) {
      const switchResult = await projectManager.switchProject(projects[1].id);
      console.log('✅ Project switching:', {
        success: switchResult.success,
        currentProject: switchResult.currentProject,
        errors: switchResult.errors.length
      });
    }

    // Test knowledge base search
    const searchResults = knowledgeBase.searchLessons('authentication', {
      categories: ['best-practice'],
      minQuality: 0.7
    }, 5);
    console.log('✅ Knowledge base search:', {
      totalCount: searchResults.totalCount,
      returnedCount: searchResults.lessons.length,
      searchTime: `${searchResults.searchTime}ms`
    });

    // Test cross-project pattern analysis
    const crossProjectAnalysis = promotionService.analyzeCrossProjectPatterns(
      mockLessons,
      mockProjects
    );
    console.log('✅ Cross-project patterns:', {
      totalProjects: crossProjectAnalysis.totalProjects,
      analyzedProjects: crossProjectAnalysis.analyzedProjects,
      commonPatterns: crossProjectAnalysis.commonPatterns.slice(0, 3),
      promotionOpportunities: crossProjectAnalysis.promotionOpportunities
    });

    // Test workflow management
    const workflows = workflowService.getWorkflows();
    const executions = workflowService.getWorkflowExecutions();
    console.log('✅ Workflow management:', {
      availableWorkflows: workflows.length,
      completedExecutions: executions.filter(e => e.status === 'completed').length,
      failedExecutions: executions.filter(e => e.status === 'failed').length
    });

    // Test storage isolation
    console.log('\n9️⃣ Testing Storage Isolation...');
    const scopedKey = projectStorage.getProjectScopedKey(currentProject.id, 'lessons');
    const scopedCollection = projectStorage.getProjectScopedCollection(currentProject.id, 'documents');
    console.log('✅ Storage isolation:', {
      scopedKey,
      scopedCollection,
      isolationEnabled: projectStorage.getStorageConfiguration().enableIsolation
    });

    // Test project statistics
    console.log('\n🔟 Testing Project Statistics...');
    const projectStats = projectManager.getProjectStatistics();
    const storageStats = projectStorage.getGlobalStorageStats();
    const knowledgeBaseStats = knowledgeBase.getKnowledgeBaseStats();
    const promotionStats = promotionService.getPromotionStatistics();
    
    console.log('✅ System statistics:', {
      projects: {
        total: projectStats.totalProjects,
        healthy: projectStats.healthyProjects,
        healthRate: `${Math.round((projectStats.healthyProjects / projectStats.totalProjects) * 100)}%`
      },
      storage: {
        totalSize: `${(storageStats.totalStorageSize / 1024 / 1024).toFixed(2)}MB`,
        averageSize: `${(storageStats.averageStorageSize / 1024 / 1024).toFixed(2)}MB`
      },
      knowledgeBase: {
        totalLessons: knowledgeBaseStats.totalLessons,
        averageQuality: `${(knowledgeBaseStats.averageQuality * 100).toFixed(1)}%`,
        crossProjectCoverage: `${(knowledgeBaseStats.crossProjectCoverage * 100).toFixed(1)}%`
      },
      promotion: {
        totalPromoted: promotionStats.totalPromoted,
        successRate: `${(promotionStats.successRate * 100).toFixed(1)}%`,
        averageScore: promotionStats.averageScore.toFixed(1)
      }
    });

    console.log('\n🎉 Phase 4 Integration Tests Passed!');
    console.log('\n📊 Phase 4 Complete System Summary:');
    console.log(`- Projects Managed: ${projectStats.totalProjects}`);
    console.log(`- Project Health Rate: ${Math.round((projectStats.healthyProjects / projectStats.totalProjects) * 100)}%`);
    console.log(`- Lessons in Knowledge Base: ${knowledgeBaseStats.totalLessons}`);
    console.log(`- Knowledge Base Quality: ${(knowledgeBaseStats.averageQuality * 100).toFixed(1)}%`);
    console.log(`- Promotion Success Rate: ${(promotionStats.successRate * 100).toFixed(1)}%`);
    console.log(`- Cross-Project Patterns: ${crossProjectAnalysis.commonPatterns.length}`);
    console.log(`- Admin Dashboard: Generated successfully (${Math.round(dashboardHtml.length / 1024)}KB)`);
    console.log(`- Storage Isolation: ${projectStorage.getStorageConfiguration().enableIsolation ? 'Enabled' : 'Disabled'}`);

    // Cleanup
    console.log('\n🧹 Cleaning up...');
    promotionService.clearPromotionData();
    workflowService.clearAllData();
    knowledgeBase.clearAllData();
    analyticsService.clearCache();
    projectManager.clearProjects();
    projectStorage.clearAllProjectStorage();
    multiProjectAdmin.destroy();
    console.log('✅ Cleanup completed');

  } catch (error) {
    console.error('❌ Phase 4 integration test failed:', error);
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
    }
  ];

  return mockLessons;
}

// Run the test
testPhase4Integration().catch(error => {
  console.error('❌ Phase 4 integration test execution failed:', error);
  process.exit(1);
});
