/**
 * Comprehensive URL Testing Script
 * 
 * Tests all available URLs in the LocalMCP Docker deployment
 * Uses Playwright to validate functionality and catch issues
 */

const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:3000';
const NGINX_URL = 'http://localhost:80';

const URLS_TO_TEST = [
  // Main application endpoints
  { url: `${BASE_URL}/`, name: 'Root (redirects to guide)', expected: 200 },
  { url: `${BASE_URL}/health`, name: 'Health Check', expected: 200 },
  { url: `${BASE_URL}/mcp`, name: 'MCP Server', expected: 200, method: 'POST' },
  
  // User guide pages
  { url: `${BASE_URL}/docs/comprehensive-guide/index.html`, name: 'Comprehensive Guide - Home', expected: 200 },
  { url: `${BASE_URL}/docs/comprehensive-guide/quick-start.html`, name: 'Comprehensive Guide - Quick Start', expected: 200 },
  { url: `${BASE_URL}/docs/comprehensive-guide/getting-started.html`, name: 'Comprehensive Guide - Getting Started', expected: 200 },
  { url: `${BASE_URL}/docs/comprehensive-guide/tool-reference.html`, name: 'Comprehensive Guide - Tool Reference', expected: 200 },
  { url: `${BASE_URL}/docs/comprehensive-guide/pipeline-guide.html`, name: 'Comprehensive Guide - Pipeline Guide', expected: 200 },
  { url: `${BASE_URL}/docs/comprehensive-guide/admin-console.html`, name: 'Comprehensive Guide - Admin Console', expected: 200 },
  { url: `${BASE_URL}/docs/comprehensive-guide/troubleshooting.html`, name: 'Comprehensive Guide - Troubleshooting', expected: 200 },
  
  // Simple user guide pages
  { url: `${BASE_URL}/docs/user-guide/index.html`, name: 'Simple Guide - Home', expected: 200 },
  { url: `${BASE_URL}/docs/user-guide/quick-start.html`, name: 'Simple Guide - Quick Start', expected: 200 },
  { url: `${BASE_URL}/docs/user-guide/getting-started.html`, name: 'Simple Guide - Getting Started', expected: 200 },
  { url: `${BASE_URL}/docs/user-guide/tool-reference.html`, name: 'Simple Guide - Tool Reference', expected: 200 },
  { url: `${BASE_URL}/docs/user-guide/pipeline-guide.html`, name: 'Simple Guide - Pipeline Guide', expected: 200 },
  { url: `${BASE_URL}/docs/user-guide/admin-console.html`, name: 'Simple Guide - Admin Console', expected: 200 },
  { url: `${BASE_URL}/docs/user-guide/troubleshooting.html`, name: 'Simple Guide - Troubleshooting', expected: 200 },
  
  // CSS and JS assets
  { url: `${BASE_URL}/docs/comprehensive-guide/styles/main.css`, name: 'Main CSS', expected: 200 },
  { url: `${BASE_URL}/docs/comprehensive-guide/styles/interactive.css`, name: 'Interactive CSS', expected: 200 },
  { url: `${BASE_URL}/docs/comprehensive-guide/scripts/main.js`, name: 'Main JS', expected: 200 },
  { url: `${BASE_URL}/docs/comprehensive-guide/scripts/search.js`, name: 'Search JS', expected: 200 },
  { url: `${BASE_URL}/docs/comprehensive-guide/scripts/analytics.js`, name: 'Analytics JS', expected: 200 },
  { url: `${BASE_URL}/docs/comprehensive-guide/scripts/interactive.js`, name: 'Interactive JS', expected: 200 },
  
  // PWA assets
  { url: `${BASE_URL}/docs/comprehensive-guide/manifest.json`, name: 'PWA Manifest', expected: 200 },
  { url: `${BASE_URL}/docs/comprehensive-guide/sw.js`, name: 'Service Worker', expected: 200 },
  { url: `${BASE_URL}/docs/comprehensive-guide/search-index.json`, name: 'Search Index', expected: 200 },
  
  // Nginx proxy tests
  { url: `${NGINX_URL}/`, name: 'Nginx Root', expected: 200 },
  { url: `${NGINX_URL}/health`, name: 'Nginx Health', expected: 200 },
];

const OTHER_SERVICES = [
  { url: 'http://localhost:3003', name: 'Grafana Dashboard', expected: 200 },
  { url: 'http://localhost:9090', name: 'Prometheus Metrics', expected: 200 },
  { url: 'http://localhost:6333', name: 'Qdrant Vector DB', expected: 200 },
];

async function testURL(page, testCase) {
  const startTime = Date.now();
  
  try {
    let response;
    
    if (testCase.method === 'POST') {
      response = await page.request.post(testCase.url, {
        data: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
          params: {}
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } else {
      // Use different wait condition for Prometheus
      const waitCondition = testCase.url.includes('9090') ? 'domcontentloaded' : 'networkidle';
      response = await page.goto(testCase.url, { 
        waitUntil: waitCondition,
        timeout: 15000 
      });
    }
    
    const duration = Date.now() - startTime;
    const status = response.status();
    
    const result = {
      name: testCase.name,
      url: testCase.url,
      status,
      expected: testCase.expected,
      duration: `${duration}ms`,
      success: status === testCase.expected,
      error: null
    };
    
    if (status !== testCase.expected) {
      result.error = `Expected ${testCase.expected}, got ${status}`;
    }
    
    return result;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      name: testCase.name,
      url: testCase.url,
      status: 'ERROR',
      expected: testCase.expected,
      duration: `${duration}ms`,
      success: false,
      error: error.message
    };
  }
}

async function testPageContent(page, url, name) {
  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // Check for basic HTML structure
    const title = await page.title();
    const hasNav = await page.locator('nav.sidebar').count() > 0;
    const hasContent = await page.locator('.content, main, body').count() > 0;
    
    // Check for CSS loading
    const stylesheets = await page.locator('link[rel="stylesheet"]').count();
    
    // Check for JavaScript loading
    const scripts = await page.locator('script[src]').count();
    
    return {
      name,
      url,
      title,
      hasNav,
      hasContent,
      stylesheets,
      scripts,
      success: hasContent && title.length > 0
    };
    
  } catch (error) {
    return {
      name,
      url,
      error: error.message,
      success: false
    };
  }
}

async function runTests() {
  console.log('🚀 Starting Comprehensive URL Testing...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  const results = [];
  const contentResults = [];
  
  console.log('📋 Testing Main Application URLs...\n');
  
  // Test main application URLs
  for (const testCase of URLS_TO_TEST) {
    console.log(`Testing: ${testCase.name}`);
    const result = await testURL(page, testCase);
    results.push(result);
    
    if (result.success) {
      console.log(`  ✅ ${result.status} - ${result.duration}`);
    } else {
      console.log(`  ❌ ${result.status} - ${result.error}`);
    }
  }
  
  console.log('\n📋 Testing Other Services...\n');
  
  // Test other services
  for (const service of OTHER_SERVICES) {
    console.log(`Testing: ${service.name}`);
    const result = await testURL(page, service);
    results.push(result);
    
    if (result.success) {
      console.log(`  ✅ ${result.status} - ${result.duration}`);
    } else {
      console.log(`  ❌ ${result.status} - ${result.error}`);
    }
  }
  
  console.log('\n📋 Testing Page Content...\n');
  
  // Test page content for main guide pages
  const guidePages = URLS_TO_TEST.filter(t => t.url.includes('comprehensive-guide') && t.url.endsWith('.html'));
  
  for (const testCase of guidePages) {
    console.log(`Testing content: ${testCase.name}`);
    const result = await testPageContent(page, testCase.url, testCase.name);
    contentResults.push(result);
    
    if (result.success) {
      console.log(`  ✅ Title: "${result.title}", Nav: ${result.hasNav}, Content: ${result.hasContent}, CSS: ${result.stylesheets}, JS: ${result.scripts}`);
    } else {
      console.log(`  ❌ Error: ${result.error}`);
    }
  }
  
  // Summary
  console.log('\n📊 TEST SUMMARY\n');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const total = results.length;
  
  console.log(`Total Tests: ${total}`);
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((successful / total) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.filter(r => !r.success).forEach(result => {
      console.log(`  - ${result.name}: ${result.error}`);
    });
  }
  
  const contentSuccessful = contentResults.filter(r => r.success).length;
  const contentFailed = contentResults.filter(r => !r.success).length;
  
  console.log(`\nContent Tests: ${contentSuccessful}/${contentSuccessful + contentFailed} passed`);
  
  if (contentFailed > 0) {
    console.log('\n❌ CONTENT ISSUES:');
    contentResults.filter(r => !r.success).forEach(result => {
      console.log(`  - ${result.name}: ${result.error}`);
    });
  }
  
  await browser.close();
  
  console.log('\n🎉 Testing Complete!');
  
  return {
    results,
    contentResults,
    summary: {
      total,
      successful,
      failed,
      successRate: (successful / total) * 100
    }
  };
}

// Run the tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };
