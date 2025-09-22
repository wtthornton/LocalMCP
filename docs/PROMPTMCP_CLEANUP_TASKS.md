# PromptMCP Project Cleanup Tasks

**Project**: PromptMCP - Local MCP Server for Vibe Coders  
**Status**: 🔴 **NOT STARTED**  
**Last Updated**: September 22, 2025  
**Estimated Total Time**: 8-12 hours  

---

## 🚨 **Executive Summary**

This document tracks the comprehensive cleanup of the PromptMCP project to transform it from a development/testing state into a production-ready, maintainable codebase. The cleanup focuses on removing clutter, organizing files, and improving code quality.

### **Current Issues**
- 557 instances of debug logging cluttering the codebase
- 100+ files in root directory causing confusion
- 30+ duplicate/outdated documentation files
- 50+ benchmark and analysis files scattered throughout
- Multiple Docker configurations creating complexity

### **Cleanup Goals**
- Remove all debug logging and console statements
- Consolidate documentation into single source of truth
- Organize files into proper directory structure
- Clean up commented code and unused imports
- Simplify Docker configuration

---

## 📋 **Phase 1: Critical Cleanup (4-6 hours)**

### **Task 1.1: Remove Debug Logging**
**Status**: 🔴 **NOT STARTED**  
**Priority**: **CRITICAL**  
**Estimated Time**: 2-3 hours  
**Dependencies**: None  

**Problem**: 557 instances of debug logging cluttering production code

**Files to Clean**:
- `src/tools/enhanced-context7-enhance.tool.ts` (most affected)
- `src/services/cache/prompt-cache.service.ts`
- `src/services/context7/context7-advanced-cache.service.ts`
- `src/services/cache/cache-analytics.service.ts`

**Sub-tasks**:
- [ ] **1.1.1**: Remove all `console.log` statements
  - Search and replace all `console.log` with proper logger calls
  - **Time**: 30 minutes

- [ ] **1.1.2**: Remove debug comments and emojis
  - Remove `🔍 DEBUG:` comments
  - Remove debug emojis and formatting
  - **Time**: 30 minutes

- [ ] **1.1.3**: Standardize logging levels
  - Replace debug comments with proper logger calls
  - Implement consistent logging patterns
  - **Time**: 1 hour

- [ ] **1.1.4**: Add log level filtering
  - Implement production log level filtering
  - Remove debug logging in hot paths
  - **Time**: 30 minutes

**Success Criteria**:
- ✅ No `console.log` statements in production code
- ✅ All debug comments removed
- ✅ Consistent logging patterns throughout
- ✅ Production log level filtering implemented

---

### **Task 1.2: Consolidate Documentation**
**Status**: 🔴 **NOT STARTED**  
**Priority**: **CRITICAL**  
**Estimated Time**: 1-2 hours  
**Dependencies**: None  

**Problem**: Multiple duplicate task list files creating confusion

**Files to Remove**:
- `PROMPTMCP_OUTSTANDING_TASKS_CORRECTED.md`
- `PROMPTMCP_IMMEDIATE_FIXES_TASK_LIST.md`
- `PROMPTMCP_TESTING_AND_FIXES_TASK_LIST.md`
- `CONTEXT7_OPTIMIZATION_TASK_LIST.md`
- `OPTION1_IMPLEMENTATION_TASK_LIST.md`
- `TIER1_IMPLEMENTATION_TASK_LIST.md`

**Sub-tasks**:
- [ ] **1.2.1**: Archive completed task lists
  - Create `docs/archive/` directory
  - Move completed task lists to archive
  - **Time**: 15 minutes

- [ ] **1.2.2**: Update main task list
  - Ensure `PROMPTMCP_OUTSTANDING_TASKS.md` is current
  - Add cleanup tasks to main list
  - **Time**: 30 minutes

- [ ] **1.2.3**: Remove duplicate files
  - Delete all duplicate task list files
  - Update any references to removed files
  - **Time**: 15 minutes

- [ ] **1.2.4**: Update documentation references
  - Update README.md to point to main task list
  - Update any internal references
  - **Time**: 30 minutes

**Success Criteria**:
- ✅ Only one task list file remains
- ✅ All completed tasks archived
- ✅ No broken references to removed files
- ✅ Documentation is consistent

---

### **Task 1.3: Organize Root Directory**
**Status**: 🔴 **NOT STARTED**  
**Priority**: **CRITICAL**  
**Estimated Time**: 1-2 hours  
**Dependencies**: None  

**Problem**: 100+ files in root directory causing confusion

**Sub-tasks**:
- [ ] **1.3.1**: Create proper directory structure
  - Create `config/` directory for configuration files
  - Create `data/` directory for generated files
  - Create `docs/` directory for documentation
  - **Time**: 15 minutes

- [ ] **1.3.2**: Move configuration files
  - Move `cursor-*.json` files to `config/`
  - Move `env.*` files to `config/`
  - Move `tsconfig.*.json` files to `config/`
  - **Time**: 15 minutes

- [ ] **1.3.3**: Move generated files
  - Move `*.json` benchmark files to `data/benchmarks/`
  - Move `*.db` files to `data/`
  - Move analysis files to `data/analysis/`
  - **Time**: 30 minutes

- [ ] **1.3.4**: Move documentation files
  - Move `*.md` files to `docs/`
  - Keep only essential files in root
  - **Time**: 30 minutes

- [ ] **1.3.5**: Update .gitignore
  - Add rules for generated files
  - Add rules for data directory
  - **Time**: 15 minutes

**Success Criteria**:
- ✅ Root directory has <20 files
- ✅ All files organized in proper directories
- ✅ .gitignore updated for new structure
- ✅ No broken references to moved files

---

## 📋 **Phase 2: Important Cleanup (4-6 hours)**

### **Task 2.1: Clean Benchmark Files**
**Status**: 🔴 **NOT STARTED**  
**Priority**: **HIGH**  
**Estimated Time**: 1-2 hours  
**Dependencies**: Task 1.3 (Organize Root Directory)  

**Problem**: 50+ benchmark and analysis files cluttering the project

**Files to Clean**:
- All `promptmcp-benchmark-*.json` files (20+ files)
- All `promptmcp-quality-benchmark-*.json` files (10+ files)
- Analysis files: `accuracy-analysis.js`, `cost-effectiveness-analysis.js`, etc.
- Test files: `test-*.js` files (15+ files)

**Sub-tasks**:
- [ ] **2.1.1**: Create benchmark directory structure
  - Create `data/benchmarks/` directory
  - Create `data/analysis/` directory
  - Create `test/` directory for test files
  - **Time**: 15 minutes

- [ ] **2.1.2**: Move benchmark files
  - Move all `*benchmark*.json` files to `data/benchmarks/`
  - Move all `*analysis*.js` files to `data/analysis/`
  - **Time**: 30 minutes

- [ ] **2.1.3**: Move test files
  - Move all `test-*.js` files to `test/`
  - Update test file references
  - **Time**: 30 minutes

- [ ] **2.1.4**: Clean up old test files
  - Remove outdated test files
  - Keep only essential test files
  - **Time**: 15 minutes

- [ ] **2.1.5**: Update test configuration
  - Update `jest.config.js` for new structure
  - Update `vitest.config.ts` for new structure
  - **Time**: 30 minutes

**Success Criteria**:
- ✅ All benchmark files organized in `data/benchmarks/`
- ✅ All analysis files organized in `data/analysis/`
- ✅ All test files organized in `test/`
- ✅ Test configuration updated

---

### **Task 2.2: Remove Commented Code**
**Status**: 🔴 **NOT STARTED**  
**Priority**: **HIGH**  
**Estimated Time**: 1-2 hours  
**Dependencies**: None  

**Problem**: 19 instances of commented code in production files

**Files to Clean**:
- `src/tools/enhanced-context7-enhance.tool.ts` (most affected)

**Sub-tasks**:
- [ ] **2.2.1**: Identify commented code
  - Search for commented code blocks
  - Identify commented validation code
  - Identify commented debug statements
  - **Time**: 30 minutes

- [ ] **2.2.2**: Remove commented code
  - Remove all commented code blocks
  - Remove commented validation code
  - Remove commented debug statements
  - **Time**: 45 minutes

- [ ] **2.2.3**: Add proper documentation
  - Add JSDoc comments where needed
  - Add inline comments for complex logic
  - **Time**: 30 minutes

- [ ] **2.2.4**: Verify functionality
  - Test that functionality still works
  - Ensure no broken code after cleanup
  - **Time**: 15 minutes

**Success Criteria**:
- ✅ No commented code in production files
- ✅ Proper documentation added where needed
- ✅ All functionality still works
- ✅ Code is clean and readable

---

### **Task 2.3: Consolidate Docker Files**
**Status**: 🔴 **NOT STARTED**  
**Priority**: **HIGH**  
**Estimated Time**: 1-2 hours  
**Dependencies**: None  

**Problem**: Multiple Docker configurations creating complexity

**Files to Consolidate**:
- `Dockerfile`
- `Dockerfile.mcp`
- `Dockerfile.simple`
- `docker-compose.yml`
- `docker-compose.dev.yml`
- `docker-compose.mcp.yml`
- `docker-compose.simple.yml`

**Sub-tasks**:
- [ ] **2.3.1**: Analyze Docker files
  - Compare all Dockerfile versions
  - Identify differences and use cases
  - **Time**: 30 minutes

- [ ] **2.3.2**: Create consolidated Dockerfile
  - Create single Dockerfile with multi-stage builds
  - Include all necessary configurations
  - **Time**: 45 minutes

- [ ] **2.3.3**: Consolidate docker-compose files
  - Keep only essential docker-compose files
  - Create environment-specific configurations
  - **Time**: 30 minutes

- [ ] **2.3.4**: Update documentation
  - Document Docker usage
  - Update README with new Docker instructions
  - **Time**: 15 minutes

- [ ] **2.3.5**: Test Docker configuration
  - Test new Docker setup
  - Ensure all functionality works
  - **Time**: 30 minutes

**Success Criteria**:
- ✅ Single Dockerfile with multi-stage builds
- ✅ Simplified docker-compose configuration
- ✅ All Docker functionality works
- ✅ Documentation updated

---

## 📊 **Progress Tracking**

### **Phase 1: Critical Cleanup**
- [ ] **Task 1.1**: Remove Debug Logging (2-3 hours)
- [ ] **Task 1.2**: Consolidate Documentation (1-2 hours)
- [ ] **Task 1.3**: Organize Root Directory (1-2 hours)

**Phase 1 Total**: 4-7 hours

### **Phase 2: Important Cleanup**
- [ ] **Task 2.1**: Clean Benchmark Files (1-2 hours)
- [ ] **Task 2.2**: Remove Commented Code (1-2 hours)
- [ ] **Task 2.3**: Consolidate Docker Files (1-2 hours)

**Phase 2 Total**: 3-6 hours

### **Overall Progress**
- **Total Tasks**: 6
- **Completed**: 0
- **In Progress**: 0
- **Total Estimated Time**: 7-13 hours

---

## 🎯 **Success Criteria**

### **Phase 1 Success**
- ✅ No debug logging in production code
- ✅ Single source of truth for documentation
- ✅ Root directory organized with <20 files
- ✅ All files in proper directories

### **Phase 2 Success**
- ✅ All benchmark files organized
- ✅ No commented code in production
- ✅ Single Dockerfile with multi-stage builds
- ✅ Simplified project structure

### **Overall Success**
- ✅ Project transformed to production-ready state
- ✅ Maintainable and organized codebase
- ✅ Professional project structure
- ✅ Improved developer experience

---

## 📝 **Notes**

### **Cleanup Principles**
1. **Preserve Functionality**: All cleanup must maintain existing functionality
2. **Improve Maintainability**: Make the codebase easier to navigate and maintain
3. **Follow Best Practices**: Apply clean code principles and TypeScript best practices
4. **Document Changes**: Update documentation to reflect new structure

### **Risk Mitigation**
- **Backup**: Create backup before major changes
- **Testing**: Test functionality after each major change
- **Incremental**: Make changes incrementally to avoid breaking functionality
- **Review**: Review changes before committing

### **Future Maintenance**
- **Regular Cleanup**: Schedule regular cleanup sessions
- **Code Standards**: Establish coding standards to prevent future clutter
- **Documentation**: Keep documentation up to date
- **Monitoring**: Monitor project structure for future cleanup needs

---

**Last Updated**: September 22, 2025  
**Next Review**: After Phase 1 completion  
**Estimated Completion**: 1-2 weeks
