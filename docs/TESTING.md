# Testing Guide

## Overview

PromptMCP includes a comprehensive testing suite with unit tests, integration tests, and end-to-end tests to ensure reliability and quality.

## Test Structure

```
test/
├── unit/                          # Unit tests for individual components
│   ├── services/                  # Service unit tests
│   ├── tools/                     # Tool unit tests
│   └── utils/                     # Utility function tests
├── integration/                   # Integration tests
│   ├── mcp-server.test.ts        # MCP server integration tests
│   ├── context7-integration.test.ts # Context7 integration tests
│   └── database.test.ts          # Database integration tests
├── test-e2e-mcp.js               # End-to-end MCP protocol tests
├── test-e2e-http.js              # End-to-end HTTP API tests
└── fixtures/                      # Test fixtures and mock data
```

## Test Artifacts Organization

All test results are organized in the `test-artifacts/` directory:

```
test-artifacts/
├── results/                       # JSON test result files
│   ├── e2e/                      # End-to-end test results
│   ├── unit/                     # Unit test results
│   └── integration/              # Integration test results
├── reports/                       # HTML test reports
│   ├── e2e/                      # E2E test reports
│   ├── quality/                  # Quality benchmark reports
│   └── architecture/             # Architecture test reports
├── logs/                         # Test execution logs
└── screenshots/                  # Playwright screenshots
```

## Running Tests

### All Tests

```bash
# Run the complete test suite
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

### Specific Test Suites

```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# End-to-end tests
npm run test:e2e

# MCP-specific tests
npm run test:e2e:mcp

# HTTP-specific tests
npm run test:e2e:http
```

### Individual Test Files

```bash
# Run a specific test file
npm test -- src/services/cache/prompt-cache.service.test.ts

# Run tests matching a pattern
npm test -- --grep "prompt enhancement"

# Run tests in a specific directory
npm test -- test/unit/services/
```

## Test Types

### Unit Tests

**Purpose**: Test individual components in isolation

**Location**: `test/unit/`

**Examples**:
- Service method testing
- Utility function testing
- Component logic testing

**Running**:
```bash
npm run test:unit
```

**Key Test Files**:
- `prompt-cache.service.test.ts` - Cache service tests
- `simple-context7-client.test.ts` - Context7 client tests
- `framework-detector-simple.test.ts` - Framework detection tests

### Integration Tests

**Purpose**: Test component interactions and service integration

**Location**: `test/integration/`

**Examples**:
- MCP server integration
- Context7 service integration
- Database operations
- Service communication

**Running**:
```bash
npm run test:integration
```

### End-to-End Tests

**Purpose**: Test complete user workflows and system behavior

**Location**: `test/test-e2e-*.js`

**Examples**:
- MCP protocol communication
- HTTP API endpoints
- Complete enhancement workflows
- Tool execution flows

**Running**:
```bash
npm run test:e2e
```

## Test Configuration

### Vitest Configuration

**File**: `vitest.config.ts`

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        'dist/',
        '**/*.d.ts'
      ]
    }
  }
});
```

### Test Environment Setup

**File**: `test/setup.ts`

```typescript
// Global test setup
import { beforeAll, afterAll } from 'vitest';

beforeAll(() => {
  // Setup test environment
});

afterAll(() => {
  // Cleanup test environment
});
```

## Test Data and Fixtures

### Mock Data

**Location**: `test/fixtures/`

**Examples**:
- Sample prompts for testing
- Mock Context7 responses
- Test project structures
- Expected output formats

### Test Databases

```bash
# Test databases are created automatically
test-todos.db          # Todo service test database
test-prompt-cache.db   # Cache service test database
```

## Test Utilities

### Shared Test Helpers

**Location**: `test/utils/`

**Examples**:
- Database setup/teardown
- Mock service creation
- Test data generation
- Assertion helpers

### Test Scripts

**Location**: `scripts/`

**Examples**:
- `test-and-report.js` - Run tests and generate reports
- `generate-test-report.js` - Generate HTML test reports
- `cleanup-test-artifacts.js` - Clean up old test artifacts

## Quality Metrics

### Test Coverage

**Current Coverage**: ~40% (improved from ~15%)

**Target Coverage**: >50%

**Coverage Reports**:
```bash
# Generate coverage report
npm run test:coverage

# View coverage report
open coverage/index.html
```

### Performance Benchmarks

**Response Time Targets**:
- Cached responses: <2s
- Uncached responses: <5s
- Framework detection: <10ms

**Success Rate Targets**:
- Enhancement operations: >99%
- Framework detection: >90%
- Cache hit rate: >80%

## Debugging Tests

### Debug Mode

```bash
# Run tests with debug output
DEBUG=* npm test

# Run specific test with debug
DEBUG=promptmcp:* npm test -- --grep "enhance tool"
```

### Test Logs

**Location**: `test-artifacts/logs/`

**Log Files**:
- `test-execution.log` - Test execution logs
- `mcp-server.log` - MCP server logs during tests
- `context7-integration.log` - Context7 integration logs

### Common Test Issues

1. **Database Lock Issues**:
   ```bash
   # Clean up test databases
   rm -f test-*.db
   npm test
   ```

2. **Port Conflicts**:
   ```bash
   # Check for port usage
   lsof -i :3000
   lsof -i :3001
   ```

3. **Context7 API Issues**:
   ```bash
   # Test Context7 connectivity
   npm run test:context7
   ```

## Continuous Integration

### GitHub Actions

**Workflow**: `.github/workflows/test.yml`

**Triggers**:
- Push to main branch
- Pull request creation
- Manual trigger

**Steps**:
1. Checkout code
2. Setup Node.js
3. Install dependencies
4. Run linting
5. Run type checking
6. Run tests
7. Generate coverage report
8. Upload test artifacts

### Test Artifacts Retention

**Retention Policy**:
- Test results: 30 days
- Coverage reports: 90 days
- Screenshots: 7 days
- Logs: 14 days

## Best Practices

### Writing Tests

1. **Test Naming**: Use descriptive test names
   ```typescript
   // Good
   test('should enhance prompt with React framework detection')
   
   // Bad
   test('enhance test')
   ```

2. **Test Structure**: Follow AAA pattern (Arrange, Act, Assert)
   ```typescript
   test('should cache enhanced prompt', async () => {
     // Arrange
     const prompt = 'Create a React component';
     const enhancedPrompt = 'Enhanced prompt with context';
     
     // Act
     await cacheService.cachePrompt(prompt, enhancedPrompt);
     const cached = await cacheService.getCachedPrompt(prompt);
     
     // Assert
     expect(cached).toBeDefined();
     expect(cached.enhancedPrompt).toBe(enhancedPrompt);
   });
   ```

3. **Mock External Dependencies**: Mock Context7, OpenAI, and database calls
   ```typescript
   // Mock Context7 client
   const mockContext7Client = {
     resolveLibraryId: vi.fn().mockResolvedValue('/facebook/react'),
     getLibraryDocs: vi.fn().mockResolvedValue('React documentation')
   };
   ```

4. **Clean Up**: Always clean up test data
   ```typescript
   afterEach(async () => {
     await cleanupTestDatabase();
   });
   ```

### Test Data Management

1. **Use Fixtures**: Create reusable test data
2. **Isolate Tests**: Each test should be independent
3. **Clean State**: Reset state between tests
4. **Realistic Data**: Use realistic test data

## Test Reports

### HTML Reports

**Generation**:
```bash
npm run report:generate
```

**Location**: `test-artifacts/reports/`

**Contents**:
- Test execution summary
- Coverage reports
- Performance metrics
- Error details

### JSON Results

**Location**: `test-artifacts/results/`

**Format**:
```json
{
  "timestamp": "2024-01-01T00:00:00Z",
  "testSuite": "unit",
  "totalTests": 23,
  "passed": 23,
  "failed": 0,
  "skipped": 0,
  "duration": 1500,
  "coverage": {
    "lines": 85.2,
    "functions": 90.1,
    "branches": 78.5,
    "statements": 85.2
  }
}
```

## Troubleshooting

### Common Test Failures

1. **Timeout Errors**:
   - Increase test timeout
   - Check for hanging promises
   - Verify async/await usage

2. **Database Errors**:
   - Check database file permissions
   - Verify database schema
   - Clean up test databases

3. **API Errors**:
   - Verify API keys are set
   - Check network connectivity
   - Mock external API calls

### Debug Commands

```bash
# Run tests with verbose output
npm test -- --reporter=verbose

# Run single test with debug
npm test -- --grep "specific test" --reporter=verbose

# Check test database
sqlite3 test-todos.db ".tables"

# View test logs
tail -f test-artifacts/logs/test-execution.log
```

## Contributing to Tests

### Adding New Tests

1. **Create test file** in appropriate directory
2. **Follow naming convention**: `*.test.ts`
3. **Include comprehensive coverage**
4. **Add to test suite** if needed
5. **Update documentation**

### Test Review Checklist

- [ ] Tests cover happy path scenarios
- [ ] Tests cover error scenarios
- [ ] Tests are isolated and independent
- [ ] Mock external dependencies
- [ ] Clean up test data
- [ ] Use descriptive test names
- [ ] Follow AAA pattern
- [ ] Include appropriate assertions

## Resources

- **Vitest Documentation**: https://vitest.dev/
- **Testing Best Practices**: https://testingjavascript.com/
- **MCP Protocol Testing**: https://modelcontextprotocol.io/
- **Test Artifacts**: `test-artifacts/` directory
