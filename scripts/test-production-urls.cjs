/**
 * Production URL Testing with Playwright
 * 
 * Tests all LocalMCP production URLs to ensure they're working correctly
 * 
 * Benefits for vibe coders:
 * - Validates all services are accessible
 * - Tests functionality and responses
 * - Provides visual confirmation of working services
 * - Screenshots for documentation
 */

const { chromium } = require('playwright');

const urls = [
  {
    name: 'Main Application',
    url: 'http://localhost:3000/health',
    healthUrl: 'http://localhost:3000/health',
    expectedContent: ['healthy', 'services', 'localmcp'],
    description: 'Core LocalMCP application with MCP server'
  },
  {
    name: 'Nginx Proxy',
    url: 'http://localhost:80',
    healthUrl: 'http://localhost:80/health',
    expectedContent: ['healthy'],
    description: 'Load balancer and reverse proxy'
  },
  {
    name: 'Prometheus Metrics',
    url: 'http://localhost:9090',
    targetsUrl: 'http://localhost:9090/api/v1/targets',
    expectedContent: ['targets', 'localmcp'],
    description: 'Metrics collection and monitoring'
  },
  {
    name: 'Grafana Dashboards',
    url: 'http://localhost:3003',
    healthUrl: 'http://localhost:3003/api/health',
    expectedContent: ['database', 'ok'],
    description: 'Dashboards and visualization'
  },
  {
    name: 'Qdrant Vector DB',
    url: 'http://localhost:6333',
    collectionsUrl: 'http://localhost:6333/collections',
    expectedContent: ['collections', 'result'],
    description: 'Vector database for RAG and lessons learned'
  }
];

async function testUrl(browser, urlConfig) {
  console.log(`\n🔍 Testing ${urlConfig.name}...`);
  console.log(`   URL: ${urlConfig.url}`);
  console.log(`   Description: ${urlConfig.description}`);
  
  const page = await browser.newPage();
  const results = {
    name: urlConfig.name,
    url: urlConfig.url,
    status: 'unknown',
    responseTime: 0,
    content: '',
    errors: []
  };
  
  try {
    const startTime = Date.now();
    
    // Test main URL
    console.log(`   📡 Loading main page...`);
    const response = await page.goto(urlConfig.url, { 
      waitUntil: 'networkidle',
      timeout: 10000 
    });
    
    results.responseTime = Date.now() - startTime;
    results.status = response.status();
    
    if (response.status() === 200) {
      console.log(`   ✅ Status: ${response.status()} (${results.responseTime}ms)`);
      
      // Get page content
      results.content = await page.content();
      
      // Check for expected content
      const hasExpectedContent = urlConfig.expectedContent.every(expected => 
        results.content.toLowerCase().includes(expected.toLowerCase())
      );
      
      if (hasExpectedContent) {
        console.log(`   ✅ Content: Contains expected elements`);
      } else {
        console.log(`   ⚠️  Content: Missing some expected elements`);
        results.errors.push('Missing expected content');
      }
      
      // Test health/API endpoints if available
      if (urlConfig.healthUrl) {
        console.log(`   🏥 Testing health endpoint...`);
        try {
          const healthResponse = await page.goto(urlConfig.healthUrl, { 
            waitUntil: 'networkidle',
            timeout: 5000 
          });
          if (healthResponse.status() === 200) {
            console.log(`   ✅ Health endpoint: Working`);
          } else {
            console.log(`   ⚠️  Health endpoint: Status ${healthResponse.status()}`);
            results.errors.push(`Health endpoint returned ${healthResponse.status()}`);
          }
        } catch (error) {
          console.log(`   ❌ Health endpoint: ${error.message}`);
          results.errors.push(`Health endpoint error: ${error.message}`);
        }
      }
      
      if (urlConfig.targetsUrl) {
        console.log(`   🎯 Testing targets endpoint...`);
        try {
          const targetsResponse = await page.goto(urlConfig.targetsUrl, { 
            waitUntil: 'networkidle',
            timeout: 5000 
          });
          if (targetsResponse.status() === 200) {
            console.log(`   ✅ Targets endpoint: Working`);
          } else {
            console.log(`   ⚠️  Targets endpoint: Status ${targetsResponse.status()}`);
            results.errors.push(`Targets endpoint returned ${targetsResponse.status()}`);
          }
        } catch (error) {
          console.log(`   ❌ Targets endpoint: ${error.message}`);
          results.errors.push(`Targets endpoint error: ${error.message}`);
        }
      }
      
      if (urlConfig.collectionsUrl) {
        console.log(`   📚 Testing collections endpoint...`);
        try {
          const collectionsResponse = await page.goto(urlConfig.collectionsUrl, { 
            waitUntil: 'networkidle',
            timeout: 5000 
          });
          if (collectionsResponse.status() === 200) {
            console.log(`   ✅ Collections endpoint: Working`);
          } else {
            console.log(`   ⚠️  Collections endpoint: Status ${collectionsResponse.status()}`);
            results.errors.push(`Collections endpoint returned ${collectionsResponse.status()}`);
          }
        } catch (error) {
          console.log(`   ❌ Collections endpoint: ${error.message}`);
          results.errors.push(`Collections endpoint error: ${error.message}`);
        }
      }
      
      // Take screenshot
      console.log(`   📸 Taking screenshot...`);
      await page.screenshot({ 
        path: `screenshots/${urlConfig.name.toLowerCase().replace(/\s+/g, '-')}.png`,
        fullPage: true 
      });
      console.log(`   ✅ Screenshot saved`);
      
    } else {
      console.log(`   ❌ Status: ${response.status()}`);
      results.errors.push(`HTTP ${response.status()}`);
    }
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    results.errors.push(error.message);
    results.status = 'error';
  } finally {
    await page.close();
  }
  
  return results;
}


async function runProductionTests() {
  console.log('🚀 Starting LocalMCP Production URL Testing...\n');
  console.log('=' .repeat(60));
  
  // Create screenshots directory
  const fs = require('fs');
  if (!fs.existsSync('screenshots')) {
    fs.mkdirSync('screenshots');
  }
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const results = [];
  
  try {
    // Test all URLs
    for (const urlConfig of urls) {
      const result = await testUrl(browser, urlConfig);
      results.push(result);
    }
    
    
  } finally {
    await browser.close();
  }
  
  // Generate summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 PRODUCTION TESTING SUMMARY\n');
  
  const successful = results.filter(r => r.status === 200 || r.status === 'success').length;
  const total = results.length;
  
  console.log(`🎯 Overall Status: ${successful}/${total} services working\n`);
  
  results.forEach(result => {
    const status = result.status === 200 || result.status === 'success' ? '✅' : '❌';
    const responseTime = result.responseTime ? ` (${result.responseTime}ms)` : '';
    console.log(`${status} ${result.name}: ${result.status}${responseTime}`);
    
    if (result.errors && result.errors.length > 0) {
      result.errors.forEach(error => {
        console.log(`   ⚠️  ${error}`);
      });
    }
  });
  
  console.log('\n📸 Screenshots saved to: ./screenshots/');
  console.log('\n🎉 Production testing complete!');
  
  if (successful === total) {
    console.log('\n🎯 ALL SERVICES OPERATIONAL! LocalMCP is ready for production use.');
  } else {
    console.log('\n⚠️  Some services need attention. Check the errors above.');
  }
  
  console.log('\n' + '=' .repeat(60));
}

// Run the tests
runProductionTests().catch(console.error);
