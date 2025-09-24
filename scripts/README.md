# PromptMCP Test Scripts

This directory contains reusable scripts for running tests and generating reports.

## Scripts

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

## Output

Reports are generated as HTML files with timestamps:
- `promptmcp-e2e-test-report-YYYY-MM-DDTHH-MM-SS.html`
- `promptmcp-quality-test-report-YYYY-MM-DDTHH-MM-SS.html`

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
node scripts/test-and-report.js e2e

# Generate report from existing results
node scripts/generate-test-report.js e2e

# Quality analysis
node scripts/test-and-report.js quality
```

The generated reports are self-contained HTML files that can be:
- 📧 Shared via email
- 🌐 Hosted on web servers
- 📱 Viewed on mobile devices
- 🖨️ Printed for documentation
