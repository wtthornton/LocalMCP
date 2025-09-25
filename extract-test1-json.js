#!/usr/bin/env node

/**
 * Extract Test 1 JSON Response
 * Extracts the JSON response for Test 1 (Simple Question) from the test output
 */

// The JSON response from Test 1 (Simple Question)
const test1JsonResponse = {
  "enhanced_prompt": "Create a simple button using HTML and CSS with basic styling and hover effects.",
  "context_used": {
    "repo_facts": [
      "Project name: promptmcp",
      "Project description: A focused MCP server for intelligent prompt enhancement with dynamic framework detection, Context7 integration, comprehensive testing suite, and organized test artifacts management",
      "Uses Playwright framework (^1.55.0)",
      "Uses TypeScript framework (^5.0.0)",
      "Uses Vitest framework (^1.0.0)",
      "Project type: Frontend application",
      "Has testing setup",
      "Has build process",
      "Source directories: src",
      "Configuration files: tsconfig.json",
      "Uses TypeScript for type safety",
      "Uses Node.js/Express for backend",
      "Uses modern JavaScript features",
      "Has comprehensive error handling",
      "Uses structured logging",
      "Has health monitoring",
      "Uses dependency injection pattern",
      "Has modular architecture",
      "Uses environment-based configuration",
      "Has automated testing",
      "Uses code quality tools",
      "Has performance monitoring",
      "Uses caching strategies",
      "Has API documentation",
      "Uses containerization (Docker)",
      "Has CI/CD pipeline",
      "Uses security best practices",
      "Has data persistence layer",
      "Uses async/await patterns",
      "Has comprehensive validation"
    ],
    "code_snippets": [],
    "context7_docs": []
  },
  "success": true,
  "frameworks_detected": ["html"]
};

console.log('🎯 Test 1 (Simple Question) JSON Response:');
console.log('=====================================');
console.log('📊 Response Summary:');
console.log(`   - Success: ${test1JsonResponse.success}`);
console.log(`   - Frameworks detected: ${test1JsonResponse.frameworks_detected.join(', ')}`);
console.log(`   - Context7 docs: ${test1JsonResponse.context_used.context7_docs.length}`);
console.log(`   - Enhanced prompt: "${test1JsonResponse.enhanced_prompt}"`);
console.log(`   - Repository facts: ${test1JsonResponse.context_used.repo_facts.length}`);
console.log(`   - Code snippets: ${test1JsonResponse.context_used.code_snippets.length}`);

// Save to file
import fs from 'fs';
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const filename = `test1-simple-question-${timestamp}.json`;
fs.writeFileSync(filename, JSON.stringify(test1JsonResponse, null, 2));
console.log(`\n💾 Full JSON response saved to: ${filename}`);

console.log('\n📝 Full JSON Response:');
console.log(JSON.stringify(test1JsonResponse, null, 2));
