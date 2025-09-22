# Phase 1: Fix Benchmark Library Detection

## Problem Statement
The benchmark is incorrectly reporting "Context7: No (1 libraries)" for HTML button questions, even though the debug logs show that `/mdn/html` documentation is being retrieved successfully.

## Root Cause Analysis

### Current Benchmark Logic
```javascript
// Current regex in benchmark-repeatable.js
const context7Libraries = enhancedPrompt.match(/## \/[\w-]+\/[\w-]+/g) || [];
```

### Actual Enhanced Prompt Format
From debug logs, the Context7 documentation appears in this format:
```
## /mdn/html Documentation:

# /mdn/html Documentation

## General Patterns

### Error Handling
```typescript
try {
  const result = await someOperation();
  return result;
} catch (error) {
  console...
```

## Issues Identified

### 1. Regex Pattern Mismatch
- **Current**: `/## \/[\w-]+\/[\w-]+/g`
- **Actual**: `## /mdn/html Documentation:`
- **Problem**: The regex expects `## /org/project` but actual format is `## /org/project Documentation:`

### 2. Missing Documentation Section Headers
- The regex doesn't account for the `Documentation:` suffix
- Multiple documentation sections may exist
- Need to handle both single and multiple library formats

### 3. Case Sensitivity Issues
- The regex is case-sensitive
- Actual format uses `Documentation:` (capital D)
- Need to make regex case-insensitive

## Solution Implementation

### Step 1: Fix Regex Pattern
```javascript
// Updated regex to handle actual format
const context7Libraries = enhancedPrompt.match(/## \/[\w-]+\/[\w-]+ Documentation:/gi) || [];
```

### Step 2: Extract Library Names
```javascript
// Extract just the library names from the headers
const libraryNames = context7Libraries.map(header => {
  const match = header.match(/## \/([\w-]+\/[\w-]+) Documentation:/i);
  return match ? match[1] : null;
}).filter(Boolean);
```

### Step 3: Add Validation
```javascript
// Validate that we found the expected libraries
const expectedLibraries = {
  'html': ['mdn/html'],
  'nextjs': ['vercel/next.js'],
  'react': ['facebook/react'],
  'typescript': ['microsoft/typescript']
};

const isValid = expectedLibraries[framework].some(expected => 
  libraryNames.some(actual => actual.includes(expected))
);
```

## Implementation Steps

### 1. Update benchmark-repeatable.js
- Fix the regex pattern
- Add library name extraction
- Add validation logic
- Add debug logging

### 2. Test with Current Prompts
- Test HTML button question
- Test Next.js full-stack task
- Test React component task
- Test TypeScript debug task
- Test math question

### 3. Validate Results
- Ensure all 5 test cases show correct library detection
- Verify accuracy metrics are now accurate
- Confirm no false negatives

## Expected Outcomes
- **Library Selection Accuracy**: 33.3% → 100%
- **False Negative Rate**: 100% → 0%
- **Accurate Metrics**: Enable proper measurement of improvements

## Testing Checklist
- [ ] HTML button shows "Context7: Yes (1 libraries)"
- [ ] Next.js task shows "Context7: Yes (2 libraries)"
- [ ] React task shows "Context7: Yes (1 libraries)"
- [ ] TypeScript task shows "Context7: Yes (1 libraries)"
- [ ] Math question shows "Context7: No (0 libraries)"
- [ ] Overall accuracy shows 100%

## Files to Modify
- `benchmark-repeatable.js` - Main benchmark logic
- `test-promptmcp-enhanced.js` - Test script validation

## Rollback Plan
If the fix causes issues:
1. Revert to original regex pattern
2. Add debug logging to understand actual format
3. Iterate on regex pattern based on real data
4. Test incrementally with each prompt type
