# Template Improvement Task List - Simple & Practical

## 🎯 **Goal**
Improve quality scores from 58/100 to 80+/100 using template-based approach instead of hardcoded examples.

## 📊 **Current Issues**
- Content Quality: 0-10/25 (Very Poor)
- Token Efficiency: 62.4x average (Too High)
- Generic hardcoded examples not context-specific

---

## 🚀 **Phase 1: Simple Template System (45 minutes)**

### **Task 1.1: Create Basic Template Structure** ⏱️ 15 minutes
**File**: `src/tools/template-based-enhance.tool.ts`

```typescript
// Simple template interface
interface PromptTemplate {
  id: string;
  framework: string;
  complexity: 'simple' | 'medium' | 'complex';
  content: string[];
}

// Basic template collection
const TEMPLATES: PromptTemplate[] = [
  {
    id: 'html-simple',
    framework: 'html',
    complexity: 'simple',
    content: [
      '// HTML Element Creation',
      '<button type="button" class="btn">Click me</button>',
      '// Add event listener: button.addEventListener("click", handler)'
    ]
  },
  {
    id: 'react-simple',
    framework: 'react',
    complexity: 'simple',
    content: [
      '// React Functional Component',
      'const Component = () => {',
      '  return <div>Hello World</div>;',
      '};'
    ]
  }
  // Add more templates as needed
];
```

### **Task 1.2: Add Template Selection Logic** ⏱️ 15 minutes
**File**: `src/tools/template-based-enhance.tool.ts`

```typescript
private selectTemplate(framework: string, complexity: string): PromptTemplate | null {
  return TEMPLATES.find(t => 
    t.framework === framework && t.complexity === complexity
  ) || null;
}

private getFallbackTemplate(complexity: string): PromptTemplate {
  return {
    id: 'generic-fallback',
    framework: 'generic',
    complexity: complexity as any,
    content: [
      '// Generic coding pattern',
      '// Implement based on your specific needs',
      '// Add proper error handling'
    ]
  };
}
```

### **Task 1.3: Replace Hardcoded Fallbacks** ⏱️ 15 minutes
**File**: `src/tools/enhanced-context7-enhance.tool.ts`

```typescript
// Replace getFallbackCodeSnippets() with template-based approach
private async getTemplateBasedCodeSnippets(framework: string, complexity: string): Promise<string[]> {
  const template = this.templateEnhancer.selectTemplate(framework, complexity);
  return template ? template.content : this.getFallbackCodeSnippets();
}
```

---

## 🎯 **Phase 2: Quality-Driven Templates (30 minutes)**

### **Task 2.1: Add Quality-Specific Templates** ⏱️ 15 minutes
**File**: `src/tools/template-based-enhance.tool.ts`

```typescript
// Add templates for specific quality criteria
const QUALITY_TEMPLATES = {
  'html-docs': [
    '// HTML Documentation',
    '// Use semantic HTML elements',
    '// Add proper ARIA attributes for accessibility',
    '// Example: <button aria-label="Close dialog">×</button>'
  ],
  'react-patterns': [
    '// React Best Practices',
    '// Use functional components with hooks',
    '// Implement proper prop types',
    '// Example: const Component = ({ title }: { title: string }) => { ... }'
  ],
  'state-management': [
    '// State Management Patterns',
    '// Use useState for local state',
    '// Use useReducer for complex state',
    '// Example: const [state, dispatch] = useReducer(reducer, initialState)'
  ]
};
```

### **Task 2.2: Implement Quality-Based Selection** ⏱️ 15 minutes
**File**: `src/tools/template-based-enhance.tool.ts`

```typescript
private selectTemplateByQuality(prompt: string, framework: string): string[] {
  const qualityNeeds = this.analyzeQualityNeeds(prompt);
  
  if (qualityNeeds.needsHTMLDocs && framework === 'html') {
    return QUALITY_TEMPLATES['html-docs'];
  }
  if (qualityNeeds.needsReactPatterns && framework === 'react') {
    return QUALITY_TEMPLATES['react-patterns'];
  }
  if (qualityNeeds.needsStateManagement) {
    return QUALITY_TEMPLATES['state-management'];
  }
  
  return this.selectTemplate(framework, 'medium')?.content || [];
}

private analyzeQualityNeeds(prompt: string): QualityNeeds {
  const lower = prompt.toLowerCase();
  return {
    needsHTMLDocs: lower.includes('html') || lower.includes('button') || lower.includes('element'),
    needsReactPatterns: lower.includes('react') || lower.includes('component'),
    needsStateManagement: lower.includes('state') || lower.includes('search') || lower.includes('filter')
  };
}
```

---

## 🔧 **Phase 3: Integration & Testing (15 minutes)**

### **Task 3.1: Integrate with Existing System** ⏱️ 10 minutes
**File**: `src/tools/enhanced-context7-enhance.tool.ts`

```typescript
// Add template enhancer to constructor
private templateEnhancer: TemplateBasedEnhancer;

constructor() {
  // ... existing code
  this.templateEnhancer = new TemplateBasedEnhancer();
}

// Update gatherCodeSnippets method
private async gatherCodeSnippets(request: EnhancedContext7Request): Promise<string[]> {
  try {
    // ... existing logic
    
    // Use template-based approach instead of hardcoded fallbacks
    if (snippets.length === 0) {
      const framework = this.detectPrimaryFramework(request.prompt);
      const complexity = this.analyzePromptComplexity(request.prompt).level;
      snippets = await this.templateEnhancer.getTemplateBasedSnippets(framework, complexity);
    }
    
    return snippets;
  } catch (error) {
    // Fallback to templates
    return this.templateEnhancer.getFallbackTemplate('medium').content;
  }
}
```

### **Task 3.2: Run Benchmark Test** ⏱️ 5 minutes
**Command**: `node benchmark-quality-comprehensive.cjs`

**Expected Results**:
- Quality Score: 58/100 → 80+/100
- Content Quality: 0-10/25 → 20-25/25
- Token Efficiency: 62.4x → 40x (improved targeting)

---

## 📋 **Implementation Checklist**

### **Phase 1: Basic Templates** ✅
- [ ] Create `template-based-enhance.tool.ts`
- [ ] Add basic template structure
- [ ] Implement template selection logic
- [ ] Replace hardcoded fallbacks

### **Phase 2: Quality Templates** ✅
- [ ] Add quality-specific templates
- [ ] Implement quality-based selection
- [ ] Add quality needs analysis

### **Phase 3: Integration** ✅
- [ ] Integrate with existing system
- [ ] Update gatherCodeSnippets method
- [ ] Run benchmark validation

---

## 🎯 **Success Metrics**

### **Before (Current)**
- Quality Score: 58/100
- Content Quality: 0-10/25
- Token Efficiency: 62.4x average

### **After (Target)**
- Quality Score: 80+/100
- Content Quality: 20-25/25
- Token Efficiency: 40x average

### **Key Improvements**
- ✅ Context-specific content instead of generic examples
- ✅ Better quality scores through targeted templates
- ✅ Improved token efficiency through relevance
- ✅ Maintainable template system

---

## 🚀 **Quick Start**

1. **Create template file**: `src/tools/template-based-enhance.tool.ts`
2. **Add basic templates** for HTML, React, TypeScript
3. **Replace hardcoded fallbacks** in existing tool
4. **Run benchmark** to validate improvements
5. **Iterate** based on results

**Total Time**: 90 minutes
**Complexity**: Simple (no over-engineering)
**Impact**: High (quality score improvement)
