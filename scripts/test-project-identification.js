#!/usr/bin/env node

/**
 * Test Project Identification System
 * 
 * Tests the new Phase 4 project identification system with specialized services.
 * Validates git detection, project structure analysis, and tech stack detection.
 */

import { ProjectIdentifierService } from '../dist/services/project/project-identifier.service.js';
import { GitDetectorService } from '../dist/services/project/git-detector.service.js';
import { ProjectStructureService } from '../dist/services/project/project-structure.service.js';
import { TechStackDetectorService } from '../dist/services/project/tech-stack-detector.service.js';

async function testProjectIdentification() {
  console.log('🔍 Testing Project Identification System\n');

  const projectPath = process.cwd();
  console.log(`📁 Testing with project path: ${projectPath}\n`);

  try {
    // Test individual services
    console.log('1️⃣ Testing Git Detector Service...');
    const gitDetector = new GitDetectorService();
    const gitInfo = await gitDetector.detectGitInfo(projectPath);
    console.log('✅ Git Info:', {
      isGitRepo: gitInfo.isGitRepo,
      gitUrl: gitInfo.gitUrl,
      gitBranch: gitInfo.gitBranch,
      gitCommit: gitInfo.gitCommit?.substring(0, 8) + '...'
    });

    console.log('\n2️⃣ Testing Project Structure Service...');
    const structureDetector = new ProjectStructureService();
    const structure = await structureDetector.analyzeStructure(projectPath);
    console.log('✅ Project Structure:', {
      type: structure.type,
      hasApps: structure.hasApps,
      hasLibraries: structure.hasLibraries,
      hasSrc: structure.hasSrc,
      components: structure.components,
      layers: structure.layers,
      architecture: {
        isModular: structure.architecture.isModular,
        separationLevel: structure.architecture.separationLevel,
        patterns: structure.architecture.patterns
      }
    });

    console.log('\n3️⃣ Testing Tech Stack Detector Service...');
    const techStackDetector = new TechStackDetectorService();
    const techStack = await techStackDetector.detectTechStack(projectPath);
    console.log('✅ Tech Stack:', {
      languages: techStack.languages,
      frameworks: techStack.frameworks,
      buildTools: techStack.buildTools,
      testing: techStack.testing,
      styling: techStack.styling,
      devTools: techStack.devTools,
      packageManager: techStack.packageManager,
      complexity: techStack.metadata.complexity
    });

    console.log('\n4️⃣ Testing Complete Project Identification...');
    const projectIdentifier = new ProjectIdentifierService();
    const projectMetadata = await projectIdentifier.identifyProject(projectPath);
    console.log('✅ Project Metadata:', {
      id: projectMetadata.id,
      name: projectMetadata.name,
      rootPath: projectMetadata.rootPath,
      gitInfo: {
        isGitRepo: projectMetadata.gitInfo.isGitRepo,
        gitUrl: projectMetadata.gitInfo.gitUrl,
        gitBranch: projectMetadata.gitInfo.gitBranch
      },
      projectStructure: {
        type: projectMetadata.projectStructure.type,
        architecture: projectMetadata.projectStructure.architecture.separationLevel
      },
      techStack: {
        languages: projectMetadata.techStack.languages,
        frameworks: projectMetadata.techStack.frameworks,
        complexity: projectMetadata.techStack.metadata.complexity
      },
      createdAt: projectMetadata.createdAt.toISOString(),
      lastAccessed: projectMetadata.lastAccessed.toISOString()
    });

    console.log('\n5️⃣ Testing Project Validation...');
    const validation = await projectIdentifier.validateProject(projectPath);
    console.log('✅ Validation Result:', {
      isValid: validation.isValid,
      errors: validation.errors,
      warnings: validation.warnings
    });

    console.log('\n6️⃣ Testing Tech Stack Analysis...');
    const techAnalysis = await techStackDetector.getTechStackAnalysis(projectPath);
    console.log('✅ Tech Stack Analysis:', {
      recommendations: techAnalysis.recommendations,
      warnings: techAnalysis.warnings,
      compatibility: {
        score: techAnalysis.compatibility.score,
        issues: techAnalysis.compatibility.issues
      }
    });

    console.log('\n7️⃣ Testing Structure Analysis...');
    const structureAnalysis = await structureDetector.getAnalysisWithRecommendations(projectPath);
    console.log('✅ Structure Analysis:', {
      score: structureAnalysis.score,
      recommendations: structureAnalysis.recommendations,
      isValid: structureAnalysis.isValid
    });

    console.log('\n🎉 All Project Identification Tests Passed!');
    console.log('\n📊 Summary:');
    console.log(`- Project ID: ${projectMetadata.id}`);
    console.log(`- Project Name: ${projectMetadata.name}`);
    console.log(`- Git Repository: ${gitInfo.isGitRepo ? 'Yes' : 'No'}`);
    console.log(`- Project Type: ${structure.type}`);
    console.log(`- Architecture: ${structure.architecture.separationLevel} separation`);
    console.log(`- Tech Stack: ${techStack.languages.join(', ')} with ${techStack.frameworks.join(', ')}`);
    console.log(`- Complexity: ${techStack.metadata.complexity}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testProjectIdentification().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
