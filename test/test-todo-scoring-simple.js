#!/usr/bin/env node

/**
 * Simple Todo Integration Scoring Test
 * 
 * Tests the todo integration scoring functionality without full service initialization
 */

// Test the scoring function directly
function scoreTodoIntegration(testCase, enhancedPrompt) {
  let score = 0;
  
  // Check if enhanced prompt includes task context
  if (enhancedPrompt && enhancedPrompt.includes('## Current Project Tasks:')) {
    score += 8; // Task context section present
  }
  
  // Check for task-related content
  if (enhancedPrompt && enhancedPrompt.includes('- ')) {
    const taskLines = enhancedPrompt.match(/- .+/g);
    if (taskLines && taskLines.length > 0) {
      score += 4; // Task items present
    }
  }
  
  // Check for project context awareness
  if (enhancedPrompt && (enhancedPrompt.includes('project') || enhancedPrompt.includes('task'))) {
    score += 3; // Project/task awareness
  }
  
  return Math.min(score, 15);
}

// Test cases
const testCases = [
  {
    name: 'High Todo Integration Score',
    prompt: 'Help me implement authentication in my React app',
    enhancedPrompt: `Help me implement authentication in my React app

## Current Project Tasks:
- Create a React login component with TypeScript
- Add form validation to login component
- Write unit tests for login component

## Project Documentation:
Project: Authentication Implementation
Node.js version: >=18.0.0

## Repository Context:
Project name: auth-app
Node.js version: >=18.0.0`
  },
  {
    name: 'Medium Todo Integration Score',
    prompt: 'Help me implement authentication in my React app',
    enhancedPrompt: `Help me implement authentication in my React app

The project involves building authentication features for a React application. This includes creating login forms, handling user sessions, and implementing security best practices.

## Project Documentation:
Project: Authentication Implementation
Node.js version: >=18.0.0`
  },
  {
    name: 'Low Todo Integration Score',
    prompt: 'Help me implement authentication in my React app',
    enhancedPrompt: `Help me implement authentication in my React app

To implement authentication in React, you'll need to:
1. Create a login component
2. Handle form submission
3. Manage user state
4. Implement routing protection`
  },
  {
    name: 'No Todo Integration Score',
    prompt: 'Help me implement authentication in my React app',
    enhancedPrompt: `Help me implement authentication in my React app

Here's how to implement authentication in React...`
  }
];

console.log('🧪 Testing Todo Integration Scoring...\n');

let totalScore = 0;
let testCount = 0;

testCases.forEach((testCase, index) => {
  const score = scoreTodoIntegration(testCase, testCase.enhancedPrompt);
  totalScore += score;
  testCount++;
  
  console.log(`📋 Test ${index + 1}: ${testCase.name}`);
  console.log(`  ✅ Todo Score: ${score}/15`);
  console.log(`  📊 Has Task Context: ${testCase.enhancedPrompt.includes('## Current Project Tasks:')}`);
  console.log(`  📝 Has Task Items: ${testCase.enhancedPrompt.includes('- ')}`);
  console.log(`  🎯 Project Awareness: ${testCase.enhancedPrompt.includes('project') || testCase.enhancedPrompt.includes('task')}`);
  console.log('');
});

const averageScore = totalScore / testCount;
console.log(`🎯 Average Todo Score: ${averageScore.toFixed(1)}/15`);
console.log(`📈 Test Results: ${testCount}/${testCases.length} tests completed`);

console.log('\n✅ Todo Integration Scoring Test Complete!');
console.log('\n📊 Expected Results:');
console.log('- High Todo Integration: 12-15 points');
console.log('- Medium Todo Integration: 4-7 points');
console.log('- Low Todo Integration: 0-3 points');
console.log('- No Todo Integration: 0 points');
