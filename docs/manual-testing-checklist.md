# Manual Testing Checklist

## Overview
This checklist helps verify that the temperature optimization and prompt enhancement features are working correctly. Follow these steps to ensure everything is functioning as expected.

## Prerequisites
- OpenAI API key is set in environment variables
- PromptMCP server is running
- All dependencies are installed

## Basic Functionality Tests

### 1. Temperature Configuration ✅
- [ ] **Task breakdown temperature**: Should use 0.4 (balanced creativity)
- [ ] **Complexity analysis temperature**: Should use 0.1 (maximum consistency)  
- [ ] **Prompt enhancement temperature**: Should use 0.6 (creative improvements)
- [ ] **Summarization temperature**: Should use 0.3 (factual accuracy)
- [ ] **Connection test temperature**: Should use 0.1 (minimal variation)

**How to test:**
```bash
# Check console logs for temperature values in API calls
# Look for: "temperature: 0.4" in task breakdown calls
# Look for: "temperature: 0.1" in connection tests
```

### 2. Enhanced System Prompts ✅
- [ ] **Task breakdown prompts**: Should include role, expertise, guidelines, examples
- [ ] **Prompt enhancement prompts**: Should be more detailed and structured
- [ ] **Connection test prompts**: Should be minimal and focused
- [ ] **All prompts**: Should include few-shot examples where appropriate

**How to test:**
```bash
# Check console logs for system prompt content
# Look for: "Senior Technical Project Manager" in task breakdown
# Look for: "expertise" and "guidelines" in prompt content
```

### 3. Model Selection ✅
- [ ] **Task breakdown**: Should use gpt-4o (complex reasoning)
- [ ] **Connection tests**: Should use gpt-4o-mini (cost-effective)
- [ ] **Simple operations**: Should use gpt-4o-mini
- [ ] **Complex operations**: Should use gpt-4o

**How to test:**
```bash
# Check console logs for model selection
# Look for: "Model: gpt-4o" in task breakdown calls
# Look for: "Model: gpt-4o-mini" in connection tests
```

### 4. Cost Monitoring ✅
- [ ] **Cost tracking**: Should track costs for each API call
- [ ] **Budget limits**: Should prevent requests over daily limit
- [ ] **Cost summary**: Should provide accurate cost breakdown
- [ ] **Warnings**: Should warn when approaching limits

**How to test:**
```bash
# Check console logs for cost tracking
# Look for: "Cost tracked" messages
# Look for: "Approaching daily cost limit" warnings
```

## Quick Test Commands

### Test Task Breakdown
```bash
# Test with a simple request
curl -X POST http://localhost:3000/api/breakdown \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create a simple React component", "context": ""}'

# Expected: Should use gpt-4o with temperature 0.4
# Expected: Should return structured JSON with mainTasks, subtasks, dependencies
```

### Test Prompt Enhancement
```bash
# Test with a basic prompt
curl -X POST http://localhost:3000/api/enhance \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Make a button", "context": {"framework": "react"}}'

# Expected: Should use gpt-4o with temperature 0.6
# Expected: Should return enhanced prompt with more detail
```

### Test Connection
```bash
# Test OpenAI connection
curl -X GET http://localhost:3000/api/health

# Expected: Should use gpt-4o-mini with temperature 0.1
# Expected: Should return success status
```

## Debug Commands

### Check Temperature Settings
```bash
# Run the temperature debug script
npm run debug:temperature

# Expected output:
# Task Breakdown: 0.4
# Complexity Analysis: 0.1
# Prompt Enhancement: 0.6
# Summarization: 0.3
# Connection Test: 0.1
```

### Check Model Selection
```bash
# Run the model selection debug script
npm run debug:models

# Expected output:
# Task Breakdown: gpt-4o
# Connection Test: gpt-4o-mini
# Simple Operations: gpt-4o-mini
# Complex Operations: gpt-4o
```

### Check Cost Monitoring
```bash
# Run the cost monitoring debug script
npm run debug:costs

# Expected output:
# Daily Cost: $X.XX
# Remaining Budget: $X.XX
# Request Count: X
# Average Cost per Request: $X.XX
```

## Response Quality Tests

### 1. Task Breakdown Quality ✅
- [ ] **Structured output**: Returns valid JSON with mainTasks, subtasks, dependencies
- [ ] **Realistic estimates**: Time estimates are between 0.5-8 hours
- [ ] **Clear priorities**: Tasks have appropriate priority levels
- [ ] **Logical dependencies**: Dependencies make sense
- [ ] **Actionable tasks**: Tasks are specific and implementable

### 2. Prompt Enhancement Quality ✅
- [ ] **Improved clarity**: Enhanced prompts are clearer than originals
- [ ] **Added context**: Relevant technical context is included
- [ ] **Specific requirements**: Vague requests become specific
- [ ] **Best practices**: Modern best practices are included
- [ ] **Maintainable**: Enhanced prompts are easy to follow

### 3. Consistency Tests ✅
- [ ] **Same input, same output**: Identical requests return similar results
- [ ] **Temperature effects**: Different temperatures produce different creativity levels
- [ ] **Model consistency**: Same model selection for same operation types
- [ ] **Error handling**: Graceful handling of API errors

## Performance Tests

### 1. Response Time ✅
- [ ] **Task breakdown**: < 10 seconds for typical requests
- [ ] **Prompt enhancement**: < 5 seconds for typical requests
- [ ] **Connection test**: < 3 seconds
- [ ] **No timeouts**: All requests complete successfully

### 2. Cost Efficiency ✅
- [ ] **Reasonable costs**: Daily costs stay under $5
- [ ] **Model optimization**: Appropriate models used for each operation
- [ ] **Token efficiency**: No excessive token usage
- [ ] **Budget protection**: Requests blocked when over limit

## Error Handling Tests

### 1. API Errors ✅
- [ ] **Invalid API key**: Clear error message
- [ ] **Rate limiting**: Graceful handling with retry
- [ ] **Network errors**: Proper error reporting
- [ ] **Invalid requests**: Helpful error messages

### 2. Configuration Errors ✅
- [ ] **Missing config**: Default values used
- [ ] **Invalid temperatures**: Validation errors
- [ ] **Invalid models**: Fallback to default
- [ ] **Cost limit exceeded**: Clear error message

## Success Criteria

### ✅ All tests should pass
- [ ] All basic functionality tests pass
- [ ] All response quality tests pass
- [ ] All performance tests pass
- [ ] All error handling tests pass

### ✅ No critical issues
- [ ] No crashes or unhandled errors
- [ ] No excessive costs or token usage
- [ ] No significant performance degradation
- [ ] No data loss or corruption

### ✅ Improved user experience
- [ ] Better response quality
- [ ] More consistent outputs
- [ ] Faster response times
- [ ] Better error messages

## Troubleshooting

### Common Issues

**Temperature not applied:**
- Check console logs for temperature values
- Verify TemperatureConfigService is initialized
- Check operation parameter is passed correctly

**Enhanced prompts not working:**
- Check console logs for system prompt content
- Verify PromptTemplateService is initialized
- Check few-shot examples are loaded

**Model selection not working:**
- Check console logs for model selection
- Verify ModelSelectionService is initialized
- Check operation type is correct

**Cost monitoring not working:**
- Check console logs for cost tracking
- Verify CostMonitoringService is initialized
- Check cost limits are set correctly

### Debug Steps

1. **Check logs**: Look for error messages in console
2. **Verify services**: Ensure all services are initialized
3. **Test individually**: Test each service separately
4. **Check configuration**: Verify all config values are correct
5. **Restart server**: Try restarting the PromptMCP server

## Next Steps

After completing this checklist:

1. **Document any issues** found during testing
2. **Update configuration** if needed
3. **Run automated tests** to verify fixes
4. **Deploy to production** if all tests pass
5. **Monitor performance** in production environment

---

**Note**: This checklist should be completed after implementing the temperature optimization and prompt enhancement features. All items should be checked off before considering the implementation complete.
