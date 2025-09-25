# PromptMCP Testing Guide

A comprehensive guide to testing PromptMCP, including test organization, metrics, and best practices.

## 📋 Table of Contents

- [Overview](#overview)
- [Test Organization](#test-organization)
- [Running Tests](#running-tests)
- [Test Types](#test-types)
- [Metrics and Reporting](#metrics-and-reporting)
- [Test Artifacts](#test-artifacts)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

PromptMCP includes a comprehensive testing suite with multiple test types, advanced metrics, and organized artifact management. The testing infrastructure supports:

- **End-to-End (E2E) Testing** - Full MCP protocol testing with Docker
- **Quality Benchmarking** - Comprehensive quality metrics and scoring
- **Unit Testing** - Individual component testing
- **Integration Testing** - Service integration validation
- **Performance Testing** - Response time and efficiency analysis

## 📁 Test Organization

All test artifacts are organized in the `test-artifacts/` directory:

```
test-artifacts/
├── results/           # JSON test result files
│   ├── e2e/          # End-to-end test results
│   ├── unit/         # Unit test results
│   └── integration/  # Integration test results
├── reports/           # HTML test reports
│   ├── e2e/          # E2E test reports
│   ├── quality/      # Quality benchmark reports
│   └── architecture/ # Architecture test reports
├── logs/             # Test execution logs
└── screenshots/      # Playwright screenshots
```

## 🚀 Running Tests

### Quick Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run tests and generate reports
npm run test:and:report e2e

# Generate HTML reports
npm run report:generate e2e

# Clean up old artifacts
npm run test:cleanup

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:smoke
```

### Direct Script Usage

```bash
# E2E testing with Docker
node test/test-mcp-e2e-docker.js

# Generate reports
node scripts/generate-test-report.js e2e

# Cleanup artifacts
node scripts/cleanup-test-artifacts.js
```

## 🧪 Test Types

### 1. End-to-End (E2E) Tests

**Purpose**: Full MCP protocol testing with production Docker environment

**Location**: `test/test-mcp-e2e-docker.js`

**Features**:
- ✅ Docker-based testing
- ✅ MCP protocol validation
- ✅ API key management
- ✅ Real Context7 integration
- ✅ Comprehensive metrics

**Test Cases**:
- Simple Hello World
- Medium Complexity Task
- Complex Full-Stack Task
- Debug Scenario
- Optimization Challenge

### 2. Quality Benchmark Tests

**Purpose**: Comprehensive quality scoring and metrics analysis

**Location**: `test/benchmark-quality-comprehensive.js`

**Metrics**:
- **Accuracy** (0-20 points)
- **Relevance** (0-20 points)
- **Token Efficiency** (0-20 points)
- **Response Time** (0-20 points)
- **Framework Detection** (0-20 points)
- **Context7 Integration** (0-20 points)
- **Project Analysis** (0-20 points)
- **Code Patterns** (0-20 points)
- **Prompt Enhancement** (0-20 points)
- **Response Quality** (0-20 points)

### 3. Unit Tests

**Purpose**: Individual component testing

**Location**: `test/unit/`

**Coverage**:
- Service classes
- Utility functions
- Error handling
- Configuration loading

### 4. Integration Tests

**Purpose**: Service integration validation

**Location**: `test/integration/`

**Coverage**:
- MCP server integration
- Context7 client integration
- Cache service integration
- Configuration service integration

## 📊 Metrics and Reporting

### Phase 1 Metrics (Implemented)

#### API Cost Tracking
- **Total Cost**: Actual costs for OpenAI/Context7 calls
- **Cost Per Token**: Cost efficiency analysis
- **Resource Utilization**: API usage patterns

#### Cache Performance Metrics
- **Hit Rate**: Cache efficiency percentage
- **Cache Efficiency**: Performance optimization
- **Average Hit Time**: Cache response speed
- **Average Miss Time**: Cache miss handling
- **Performance Gain**: Cache benefit analysis

#### Semantic Similarity Scoring
- **Prompt-Response Similarity**: Content alignment
- **Intent Preservation**: Goal consistency
- **Semantic Distance**: Content relationship
- **Quality Score**: Overall similarity rating

#### Context7-Specific Metrics
- **Library Resolution**: Framework detection accuracy
- **Documentation Quality**: Content relevance
- **Integration Success**: API call success rate
- **Response Time**: Context7 API performance

### Phase 2 Metrics (Implemented)

#### Content Quality Metrics
- **Readability Scores**: Flesch-Kincaid, SMOG, ARI
- **Grade Level**: Content complexity assessment
- **Structure Analysis**: Headers, lists, code blocks
- **Organization Level**: Content organization quality

#### System Performance Metrics
- **Resource Usage**: CPU, memory, disk, network
- **Throughput**: Requests per second/minute
- **Response Times**: Average, P95, P99
- **Availability**: Uptime and health status
- **Error Rates**: System error tracking

#### Reliability Metrics
- **Uptime Tracking**: Total uptime and percentage
- **Error Analysis**: Error rates and types
- **Resolution Metrics**: MTBF, MTTR, resolution rates
- **Health Status**: Overall system health
- **Trend Analysis**: Performance trends over time

### HTML Reports

**Features**:
- ✅ **Beautiful Design** - Responsive, modern interface
- ✅ **Interactive Elements** - Expandable sections, JSON viewers
- ✅ **Comprehensive Metrics** - All Phase 1 & 2 metrics
- ✅ **Before/After Prompts** - Original vs enhanced prompts
- ✅ **Performance Data** - Response times and efficiency
- ✅ **Error Details** - Clear error reporting
- ✅ **Download Links** - Full JSON response downloads

## 🗂️ Test Artifacts

### File Naming Conventions

#### Test Results (JSON)
- `{test-type}-{timestamp}.json`
- Example: `e2e-2025-09-24T20-16-18-135Z.json`

#### Test Reports (HTML)
- `{test-type}-{timestamp}.html`
- Example: `e2e-report-2025-09-24T20-16-18-135Z.html`

#### Logs
- `{test-type}-{timestamp}.log`
- Example: `e2e-execution-2025-09-24T20-16-18-135Z.log`

### Retention Policies

- **Results**: Keep 30 days, archive after 90 days
- **Reports**: Keep 14 days, archive after 30 days
- **Logs**: Keep 7 days, archive after 14 days
- **Screenshots**: Keep 7 days, archive after 14 days

### Cleanup Process

```bash
# Manual cleanup
npm run test:cleanup

# Automatic cleanup (recommended)
# Add to CI/CD pipeline or cron job
```

## 🎯 Best Practices

### 1. Test Organization
- Use descriptive test names
- Group related tests together
- Keep test data in separate files
- Use consistent naming conventions

### 2. Metrics Collection
- Collect comprehensive metrics
- Validate metric accuracy
- Use consistent scoring scales
- Document metric meanings

### 3. Report Generation
- Generate reports after each test run
- Include both summary and detailed views
- Use visual indicators for quick assessment
- Make reports shareable and accessible

### 4. Artifact Management
- Use organized directory structure
- Implement retention policies
- Clean up old artifacts regularly
- Archive important results

### 5. Error Handling
- Provide clear error messages
- Include debugging information
- Log errors appropriately
- Handle edge cases gracefully

## 🔧 Troubleshooting

### Common Issues

#### 1. Docker Container Not Starting
```bash
# Check Docker status
docker ps

# Restart containers
docker-compose -f vibe/docker-compose.yml restart

# Check logs
docker logs promptmcp-server
```

#### 2. API Key Issues
```bash
# Check configuration
cat mcp-config.json

# Verify environment variables
echo $CONTEXT7_API_KEY
echo $OPENAI_API_KEY
```

#### 3. Test Failures
```bash
# Run with verbose output
node test/test-mcp-e2e-docker.js --verbose

# Check specific test case
node test/test-mcp-e2e-docker.js --test "Simple Hello World"
```

#### 4. Report Generation Issues
```bash
# Check file permissions
ls -la test-artifacts/

# Verify JSON file format
node -e "console.log(JSON.parse(require('fs').readFileSync('test-artifacts/results/e2e/latest.json')))"
```

### Debug Mode

Enable debug mode for detailed logging:

```bash
# Set debug environment variable
export DEBUG=promptmcp:*

# Run tests with debug output
npm run test:e2e
```

### Performance Issues

If tests are running slowly:

1. Check Docker resource allocation
2. Verify network connectivity
3. Monitor system resources
4. Review cache performance

## 📚 Additional Resources

- **[Scripts Documentation](scripts/README.md)** - Detailed script usage
- **[API Documentation](API.md)** - Complete API reference
- **[Configuration Guide](CONFIGURATION.md)** - Setup and configuration
- **[Architecture Guide](ARCHITECTURE.md)** - System architecture overview

## 🤝 Contributing

When adding new tests:

1. Follow existing naming conventions
2. Include comprehensive metrics
3. Update documentation
4. Add to appropriate test category
5. Ensure cleanup compatibility

For questions or issues, please refer to the main project documentation or create an issue in the repository.
