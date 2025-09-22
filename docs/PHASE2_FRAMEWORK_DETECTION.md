# Phase 2: Improve Framework Detection Priority

## Problem Statement
The current framework detection system doesn't prioritize the most relevant framework for the task. For example, full-stack tasks detect both `['nextjs', 'typescript']` but should prioritize Next.js as the primary framework.

## Current Framework Detection Analysis

### From Debug Logs
```
Full-stack task: detectedFrameworks: [ 'nextjs', 'typescript' ]
React component: detectedFrameworks: [ 'react' ]
TypeScript debug: detectedFrameworks: [ 'typescript' ]
HTML button: detectedFrameworks: [ 'html' ]
```

### Issues Identified

#### 1. No Priority Scoring
- All detected frameworks are treated equally
- No mechanism to determine which framework is most relevant
- Context7 libraries are added for all detected frameworks

#### 2. Generic Framework Detection
- Framework detection is based on simple keyword matching
- No consideration of task complexity or context
- No task-specific framework selection

#### 3. Missing Framework Patterns
- Limited detection patterns for modern frameworks
- No detection for CSS frameworks (Tailwind, Bootstrap)
- No detection for backend frameworks (Express, FastAPI)

## Solution Implementation

### Step 1: Add Framework Priority Scoring

#### Priority Levels
```typescript
const FRAMEWORK_PRIORITIES = {
  // Full-stack frameworks (highest priority)
  'nextjs': 10,
  'nuxt': 10,
  'sveltekit': 10,
  
  // Frontend frameworks
  'react': 8,
  'vue': 8,
  'angular': 8,
  'svelte': 8,
  
  // CSS frameworks
  'tailwind': 7,
  'bootstrap': 7,
  'bulma': 7,
  
  // Backend frameworks
  'express': 6,
  'fastapi': 6,
  'django': 6,
  
  // Languages (lowest priority)
  'typescript': 5,
  'javascript': 4,
  'html': 3,
  'css': 2
};
```

#### Task-Specific Priorities
```typescript
const TASK_PRIORITIES = {
  'full-stack': ['nextjs', 'nuxt', 'sveltekit'],
  'frontend': ['react', 'vue', 'angular', 'svelte'],
  'backend': ['express', 'fastapi', 'django'],
  'styling': ['tailwind', 'bootstrap', 'bulma'],
  'debugging': ['typescript', 'javascript'],
  'simple': ['html', 'css']
};
```

### Step 2: Implement Smart Framework Selection

#### Selection Algorithm
```typescript
function selectPrimaryFramework(detectedFrameworks: string[], prompt: string): string {
  // 1. Analyze prompt complexity and type
  const promptType = analyzePromptType(prompt);
  
  // 2. Get task-specific priorities
  const taskPriorities = TASK_PRIORITIES[promptType] || [];
  
  // 3. Score each detected framework
  const scoredFrameworks = detectedFrameworks.map(framework => ({
    framework,
    score: calculateFrameworkScore(framework, promptType, taskPriorities)
  }));
  
  // 4. Return highest scoring framework
  return scoredFrameworks
    .sort((a, b) => b.score - a.score)[0]
    .framework;
}
```

#### Scoring Function
```typescript
function calculateFrameworkScore(framework: string, promptType: string, taskPriorities: string[]): number {
  let score = FRAMEWORK_PRIORITIES[framework] || 0;
  
  // Boost score for task-specific frameworks
  if (taskPriorities.includes(framework)) {
    score += 5;
  }
  
  // Boost score for full-stack frameworks in complex tasks
  if (promptType === 'full-stack' && ['nextjs', 'nuxt', 'sveltekit'].includes(framework)) {
    score += 3;
  }
  
  // Boost score for frontend frameworks in UI tasks
  if (promptType === 'frontend' && ['react', 'vue', 'angular', 'svelte'].includes(framework)) {
    score += 3;
  }
  
  return score;
}
```

### Step 3: Add More Framework Detection Patterns

#### Extended Detection Patterns
```typescript
const FRAMEWORK_PATTERNS = {
  // Full-stack frameworks
  'nextjs': [
    /next\.?js/gi,
    /nextjs/gi,
    /vercel/gi,
    /app router/gi,
    /pages router/gi
  ],
  
  // Frontend frameworks
  'react': [
    /react/gi,
    /jsx/gi,
    /hooks/gi,
    /component/gi,
    /useState/gi,
    /useEffect/gi
  ],
  
  'vue': [
    /vue\.?js/gi,
    /vuejs/gi,
    /vue/gi,
    /composition api/gi,
    /options api/gi
  ],
  
  'angular': [
    /angular/gi,
    /ng-/gi,
    /@angular/gi,
    /typescript/gi
  ],
  
  // CSS frameworks
  'tailwind': [
    /tailwind/gi,
    /tw-/gi,
    /@apply/gi,
    /utility/gi
  ],
  
  'bootstrap': [
    /bootstrap/gi,
    /bs-/gi,
    /btn/gi,
    /container/gi
  ],
  
  // Backend frameworks
  'express': [
    /express/gi,
    /express\.js/gi,
    /middleware/gi,
    /router/gi
  ],
  
  'fastapi': [
    /fastapi/gi,
    /fast api/gi,
    /pydantic/gi,
    /uvicorn/gi
  ]
};
```

### Step 4: Implement Context7 Library Selection

#### Smart Library Selection
```typescript
function selectContext7Libraries(primaryFramework: string, detectedFrameworks: string[]): string[] {
  const libraries: string[] = [];
  
  // Add primary framework library
  const primaryLibrary = FRAMEWORK_LIBRARY_MAP[primaryFramework];
  if (primaryLibrary) {
    libraries.push(primaryLibrary);
  }
  
  // Add complementary libraries (max 2 total)
  const complementaryFrameworks = detectedFrameworks
    .filter(f => f !== primaryFramework)
    .slice(0, 1); // Only add 1 complementary library
  
  for (const framework of complementaryFrameworks) {
    const library = FRAMEWORK_LIBRARY_MAP[framework];
    if (library && !libraries.includes(library)) {
      libraries.push(library);
    }
  }
  
  return libraries;
}
```

## Implementation Steps

### 1. Update Framework Detection Logic
- Add priority scoring system
- Implement smart framework selection
- Add task-specific priorities

### 2. Extend Detection Patterns
- Add patterns for modern frameworks
- Add CSS framework detection
- Add backend framework detection

### 3. Update Context7 Library Selection
- Implement smart library selection
- Limit to 2 libraries maximum
- Prioritize primary framework

### 4. Add Debug Logging
- Log framework scoring process
- Log selection reasoning
- Log final library choices

## Expected Outcomes
- **Framework Detection Accuracy**: 80% → 95%
- **Primary Framework Selection**: 60% → 90%
- **Context7 Library Relevance**: 70% → 90%
- **Overall Accuracy Score**: 85% → 90%

## Testing Checklist
- [ ] Full-stack task prioritizes Next.js over TypeScript
- [ ] React component task prioritizes React
- [ ] HTML button task prioritizes HTML
- [ ] TypeScript debug task prioritizes TypeScript
- [ ] Math question gets no frameworks
- [ ] Complex tasks get max 2 libraries
- [ ] Simple tasks get 1 library

## Files to Modify
- `src/tools/enhanced-context7-enhance.tool.ts` - Main framework detection logic
- `src/services/context7/` - Context7 library mapping
- `src/types/` - Add new types for framework priorities

## Rollback Plan
If the changes cause issues:
1. Revert to original framework detection
2. Add priority scoring incrementally
3. Test each framework type separately
4. Monitor accuracy metrics closely
