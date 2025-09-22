# PromptMCP Benchmark Suite

This directory contains a comprehensive benchmark suite for measuring and tracking PromptMCP performance improvements over time.

## 🎯 Overview

The benchmark suite consists of three main components:

1. **General Benchmark** (`benchmark-repeatable.js`) - Tests overall PromptMCP performance
2. **Context7 Benchmark** (`context7-benchmark.js`) - Tests Context7 integration effectiveness
3. **Comparison Tool** (`benchmark-comparison.js`) - Compares results over time

## 🚀 Quick Start

### Run All Benchmarks
```bash
node run-benchmarks.js
```

### Run Specific Benchmarks
```bash
# General benchmark only
node benchmark-repeatable.js

# Context7 benchmark only
node context7-benchmark.js

# Quick benchmarks (general only)
node run-benchmarks.js --quick

# Context7 benchmarks only
node run-benchmarks.js --context7-only
```

### Compare with Previous Results
```bash
# Run benchmarks and compare
node run-benchmarks.js --compare

# Compare specific benchmark types
node benchmark-comparison.js --type=general
node benchmark-comparison.js --type=context7
node benchmark-comparison.js --type=all --days=7
```

## 📊 Benchmark Types

### 1. General Benchmark (`benchmark-repeatable.js`)

**Purpose**: Tests overall PromptMCP performance and token efficiency

**Test Cases**:
- Simple Math Question (2+2)
- Simple HTML Button
- Medium React Component
- Complex Full-Stack Task
- TypeScript Debug Task

**Metrics**:
- Token efficiency (ratio of enhanced to original tokens)
- Framework detection accuracy
- Context7 usage rate
- Over-engineering rate
- Response time

**Usage**:
```bash
node benchmark-repeatable.js
node benchmark-repeatable.js --compare-with-baseline
```

### 2. Context7 Benchmark (`context7-benchmark.js`)

**Purpose**: Tests Context7 integration effectiveness specifically

**Test Cases**:
- HTML Button Creation
- React Component
- Full-Stack Application
- TypeScript Error Fix
- Simple Math Question
- Vue Component
- Angular Service
- Node.js API

**Metrics**:
- Library selection accuracy
- Multi-library resolution
- Context7 relevance score
- Documentation quality
- Response time

**Usage**:
```bash
node context7-benchmark.js
node context7-benchmark.js --compare-with-baseline
```

### 3. Comparison Tool (`benchmark-comparison.js`)

**Purpose**: Compares benchmark results over time and identifies trends

**Features**:
- Compares latest results with previous runs
- Identifies improving/declining trends
- Generates recommendations
- Tracks critical issues resolution

**Usage**:
```bash
# Compare all benchmarks from last 7 days
node benchmark-comparison.js

# Compare specific types
node benchmark-comparison.js --type=general --days=7
node benchmark-comparison.js --type=context7 --days=14
node benchmark-comparison.js --type=all --days=30
```

## 📈 Success Metrics

### General Benchmark Targets
- **Token Efficiency**: <3.0x average ratio
- **Simple Tasks**: <2.0x ratio
- **Medium Tasks**: <5.0x ratio
- **Complex Tasks**: <10.0x ratio
- **Framework Accuracy**: >80%
- **Over-Engineering Rate**: <20%
- **Response Time**: <50ms

### Context7 Benchmark Targets
- **Library Selection Accuracy**: >90%
- **Multi-Library Resolution**: 2-3 libraries for complex prompts
- **Context7 Usage Rate**: Smart usage (0% simple, 50% medium, 100% complex)
- **Context7 Relevance**: >85%
- **Documentation Quality**: Optimized by complexity
- **Response Time**: <50ms

## 🔧 Configuration

### Environment Variables
```bash
# Optional: Set log level
export LOG_LEVEL=info

# Optional: Set Context7 API key
export CONTEXT7_API_KEY=your_key_here
```

### Test Customization
You can modify test cases in the respective benchmark files:
- `TEST_CASES` in `benchmark-repeatable.js`
- `CONTEXT7_TEST_CASES` in `context7-benchmark.js`

## 📁 Output Files

### Generated Files
- `promptmcp-benchmark-YYYY-MM-DDTHH-MM-SS-sssZ.json` - General benchmark results
- `context7-benchmark-YYYY-MM-DDTHH-MM-SS-sssZ.json` - Context7 benchmark results
- `benchmark-comparison-YYYY-MM-DDTHH-MM-SS-sssZ.json` - Comparison results
- `benchmark-suite-YYYY-MM-DDTHH-MM-SS-sssZ.json` - Suite execution results

### File Structure
```json
{
  "timestamp": "2025-09-22T00:00:00.000Z",
  "testType": "Benchmark Type",
  "version": "1.0.0",
  "testResults": [...],
  "summary": {...},
  "context7Metrics": {...},
  "improvements": {...},
  "criticalIssues": [...]
}
```

## 🚨 Critical Issues Tracking

The benchmarks automatically identify and track critical issues:

### General Issues
- Extreme token bloat (>10x ratio)
- Poor framework detection (<70% accuracy)
- High over-engineering rate (>50%)

### Context7 Issues
- Poor library selection accuracy (<70%)
- Low multi-library resolution (<30%)
- Poor Context7 relevance (<70%)
- Low documentation quality (<60%)

## 💡 Recommendations

The benchmarks generate automatic recommendations based on:

1. **Performance Trends**: Improving/declining metrics
2. **Critical Issues**: New or unresolved issues
3. **Context7 Effectiveness**: Library selection and relevance
4. **Benchmark Failures**: Failed test executions

## 🔄 Continuous Integration

### Daily Runs
```bash
# Add to cron or CI pipeline
0 2 * * * cd /path/to/promptmcp && node run-benchmarks.js --compare
```

### Weekly Reports
```bash
# Generate weekly comparison report
node benchmark-comparison.js --type=all --days=7
```

### Monitoring
- Set up alerts for benchmark failures
- Monitor critical issues resolution
- Track improvement trends over time

## 🛠️ Troubleshooting

### Common Issues

1. **Import Errors**: Ensure `dist/` directory is built
   ```bash
   npm run build
   ```

2. **Context7 API Errors**: Check API key and network connectivity
   ```bash
   export CONTEXT7_API_KEY=your_key_here
   ```

3. **Memory Issues**: Increase Node.js memory limit
   ```bash
   node --max-old-space-size=4096 benchmark-repeatable.js
   ```

4. **Timeout Issues**: Increase timeout for slow tests
   ```bash
   export BENCHMARK_TIMEOUT=60000
   ```

### Debug Mode
```bash
# Enable debug logging
export LOG_LEVEL=debug
node benchmark-repeatable.js
```

## 📚 Related Files

- `CONTEXT7_OPTIMIZATION_TASK_LIST.md` - Context7 optimization tasks
- `PROMPTMCP_BASELINE_BENCHMARK.md` - Baseline benchmark report
- `CONTEXT7_INTEGRATION_SUMMARY.md` - Context7 integration analysis
- `src/tools/enhanced-context7-enhance.tool.ts` - Main enhancement tool

## 🎯 Next Steps

1. **Run Initial Baseline**: `node run-benchmarks.js`
2. **Implement Optimizations**: Follow `CONTEXT7_OPTIMIZATION_TASK_LIST.md`
3. **Track Progress**: Run benchmarks regularly
4. **Compare Results**: Use comparison tool to measure improvements
5. **Iterate**: Continue optimization based on benchmark results

---

**Note**: These benchmarks are designed to be run repeatedly to track improvements over time. Each run generates timestamped results that can be compared with previous runs to measure progress.
