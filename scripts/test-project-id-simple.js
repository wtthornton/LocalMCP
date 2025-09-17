#!/usr/bin/env node

/**
 * Simple Project Identification Test
 * 
 * Tests just the project identification system without the complex pipeline dependencies.
 * This allows us to validate the core Phase 4 functionality.
 */

import { ProjectIdentifierService } from '../dist/services/project/project-identifier.service.js';
import { GitDetectorService } from '../dist/services/project/git-detector.service.js';
import { ProjectStructureService } from '../dist/services/project/project-structure.service.js';
import { TechStackDetectorService } from '../dist/services/project/tech-stack-detector.service.js';

async function testProjectIdentificationSimple() {
  console.log('🔍 Testing Project Identification System (Simple)\n');

  const projectPath = process.cwd();
  console.log(`📁 Testing with project path: ${projectPath}\n`);

  try {
    // Test individual services
    console.log('1️⃣ Testing Git Detector Service...');
    const gitDetector = new GitDetectorService();
    const gitInfo = await gitDetector.detectGitInfo(projectPath);
    console.log('✅ Git Info:', {
      isGitRepo: gitInfo.isGitRepo,
      gitUrl: gitInfo.gitUrl || 'No remote URL',
      gitBranch: gitInfo.gitBranch || 'No branch',
      gitCommit: gitInfo.gitCommit?.substring(0, 8) + '...' || 'No commit'
    });

    console.log('\n2️⃣ Testing Project Structure Service...');
    const structureDetector = new ProjectStructureService();
    const structure = await structureDetector.analyzeStructure(projectPath);
    console.log('✅ Project Structure:', {
      type: structure.type,
      hasApps: structure.hasApps,
      hasLibraries: structure.hasLibraries,
      hasSrc: structure.hasSrc,
      components: structure.components.slice(0, 3), // Show first 3
      layers: structure.layers.slice(0, 5), // Show first 5
      architecture: {
        isModular: structure.architecture.isModular,
        separationLevel: structure.architecture.separationLevel,
        patterns: structure.architecture.patterns.slice(0, 3) // Show first 3
      }
    });

    console.log('\n3️⃣ Testing Tech Stack Detector Service...');
    const techStackDetector = new TechStackDetectorService();
    const techStack = await techStackDetector.detectTechStack(projectPath);
    console.log('✅ Tech Stack:', {
      languages: techStack.languages,
      frameworks: techStack.frameworks.slice(0, 3), // Show first 3
      buildTools: techStack.buildTools.slice(0, 3), // Show first 3
      testing: techStack.testing.slice(0, 3), // Show first 3
      styling: techStack.styling.slice(0, 3), // Show first 3
      devTools: techStack.devTools.slice(0, 3), // Show first 3
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
        gitUrl: projectMetadata.gitInfo.gitUrl || 'No remote URL',
        gitBranch: projectMetadata.gitInfo.gitBranch || 'No branch'
      },
      projectStructure: {
        type: projectMetadata.projectStructure.type,
        architecture: projectMetadata.projectStructure.architecture.separationLevel
      },
      techStack: {
        languages: projectMetadata.techStack.languages,
        frameworks: projectMetadata.techStack.frameworks.slice(0, 3),
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
      warnings: validation.warnings.slice(0, 3) // Show first 3
    });

    console.log('\n6️⃣ Testing Tech Stack Analysis...');
    const techAnalysis = await techStackDetector.getTechStackAnalysis(projectPath);
    console.log('✅ Tech Stack Analysis:', {
      recommendations: techAnalysis.recommendations.slice(0, 3), // Show first 3
      warnings: techAnalysis.warnings.slice(0, 3), // Show first 3
      compatibility: {
        score: techAnalysis.compatibility.score,
        issues: techAnalysis.compatibility.issues.slice(0, 3) // Show first 3
      }
    });

    console.log('\n7️⃣ Testing Structure Analysis...');
    const structureAnalysis = await structureDetector.getAnalysisWithRecommendations(projectPath);
    console.log('✅ Structure Analysis:', {
      score: structureAnalysis.score,
      recommendations: structureAnalysis.recommendations.slice(0, 3), // Show first 3
      isValid: structureAnalysis.isValid
    });

    console.log('\n🎉 All Project Identification Tests Passed!');
    console.log('\n📊 Summary:');
    console.log(`- Project ID: ${projectMetadata.id}`);
    console.log(`- Project Name: ${projectMetadata.name}`);
    console.log(`- Git Repository: ${gitInfo.isGitRepo ? 'Yes' : 'No'}`);
    console.log(`- Project Type: ${structure.type}`);
    console.log(`- Architecture: ${structure.architecture.separationLevel} separation`);
    console.log(`- Tech Stack: ${techStack.languages.join(', ')} with ${techStack.frameworks.slice(0, 2).join(', ')}`);
    console.log(`- Complexity: ${techStack.metadata.complexity}`);
    console.log(`- Structure Score: ${structureAnalysis.score}/100`);
    console.log(`- Compatibility Score: ${techAnalysis.compatibility.score}/100`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testProjectIdentificationSimple().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
