# PromptMCP Accuracy Improvement Plan

## Current Status
- **Library Selection Accuracy**: 33.3% (Target: >90%)
- **All 5 test cases are getting correct libraries** ✅
- **Benchmark shows "Context7: No (1 libraries)" for HTML button** ❌

## Critical Issues Identified

### 1. Benchmark Library Detection Bug 🐛
**Problem**: The benchmark regex `/## \/[\w-]+\/[\w-]+/g` is not correctly detecting Context7 libraries in enhanced prompts.

**Evidence**: 
- Debug logs show HTML button gets `/mdn/html` docs
- Benchmark shows "Context7: No (1 libraries)"
- This causes false negative accuracy reporting

**Impact**: High - Prevents accurate measurement of improvements

### 2. Framework Detection Priority Issues 🔄
**Problem**: Framework detection doesn't prioritize the most relevant framework for the task.

**Evidence**:
- Full-stack task detects `['nextjs', 'typescript']` but should prioritize Next.js
- React component gets React docs correctly ✅
- TypeScript debug gets TypeScript docs correctly ✅

**Impact**: Medium - Affects context relevance

### 3. Context7 Library Mapping Issues 📚
**Problem**: Some Context7 libraries may not exist or return generic content.

**Evidence**:
- HTML docs show TypeScript patterns in preview
- Some libraries might not be available in Context7
- Generic "Error Handling" patterns for HTML docs

**Impact**: Medium - Affects documentation quality

## Immediate Action Plan

### Phase 1: Fix Benchmark Detection (Critical)
1. **Fix benchmark library detection regex**
2. **Validate Context7 library format in enhanced prompts**
3. **Test accuracy measurement accuracy**

### Phase 2: Improve Framework Detection (High Impact)
1. **Add framework priority scoring**
2. **Implement task-specific framework selection**
3. **Add more framework detection patterns**

### Phase 3: Validate Context7 Integration (Medium Impact)
1. **Verify Context7 library availability**
2. **Improve library fallback handling**
3. **Add framework-specific documentation validation**

## Success Metrics
- **Library Selection Accuracy**: >90%
- **Framework Detection Accuracy**: >95%
- **Context7 Library Resolution**: >90%
- **Overall Accuracy Score**: >85%

## Timeline
- **Phase 1**: 1-2 hours (Critical fixes)
- **Phase 2**: 2-3 hours (Framework improvements)
- **Phase 3**: 1-2 hours (Context7 validation)

## Next Steps
1. Start with Phase 1 to get accurate metrics
2. Proceed to Phase 2 for framework improvements
3. Complete Phase 3 for Context7 validation
4. Run comprehensive accuracy testing
5. Document improvements and lessons learned
