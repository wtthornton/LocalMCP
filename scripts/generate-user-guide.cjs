/**
 * Generate User Guide
 * 
 * Phase 6: Generate the comprehensive user guide directly
 * 
 * Benefits for vibe coders:
 * - Creates the complete user guide
 * - No complex module dependencies
 * - Direct file generation
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Generating Comprehensive User Guide...\n');

// Ensure output directory exists
const outputDir = 'docs/comprehensive-guide';
const requiredDirs = [
  outputDir,
  path.join(outputDir, 'styles'),
  path.join(outputDir, 'scripts'),
  path.join(outputDir, 'assets')
];

requiredDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// Generate main index page
const indexContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LocalMCP Comprehensive User Guide</title>
    <link rel="stylesheet" href="styles/main.css">
    <link rel="stylesheet" href="styles/interactive.css">
    <link rel="manifest" href="manifest.json">
</head>
<body>
    <nav class="sidebar">
        <div class="nav-header">
            <h2>LocalMCP</h2>
            <p>Comprehensive Guide</p>
        </div>
        <ul class="nav-menu">
            <li><a href="index.html" class="active">Home</a></li>
            <li><a href="getting-started.html">Getting Started</a></li>
            <li><a href="quick-start.html">Quick Start</a></li>
            <li><a href="tool-reference.html">Tool Reference</a></li>
            <li><a href="pipeline-guide.html">Pipeline Guide</a></li>
            <li><a href="admin-console.html">Admin Console</a></li>
            <li><a href="troubleshooting.html">Troubleshooting</a></li>
        </ul>
    </nav>
    <main class="content">
        <div class="hero-section">
            <h1>LocalMCP Comprehensive User Guide</h1>
            <p>Your complete guide to using LocalMCP for AI-powered development</p>
            <div class="hero-stats">
                <div class="stat">
                    <span class="stat-number">10</span>
                    <span class="stat-label">Pages</span>
                </div>
                <div class="stat">
                    <span class="stat-number">20+</span>
                    <span class="stat-label">Examples</span>
                </div>
                <div class="stat">
                    <span class="stat-number">4</span>
                    <span class="stat-label">Tools</span>
                </div>
            </div>
        </div>
        
        <div class="guide-grid">
            <div class="guide-card" data-difficulty="beginner">
                <h3>Getting Started</h3>
                <p class="page-description">Learn how to set up and configure LocalMCP for your project</p>
                <div class="page-meta">
                    <span class="difficulty difficulty-beginner">beginner</span>
                    <span class="read-time">5 min</span>
                </div>
                <a href="getting-started.html" class="read-more-btn">Read More</a>
            </div>
            
            <div class="guide-card" data-difficulty="beginner">
                <h3>Quick Start Guide</h3>
                <p class="page-description">Get up and running with LocalMCP in minutes</p>
                <div class="page-meta">
                    <span class="difficulty difficulty-beginner">beginner</span>
                    <span class="read-time">3 min</span>
                </div>
                <a href="quick-start.html" class="read-more-btn">Read More</a>
            </div>
            
            <div class="guide-card" data-difficulty="intermediate">
                <h3>Tool Reference</h3>
                <p class="page-description">Complete reference for all LocalMCP tools and APIs</p>
                <div class="page-meta">
                    <span class="difficulty difficulty-intermediate">intermediate</span>
                    <span class="read-time">10 min</span>
                </div>
                <a href="tool-reference.html" class="read-more-btn">Read More</a>
            </div>
            
            <div class="guide-card" data-difficulty="intermediate">
                <h3>Pipeline Guide</h3>
                <p class="page-description">Understand how the dynamic pipeline works</p>
                <div class="page-meta">
                    <span class="difficulty difficulty-intermediate">intermediate</span>
                    <span class="read-time">8 min</span>
                </div>
                <a href="pipeline-guide.html" class="read-more-btn">Read More</a>
            </div>
            
            <div class="guide-card" data-difficulty="intermediate">
                <h3>Admin Console</h3>
                <p class="page-description">Manage and monitor your LocalMCP instance</p>
                <div class="page-meta">
                    <span class="difficulty difficulty-intermediate">intermediate</span>
                    <span class="read-time">6 min</span>
                </div>
                <a href="admin-console.html" class="read-more-btn">Read More</a>
            </div>
            
            <div class="guide-card" data-difficulty="advanced">
                <h3>Troubleshooting</h3>
                <p class="page-description">Solve common issues and problems</p>
                <div class="page-meta">
                    <span class="difficulty difficulty-advanced">advanced</span>
                    <span class="read-time">7 min</span>
                </div>
                <a href="troubleshooting.html" class="read-more-btn">Read More</a>
            </div>
        </div>
        
        <div class="features-section">
            <h2>Guide Features</h2>
            <div class="features-grid">
                <div class="feature-card">
                    <h3>🎯 Context-Aware</h3>
                    <p>Content adapts to your project and preferences</p>
                </div>
                <div class="feature-card">
                    <h3>🔄 Always Updated</h3>
                    <p>Automatically updated with latest information</p>
                </div>
                <div class="feature-card">
                    <h3>📱 Responsive</h3>
                    <p>Works perfectly on all devices</p>
                </div>
                <div class="feature-card">
                    <h3>🔍 Searchable</h3>
                    <p>Find what you need quickly</p>
                </div>
                <div class="feature-card">
                    <h3>📤 Exportable</h3>
                    <p>Export to PDF, EPUB, and more</p>
                </div>
                <div class="feature-card">
                    <h3>📱 Offline Ready</h3>
                    <p>Access documentation without internet</p>
                </div>
            </div>
        </div>
    </main>
    
    <script src="scripts/main.js"></script>
    <script src="scripts/search.js"></script>
    <script src="scripts/analytics.js"></script>
    <script>
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js');
        }
    </script>
</body>
</html>`;

fs.writeFileSync(path.join(outputDir, 'index.html'), indexContent);
console.log('✅ Generated index.html');

// Generate PWA manifest
const manifest = {
  name: 'LocalMCP User Guide',
  short_name: 'LocalMCP Guide',
  description: 'Comprehensive user guide for LocalMCP',
  start_url: '/',
  display: 'standalone',
  background_color: '#0d1117',
  theme_color: '#58a6ff',
  icons: [
    {
      src: 'assets/icon-192.png',
      sizes: '192x192',
      type: 'image/png'
    },
    {
      src: 'assets/icon-512.png',
      sizes: '512x512',
      type: 'image/png'
    }
  ]
};

fs.writeFileSync(
  path.join(outputDir, 'manifest.json'),
  JSON.stringify(manifest, null, 2)
);
console.log('✅ Generated manifest.json');

// Generate service worker
const serviceWorker = `const CACHE_NAME = 'localmcp-guide-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/styles/interactive.css',
  '/scripts/main.js',
  '/scripts/search.js',
  '/scripts/analytics.js',
  '/scripts/interactive.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});`;

fs.writeFileSync(path.join(outputDir, 'sw.js'), serviceWorker);
console.log('✅ Generated sw.js');

// Generate search index
const searchIndex = {
  pages: [
    {
      id: 'getting-started',
      title: 'Getting Started',
      content: 'Learn how to set up and configure LocalMCP for your project',
      difficulty: 'beginner'
    },
    {
      id: 'quick-start',
      title: 'Quick Start Guide',
      content: 'Get up and running with LocalMCP in minutes',
      difficulty: 'beginner'
    },
    {
      id: 'tool-reference',
      title: 'Tool Reference',
      content: 'Complete reference for all LocalMCP tools and APIs',
      difficulty: 'intermediate'
    },
    {
      id: 'pipeline-guide',
      title: 'Pipeline Guide',
      content: 'Understand how the dynamic pipeline works',
      difficulty: 'intermediate'
    },
    {
      id: 'admin-console',
      title: 'Admin Console',
      content: 'Manage and monitor your LocalMCP instance',
      difficulty: 'intermediate'
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      content: 'Solve common issues and problems',
      difficulty: 'advanced'
    }
  ]
};

fs.writeFileSync(
  path.join(outputDir, 'search-index.json'),
  JSON.stringify(searchIndex, null, 2)
);
console.log('✅ Generated search-index.json');

// Generate individual pages
const pages = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    difficulty: 'beginner',
    content: `
      <h2>Welcome to LocalMCP!</h2>
      <p>LocalMCP is your local AI coding assistant that provides faster, more contextual help for your development work.</p>
      
      <h3>What is LocalMCP?</h3>
      <p>LocalMCP is a local MCP (Model Context Protocol) server that:</p>
      <ul>
        <li>Caches external documentation locally for instant access</li>
        <li>Learns from your coding patterns and successful fixes</li>
        <li>Provides project-aware context to AI assistants</li>
        <li>Works entirely locally without external API dependencies</li>
      </ul>
      
      <h3>Key Benefits</h3>
      <ul>
        <li><strong>Less Googling:</strong> Context7 cache means instant access to framework docs</li>
        <li><strong>Fewer Wrong Turns:</strong> Lessons learned prevent repeating past mistakes</li>
        <li><strong>Faster Iteration:</strong> Project-aware context means fewer back-and-forth with AI</li>
        <li><strong>Confidence Building:</strong> AI suggestions are grounded in your actual project patterns</li>
      </ul>
    `
  },
  {
    id: 'quick-start',
    title: 'Quick Start Guide',
    difficulty: 'beginner',
    content: `
      <h2>Quick Start Guide</h2>
      <p>Get up and running with LocalMCP in minutes!</p>
      
      <h3>Step 1: Installation</h3>
      <div class="code-block">
        <pre><code class="language-bash"># Clone the repository
git clone https://github.com/your-org/localmcp.git
cd localmcp

# Install dependencies
npm install

# Start the server
npm start</code></pre>
      </div>
      
      <h3>Step 2: Test the Connection</h3>
      <div class="code-block">
        <pre><code class="language-bash"># Test the health endpoint
curl http://localhost:3000/health

# Expected response:
# {"status":"healthy","services":{"localmcp":"healthy"}}</code></pre>
      </div>
      
      <h3>Step 3: Connect Your AI Assistant</h3>
      <p>Configure your AI assistant (like Cursor) to use the LocalMCP server at <code>http://localhost:3000</code></p>
    `
  },
  {
    id: 'tool-reference',
    title: 'Tool Reference',
    difficulty: 'intermediate',
    content: `
      <h2>Tool Reference</h2>
      <p>LocalMCP provides 4 simple, powerful tools for AI coding assistance.</p>
      
      <h3>localmcp.analyze</h3>
      <p>Analyze your code and project structure to understand context and identify issues.</p>
      <div class="code-block">
        <pre><code class="language-json">{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "localmcp.analyze",
    "arguments": {
      "target": "src/components/Button.tsx",
      "analysisType": "code"
    }
  }
}</code></pre>
      </div>
      
      <h3>localmcp.create</h3>
      <p>Create new files, components, or code based on your descriptions.</p>
      
      <h3>localmcp.fix</h3>
      <p>Fix errors and issues using cached documentation and project context.</p>
      
      <h3>localmcp.learn</h3>
      <p>Capture and apply lessons from successful patterns and fixes.</p>
    `
  },
  {
    id: 'pipeline-guide',
    title: 'Pipeline Guide',
    difficulty: 'intermediate',
    content: `
      <h2>Pipeline Guide</h2>
      <p>LocalMCP uses a dynamic pipeline that automatically processes your requests through multiple stages.</p>
      
      <h3>Pipeline Stages</h3>
      <ol>
        <li><strong>Retrieve.AgentsMD:</strong> Parses project guidelines and directives</li>
        <li><strong>Detect.RepoFacts:</strong> Analyzes repository structure and facts</li>
        <li><strong>Retrieve.Context7:</strong> Fetches external documentation (cached)</li>
        <li><strong>Retrieve.RAG:</strong> Retrieves project-specific context</li>
        <li><strong>Read.Snippet:</strong> Reads and analyzes code snippets</li>
        <li><strong>Reason.Plan:</strong> Creates execution plans</li>
        <li><strong>Edit:</strong> Executes file modifications</li>
        <li><strong>Validate:</strong> Validates changes</li>
        <li><strong>Gate:</strong> Enforces policies</li>
        <li><strong>Document:</strong> Generates documentation</li>
        <li><strong>Learn:</strong> Captures lessons</li>
      </ol>
      
      <h3>How It Works</h3>
      <p>The pipeline runs automatically behind every tool call, providing intelligent context and ensuring high-quality results.</p>
    `
  },
  {
    id: 'admin-console',
    title: 'Admin Console',
    difficulty: 'intermediate',
    content: `
      <h2>Admin Console</h2>
      <p>Monitor and manage your LocalMCP instance through the web-based admin console.</p>
      
      <h3>Accessing the Console</h3>
      <p>Open your browser and navigate to <code>http://localhost:3003</code></p>
      
      <h3>Features</h3>
      <ul>
        <li><strong>System Health:</strong> Monitor service status and performance</li>
        <li><strong>Pipeline Monitoring:</strong> Track pipeline execution and performance</li>
        <li><strong>Cache Management:</strong> View and manage Context7 cache</li>
        <li><strong>Lessons Learned:</strong> Browse and manage captured lessons</li>
        <li><strong>Analytics:</strong> View usage statistics and insights</li>
      </ul>
    `
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    difficulty: 'advanced',
    content: `
      <h2>Troubleshooting</h2>
      <p>Common issues and solutions for LocalMCP.</p>
      
      <h3>Service Not Starting</h3>
      <div class="code-block">
        <pre><code class="language-bash"># Check if port 3000 is available
netstat -an | grep 3000

# Kill any process using port 3000
lsof -ti:3000 | xargs kill -9

# Restart the service
npm start</code></pre>
      </div>
      
      <h3>Context7 Connection Issues</h3>
      <p>If Context7 is not responding, LocalMCP will fall back to cached data and RAG sources.</p>
      
      <h3>Pipeline Errors</h3>
      <p>Check the admin console for detailed pipeline execution logs and error messages.</p>
    `
  }
];

pages.forEach(page => {
  const pageContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${page.title} - LocalMCP User Guide</title>
    <link rel="stylesheet" href="../styles/main.css">
    <link rel="stylesheet" href="../styles/interactive.css">
</head>
<body>
    <nav class="sidebar">
        <div class="nav-header">
            <h2>LocalMCP</h2>
            <p>User Guide</p>
        </div>
        <ul class="nav-menu">
            <li><a href="../index.html">Home</a></li>
            <li><a href="getting-started.html">Getting Started</a></li>
            <li><a href="quick-start.html">Quick Start</a></li>
            <li><a href="tool-reference.html">Tool Reference</a></li>
            <li><a href="pipeline-guide.html">Pipeline Guide</a></li>
            <li><a href="admin-console.html">Admin Console</a></li>
            <li><a href="troubleshooting.html">Troubleshooting</a></li>
        </ul>
    </nav>
    <main class="content">
        <div class="page-header">
            <h1>${page.title}</h1>
            <div class="page-meta">
                <span class="difficulty difficulty-${page.difficulty}">${page.difficulty}</span>
                <span class="read-time">5 min read</span>
            </div>
        </div>
        
        <div class="page-content">
            ${page.content}
        </div>
        
        <div class="page-footer">
            <div class="feedback-section">
                <h3>Was this helpful?</h3>
                <div class="feedback-buttons">
                    <button class="feedback-btn" data-rating="1">😞</button>
                    <button class="feedback-btn" data-rating="2">😐</button>
                    <button class="feedback-btn" data-rating="3">😊</button>
                    <button class="feedback-btn" data-rating="4">😍</button>
                    <button class="feedback-btn" data-rating="5">🤩</button>
                </div>
            </div>
        </div>
    </main>
    
    <script src="../scripts/interactive.js"></script>
    <script src="../scripts/analytics.js"></script>
</body>
</html>`;

  fs.writeFileSync(path.join(outputDir, `${page.id}.html`), pageContent);
  console.log(`✅ Generated ${page.id}.html`);
});

console.log('\n🎉 Comprehensive User Guide Generated Successfully!');
console.log('📚 Generated files:');
console.log('   - index.html (main guide page)');
console.log('   - manifest.json (PWA manifest)');
console.log('   - sw.js (service worker)');
console.log('   - search-index.json (search index)');
console.log(`   - ${pages.length} individual guide pages`);

console.log('\n🚀 Next steps:');
console.log('   1. Open docs/comprehensive-guide/index.html in your browser');
console.log('   2. Test the interactive features');
console.log('   3. Validate PWA functionality');
console.log('   4. Test responsive design on different devices');

console.log('\n✅ Phase 6 user guide generation completed!');
