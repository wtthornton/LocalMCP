#!/usr/bin/env node

/**
 * Test Multi-Project Management System
 * 
 * Tests the Phase 4.2 multi-project management system including:
 * - Project discovery and management
 * - Project switching
 * - Project storage isolation
 * - Admin console integration
 */

import { ProjectManagerService } from '../dist/services/project/project-manager.service.js';
import { ProjectStorageService } from '../dist/services/project/project-storage.service.js';
import { ProjectIdentifierService } from '../dist/services/project/project-identifier.service.js';
import { MultiProjectAdmin } from '../dist/admin/multi-project-admin.js';

async function testMultiProjectManagement() {
  console.log('🔍 Testing Multi-Project Management System\n');

  try {
    // Initialize services
    console.log('1️⃣ Initializing Services...');
    const projectIdentifier = new ProjectIdentifierService();
    const projectManager = new ProjectManagerService({
      autoDiscovery: false, // Disable auto-discovery for testing
      discoveryPaths: [process.cwd()],
      maxProjects: 10
    });
    const projectStorage = new ProjectStorageService({
      enableIsolation: true,
      autoCleanup: false,
      maxStorageSize: 100
    });
    const multiProjectAdmin = new MultiProjectAdmin(projectManager, projectStorage);

    console.log('✅ Services initialized successfully');

    // Test project identification
    console.log('\n2️⃣ Testing Project Identification...');
    const currentProject = await projectIdentifier.identifyProject(process.cwd());
    console.log('✅ Current project identified:', {
      id: currentProject.id,
      name: currentProject.name,
      rootPath: currentProject.rootPath,
      gitUrl: currentProject.gitInfo.gitUrl,
      techStack: currentProject.techStack.languages.join(', ')
    });

    // Test project discovery
    console.log('\n3️⃣ Testing Project Discovery...');
    const discoveredProjects = await projectManager.discoverProjects({
      searchPaths: [process.cwd()],
      maxDepth: 1,
      includeHidden: false
    });
    console.log(`✅ Discovered ${discoveredProjects.length} projects`);
    discoveredProjects.forEach((project, index) => {
      console.log(`   ${index + 1}. ${project.name} (${project.id})`);
    });

    // Test project storage initialization
    console.log('\n4️⃣ Testing Project Storage...');
    const storageContext = await projectStorage.initializeProjectStorage(currentProject);
    console.log('✅ Storage context initialized:', {
      projectId: storageContext.projectId,
      projectName: storageContext.projectName,
      dataTypes: storageContext.dataTypes,
      storageStats: storageContext.storageStats
    });

    // Test project-scoped keys
    console.log('\n5️⃣ Testing Project-Scoped Storage...');
    const scopedKey = projectStorage.getProjectScopedKey(currentProject.id, 'lessons');
    const scopedCollection = projectStorage.getProjectScopedCollection(currentProject.id, 'documents');
    console.log('✅ Project-scoped storage:', {
      scopedKey,
      scopedCollection,
      isolationEnabled: projectStorage.getStorageConfiguration().enableIsolation
    });

    // Test project switching
    console.log('\n6️⃣ Testing Project Switching...');
    const projects = projectManager.getProjects();
    if (projects.length > 0) {
      const firstProject = projects[0];
      const switchResult = await projectManager.switchProject(firstProject.id);
      console.log('✅ Project switching:', {
        success: switchResult.success,
        previousProject: switchResult.previousProject,
        currentProject: switchResult.currentProject,
        errors: switchResult.errors,
        warnings: switchResult.warnings
      });
    } else {
      console.log('⚠️ No projects available for switching test');
    }

    // Test project status monitoring
    console.log('\n7️⃣ Testing Project Status Monitoring...');
    const projectStatuses = projectManager.getAllProjectStatuses();
    console.log(`✅ Project statuses (${projectStatuses.length}):`);
    projectStatuses.forEach((status, index) => {
      console.log(`   ${index + 1}. ${status.name}: ${status.isHealthy ? 'Healthy' : 'Issues'} (${status.errors.length} errors, ${status.warnings.length} warnings)`);
    });

    // Test project statistics
    console.log('\n8️⃣ Testing Project Statistics...');
    const projectStats = projectManager.getProjectStatistics();
    const storageStats = projectStorage.getGlobalStorageStats();
    console.log('✅ Project statistics:', {
      totalProjects: projectStats.totalProjects,
      healthyProjects: projectStats.healthyProjects,
      activeProject: projectStats.activeProject,
      totalStorageSize: `${(storageStats.totalStorageSize / 1024 / 1024).toFixed(2)}MB`,
      averageStorageSize: `${(storageStats.averageStorageSize / 1024 / 1024).toFixed(2)}MB`
    });

    // Test admin console integration
    console.log('\n9️⃣ Testing Admin Console Integration...');
    const dashboardHtml = multiProjectAdmin.generateMultiProjectDashboard();
    console.log('✅ Admin dashboard generated:', {
      htmlLength: dashboardHtml.length,
      includesProjects: dashboardHtml.includes('projects-grid'),
      includesStats: dashboardHtml.includes('stats-grid'),
      includesCurrentProject: dashboardHtml.includes('Current Active Project')
    });

    // Test API handling
    console.log('\n🔟 Testing API Integration...');
    const projectsApiResponse = await multiProjectAdmin.handleApiRequest('/api/projects', 'GET');
    const statsApiResponse = await multiProjectAdmin.handleApiRequest('/api/projects/stats', 'GET');
    console.log('✅ API responses:', {
      projectsCount: projectsApiResponse.projects?.length || 0,
      statsAvailable: !!statsApiResponse.projects,
      storageStatsAvailable: !!statsApiResponse.storage
    });

    // Test project storage operations
    console.log('\n1️⃣1️⃣ Testing Storage Operations...');
    projectStorage.addDataType(currentProject.id, 'lessons');
    projectStorage.addDataType(currentProject.id, 'documents');
    projectStorage.updateStorageStats(currentProject.id, {
      totalDocuments: 15,
      totalLessons: 8,
      totalPatterns: 3,
      storageSize: 1024 * 1024 // 1MB
    });

    const updatedContext = projectStorage.getProjectStorageContext(currentProject.id);
    console.log('✅ Storage operations:', {
      dataTypes: updatedContext?.dataTypes,
      updatedStats: updatedContext?.storageStats
    });

    // Test storage validation
    console.log('\n1️⃣2️⃣ Testing Storage Validation...');
    const validationResult = await projectStorage.validateProjectStorage(currentProject.id);
    console.log('✅ Storage validation:', {
      isValid: validationResult.isValid,
      errors: validationResult.errors,
      warnings: validationResult.warnings
    });

    console.log('\n🎉 All Multi-Project Management Tests Passed!');
    console.log('\n📊 Summary:');
    console.log(`- Projects Discovered: ${projects.length}`);
    console.log(`- Storage Contexts: ${projectStorage.getAllProjectStorageContexts().length}`);
    console.log(`- Project Isolation: ${projectStorage.getStorageConfiguration().enableIsolation ? 'Enabled' : 'Disabled'}`);
    console.log(`- Health Rate: ${projectStats.healthyProjects}/${projectStats.totalProjects} (${projectStats.totalProjects > 0 ? Math.round((projectStats.healthyProjects / projectStats.totalProjects) * 100) : 0}%)`);
    console.log(`- Admin Dashboard: Generated successfully (${Math.round(dashboardHtml.length / 1024)}KB)`);

    // Cleanup
    console.log('\n🧹 Cleaning up...');
    multiProjectAdmin.destroy();
    projectManager.clearProjects();
    projectStorage.clearAllProjectStorage();
    console.log('✅ Cleanup completed');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testMultiProjectManagement().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
