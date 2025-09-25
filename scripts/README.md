# PromptMCP Test Scripts

This directory contains reusable scripts for running tests and generating reports.

## Scripts

### `cleanup-test-artifacts.js`
Automatically cleans up old test artifacts with configurable retention policies.

**Usage:**
```bash
# Clean up old test artifacts
node scripts/cleanup-test-artifacts.js

# Or use npm script
npm run test:cleanup
```

**Features:**
- ✅ **Retention Policies** - Configurable cleanup periods for different artifact types
- ✅ **Archive Support** - Archives old files instead of deleting them
- ✅ **Smart Cleanup** - Keeps recent artifacts, removes very old ones
- ✅ **Detailed Logging** - Shows what was cleaned up

**Retention Policies:**
- **Results**: Keep 30 days, archive after 90 days
- **Reports**: Keep 14 days, archive after 30 days
- **Logs**: Keep 7 days, archive after 14 days
- **Screenshots**: Keep 7 days, archive after 14 days

### `generate-test-report.js`
Generates beautiful HTML reports from test results.

**Usage:**
```bash
# Generate report from latest E2E test results
node scripts/generate-test-report.js e2e

# Generate report from latest quality test results  
node scripts/generate-test-report.js quality

# Generate report from specific file
node scripts/generate-test-report.js e2e mcp-e2e-test-results-2025-09-24T19-18-38-451Z.json

# Or use npm scripts
npm run report:generate e2e
npm run report:generate quality
```

**Features:**
- ✅ Supports both E2E and quality test formats
- ✅ Automatically finds latest test results
- ✅ Beautiful, responsive HTML reports
- ✅ Architecture success indicators
- ✅ Detailed metrics and before/after prompts
- ✅ Reusable and configurable

### `test-and-report.js`
Runs tests and automatically generates HTML reports in one command.

**Usage:**
```bash
# Run E2E tests and generate report
node scripts/test-and-report.js e2e

# Run quality tests and generate report
node scripts/test-and-report.js quality

# Or use npm scripts
npm run test:and:report e2e
npm run test:and:report quality
```

**Features:**
- ✅ Runs tests automatically
- ✅ Generates reports immediately after tests
- ✅ One-command workflow
- ✅ Error handling and status reporting

## Report Features

### E2E Test Reports
- **Architecture Success Indicators** - Shows MCP configuration compliance
- **Quality Metrics** - Framework detection, Context7 integration, project analysis
- **Before/After Prompts** - Shows original and enhanced prompts
- **Performance Data** - Response times and success rates
- **Error Details** - Clear error reporting when tests fail

### Quality Test Reports  
- **Comprehensive Metrics** - Accuracy, relevance, token efficiency
- **Performance Analysis** - Response times and optimization insights
- **Framework Detection** - Technology stack analysis
- **Visual Indicators** - Color-coded success/failure status

## File Patterns

The scripts automatically detect test result files using these patterns:
- **E2E Tests**: `mcp-e2e-test-results-*.json`
- **Quality Tests**: `promptmcp-quality-*.json`

## File Organization

All test artifacts are automatically organized in the `test-artifacts/` directory:

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

## Output

Reports are generated as HTML files with timestamps in organized directories:
- `test-artifacts/reports/e2e/promptmcp-e2e-test-report-YYYY-MM-DDTHH-MM-SS.html`
- `test-artifacts/reports/quality/promptmcp-quality-test-report-YYYY-MM-DDTHH-MM-SS.html`

## Integration

These scripts are designed to work with:
- ✅ PromptMCP E2E test suite
- ✅ Quality benchmark tests
- ✅ MCP protocol testing
- ✅ Docker-based testing
- ✅ CI/CD pipelines

## Examples

```bash
# Quick E2E test and report
npm run test:and:report e2e

# Generate report from existing results
npm run report:generate e2e

# Quality analysis
npm run test:and:report quality

# Clean up old artifacts
npm run test:cleanup

# Or use direct script calls
node scripts/test-and-report.js e2e
node scripts/generate-test-report.js e2e
node scripts/cleanup-test-artifacts.js
```

The generated reports are self-contained HTML files that can be:
- 📧 Shared via email
- 🌐 Hosted on web servers
- 📱 Viewed on mobile devices
- 🖨️ Printed for documentation
