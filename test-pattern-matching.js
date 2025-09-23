#!/usr/bin/env node

/**
 * Test Pattern Matching System
 * Analyzes how the regex patterns work with various prompts
 */

// Replicate the pattern matching logic
const detectionPatterns = [
  { regex: /create\s+a\s+(\w+)\s+component/gi, type: 'component', weight: 1.0 },
  { regex: /using\s+(\w+)\s+framework/gi, type: 'framework', weight: 1.0 },
  { regex: /with\s+(\w+)\s+library/gi, type: 'library', weight: 1.0 },
  { regex: /build\s+(\w+)\s+app/gi, type: 'app', weight: 0.9 },
  { regex: /(\w+)\s+component/gi, type: 'component', weight: 0.8 },
  { regex: /(\w+)\s+framework/gi, type: 'framework', weight: 0.8 },
  { regex: /(\w+)\s+library/gi, type: 'library', weight: 0.8 },
  { regex: /(\w+)\s+ui/gi, type: 'library', weight: 0.7 },
  { regex: /(\w+)\s+styling/gi, type: 'library', weight: 0.7 }
];

const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were'];

function isValidLibraryName(name) {
  return name.length > 2 && !commonWords.includes(name) && /^[a-z0-9-]+$/.test(name);
}

function calculatePatternConfidence(name, type, weight) {
  const typeWeights = { component: 0.9, framework: 0.8, library: 0.7, app: 0.6 };
  const baseConfidence = typeWeights[type] || 0.5;
  return Math.min(1, baseConfidence * weight);
}

function extractLibraryNamesUsingPatterns(prompt) {
  const matches = [];
  
  console.log(`\n🔍 Testing prompt: "${prompt}"`);
  console.log('='.repeat(60));
  
  for (const pattern of detectionPatterns) {
    const regexMatches = prompt.matchAll(pattern.regex);
    for (const match of regexMatches) {
      const name = match[1]?.toLowerCase();
      console.log(`  Pattern: ${pattern.regex.source}`);
      console.log(`  Match: "${match[0]}" → Captured: "${name}"`);
      
      if (name && isValidLibraryName(name)) {
        const confidence = calculatePatternConfidence(name, pattern.type, pattern.weight);
        matches.push({
          name,
          confidence,
          type: pattern.type,
          weight: pattern.weight,
          pattern: pattern.regex.source
        });
        console.log(`  ✅ VALID: ${name} (confidence: ${confidence.toFixed(2)}, type: ${pattern.type})`);
      } else {
        console.log(`  ❌ INVALID: ${name} (filtered out)`);
      }
    }
  }
  
  return matches;
}

// Test cases
const testCases = [
  // Good cases
  "Create a React component that displays a list of users",
  "Build a Next.js app with TypeScript",
  "Using Vue framework for the frontend",
  "With Tailwind CSS library for styling",
  "Create a fancy button component",
  "Angular component with routing",
  
  // Edge cases
  "How do I create a button?", // No framework mentioned
  "Build something with React and Vue", // Multiple frameworks
  "Create a component using the latest framework", // Generic "framework"
  "Make a fancy modern hello page", // No framework keywords
  "Using the React framework with TypeScript", // Explicit framework
  "Build an app with the library", // Generic "library"
  
  // Problematic cases
  "Create a the component", // Common word "the"
  "Build a a app", // Common word "a"
  "Using and framework", // Common word "and"
  "Component with React", // Word order matters
  "React create component", // Word order matters
  "Framework React component", // Word order matters
  
  // Real-world cases
  "Create a new hello page that is fancy, modern and fun", // From quality test
  "Fix this TypeScript error: Property does not exist", // From quality test
  "How do I create a button?", // From quality test
  "Build a full-stack application with authentication using Next.js and PostgreSQL",
];

console.log('🧪 Pattern Matching Analysis\n');

testCases.forEach((prompt, index) => {
  console.log(`\n${index + 1}. TEST CASE`);
  const matches = extractLibraryNamesUsingPatterns(prompt);
  
  if (matches.length > 0) {
    console.log(`\n  📊 RESULTS:`);
    matches.forEach(match => {
      console.log(`    - ${match.name}: ${match.confidence.toFixed(2)} confidence (${match.type}, weight: ${match.weight})`);
    });
  } else {
    console.log(`\n  ❌ NO MATCHES FOUND`);
  }
});

// Analyze pattern effectiveness
console.log('\n\n📈 PATTERN ANALYSIS');
console.log('='.repeat(60));

console.log('\n✅ PATTERNS THAT WORK WELL:');
console.log('1. /create\\s+a\\s+(\\w+)\\s+component/gi - High precision, catches "Create a React component"');
console.log('2. /using\\s+(\\w+)\\s+framework/gi - Explicit framework mentions');
console.log('3. /build\\s+(\\w+)\\s+app/gi - App creation patterns');

console.log('\n⚠️ PATTERNS WITH ISSUES:');
console.log('1. /(\\w+)\\s+component/gi - Too broad, catches "the component", "a component"');
console.log('2. /(\\w+)\\s+framework/gi - Too broad, catches "the framework", "a framework"');
console.log('3. /(\\w+)\\s+library/gi - Too broad, catches "the library", "a library"');

console.log('\n❌ COMMON FAILURE CASES:');
console.log('1. Generic prompts without framework keywords');
console.log('2. Wrong word order ("Component React" vs "React component")');
console.log('3. Common words being captured ("the", "a", "and")');
console.log('4. Multiple frameworks in one prompt');
console.log('5. Implicit framework usage (no explicit keywords)');

console.log('\n🔧 IMPROVEMENT SUGGESTIONS:');
console.log('1. Add negative lookahead to avoid common words');
console.log('2. Add more specific patterns for common frameworks');
console.log('3. Add patterns for implicit usage ("React app", "Vue project")');
console.log('4. Improve word order flexibility');
console.log('5. Add context-aware patterns');



