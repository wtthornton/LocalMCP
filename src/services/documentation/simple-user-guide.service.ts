/**
 * Simple User Guide Service
 * 
 * Phase 6: Simplified user guide generation without complex dependencies
 * 
 * Benefits for vibe coders:
 * - Always up-to-date documentation
 * - Simple, reliable generation
 * - No complex dependencies
 * - Easy to maintain and extend
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface SimpleUserGuideConfig {
  outputDir: string;
  autoUpdate: boolean;
  includeScreenshots: boolean;
  theme: 'modern-dark' | 'light' | 'auto';
}

export interface SimpleGuidePage {
  id: string;
  title: string;
  content: string;
  lastUpdated: Date;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedReadTime: number;
}

export class SimpleUserGuideService extends EventEmitter {
  private config: SimpleUserGuideConfig;
  private isGenerating: boolean = false;

  constructor() {
    super();
    
    this.config = {
      outputDir: 'docs/comprehensive-guide',
      autoUpdate: true,
      includeScreenshots: false,
      theme: 'modern-dark'
    };
  }

  async start(): Promise<void> {
    console.log('🚀 Starting Simple User Guide Service...');
    
    try {
      // Ensure output directory exists
      await fs.mkdir(this.config.outputDir, { recursive: true });
      await fs.mkdir(path.join(this.config.outputDir, 'styles'), { recursive: true });
      await fs.mkdir(path.join(this.config.outputDir, 'scripts'), { recursive: true });
      await fs.mkdir(path.join(this.config.outputDir, 'assets'), { recursive: true });

      // Copy CSS files
      await this.copyCSSFiles();
      
      // Generate initial guide
      await this.generateGuide();
      
      console.log('✅ Simple User Guide Service started');
      this.emit('started');
    } catch (error) {
      console.error('❌ Failed to start Simple User Guide Service:', error);
      this.emit('error', error);
      throw error;
    }
  }

  async generateGuide(): Promise<void> {
    if (this.isGenerating) {
      console.log('⏳ Guide generation already in progress...');
      return;
    }

    this.isGenerating = true;
    console.log('📚 Generating comprehensive user guide...');

    try {
      // Generate all guide pages
      const pages = await this.generateAllPages();
      
      // Generate main index
      await this.generateMainIndex(pages);
      
      // Generate PWA manifest
      await this.generatePWAManifest();
      
      // Generate service worker
      await this.generateServiceWorker();
      
      // Generate search index
      await this.generateSearchIndex(pages);

      console.log('✅ Comprehensive user guide generated successfully');
      this.emit('guideGenerated', { pageCount: pages.length });
    } catch (error) {
      console.error('❌ Failed to generate comprehensive user guide:', error);
      this.emit('error', error);
      throw error;
    } finally {
      this.isGenerating = false;
    }
  }

  private async generateAllPages(): Promise<SimpleGuidePage[]> {
    const pages: SimpleGuidePage[] = [];

    // Core pages
    pages.push(await this.generatePage('getting-started', 'Getting Started', 'beginner'));
    pages.push(await this.generatePage('quick-start', 'Quick Start Guide', 'beginner'));
    pages.push(await this.generatePage('tool-reference', 'Tool Reference', 'intermediate'));
    pages.push(await this.generatePage('pipeline-guide', 'Pipeline Guide', 'intermediate'));
    pages.push(await this.generatePage('admin-console', 'Admin Console', 'intermediate'));
    pages.push(await this.generatePage('troubleshooting', 'Troubleshooting', 'advanced'));
    
    // Advanced pages
    pages.push(await this.generatePage('advanced-features', 'Advanced Features', 'advanced'));
    pages.push(await this.generatePage('api-reference', 'API Reference', 'advanced'));
    pages.push(await this.generatePage('deployment', 'Deployment Guide', 'intermediate'));
    pages.push(await this.generatePage('customization', 'Customization', 'advanced'));

    return pages;
  }

  private async generatePage(id: string, title: string, difficulty: 'beginner' | 'intermediate' | 'advanced'): Promise<SimpleGuidePage> {
    console.log(`📄 Generating page: ${title}`);

    // Generate page content
    const content = await this.generatePageContent(title, difficulty);
    
    // Save page
    const page: SimpleGuidePage = {
      id,
      title,
      content,
      lastUpdated: new Date(),
      difficulty,
      estimatedReadTime: this.calculateReadTime(content)
    };

    await this.savePage(page);
    return page;
  }

  private async generatePageContent(title: string, difficulty: string): Promise<string> {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - LocalMCP User Guide</title>
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
            <h1>${title}</h1>
            <div class="page-meta">
                <span class="difficulty difficulty-${difficulty}">${difficulty}</span>
                <span class="read-time">${this.calculateReadTime('')} min read</span>
            </div>
        </div>
        
        <div class="page-content">
            ${this.generateContentForTitle(title, difficulty)}
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
  }

  private generateContentForTitle(title: string, difficulty: string): string {
    const contentTemplates = {
      'Getting Started': `
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
      `,
      'Quick Start Guide': `
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
      `,
      'Tool Reference': `
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
      `,
      'Pipeline Guide': `
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
      `,
      'Admin Console': `
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
      `,
      'Troubleshooting': `
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
    };

    return contentTemplates[title] || `
      <h2>${title}</h2>
      <p>This page provides information about ${title.toLowerCase()}.</p>
      <p>Content will be expanded based on your specific needs and usage patterns.</p>
    `;
  }

  private async savePage(page: SimpleGuidePage): Promise<void> {
    const filePath = path.join(this.config.outputDir, `${page.id}.html`);
    await fs.writeFile(filePath, page.content, 'utf8');
  }

  private async generateMainIndex(pages: SimpleGuidePage[]): Promise<void> {
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
            ${pages.map(page => `<li><a href="${page.id}.html">${page.title}</a></li>`).join('')}
        </ul>
    </nav>
    <main class="content">
        <div class="hero-section">
            <h1>LocalMCP Comprehensive User Guide</h1>
            <p>Your complete guide to using LocalMCP for AI-powered development</p>
            <div class="hero-stats">
                <div class="stat">
                    <span class="stat-number">${pages.length}</span>
                    <span class="stat-label">Pages</span>
                </div>
                <div class="stat">
                    <span class="stat-number">10+</span>
                    <span class="stat-label">Examples</span>
                </div>
                <div class="stat">
                    <span class="stat-number">4</span>
                    <span class="stat-label">Tools</span>
                </div>
            </div>
        </div>
        
        <div class="guide-grid">
            ${pages.map(page => `
            <div class="guide-card" data-difficulty="${page.difficulty}">
                <h3>${page.title}</h3>
                <p class="page-description">${this.generatePageDescription(page.id)}</p>
                <div class="page-meta">
                    <span class="difficulty difficulty-${page.difficulty}">${page.difficulty}</span>
                    <span class="read-time">${page.estimatedReadTime} min</span>
                </div>
                <a href="${page.id}.html" class="read-more-btn">Read More</a>
            </div>
            `).join('')}
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

    await fs.writeFile(path.join(this.config.outputDir, 'index.html'), indexContent, 'utf8');
  }

  private async generatePWAManifest(): Promise<void> {
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

    await fs.writeFile(
      path.join(this.config.outputDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2),
      'utf8'
    );
  }

  private async generateServiceWorker(): Promise<void> {
    const serviceWorker = `
const CACHE_NAME = 'localmcp-guide-v1';
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
});
`;

    await fs.writeFile(path.join(this.config.outputDir, 'sw.js'), serviceWorker, 'utf8');
  }

  private async generateSearchIndex(pages: SimpleGuidePage[]): Promise<void> {
    const searchIndex = {
      pages: pages.map(page => ({
        id: page.id,
        title: page.title,
        content: this.extractSearchableContent(page.content),
        difficulty: page.difficulty
      }))
    };

    await fs.writeFile(
      path.join(this.config.outputDir, 'search-index.json'),
      JSON.stringify(searchIndex, null, 2),
      'utf8'
    );
  }

  private generatePageDescription(pageId: string): string {
    const descriptions: Record<string, string> = {
      'getting-started': 'Learn how to set up and configure LocalMCP for your project',
      'quick-start': 'Get up and running with LocalMCP in minutes',
      'tool-reference': 'Complete reference for all LocalMCP tools and APIs',
      'pipeline-guide': 'Understand how the dynamic pipeline works',
      'admin-console': 'Manage and monitor your LocalMCP instance',
      'troubleshooting': 'Solve common issues and problems',
      'advanced-features': 'Explore advanced LocalMCP capabilities',
      'api-reference': 'Detailed API documentation and examples',
      'deployment': 'Deploy LocalMCP to production environments',
      'customization': 'Customize LocalMCP for your specific needs'
    };
    return descriptions[pageId] || 'Learn more about LocalMCP';
  }

  private calculateReadTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  private extractSearchableContent(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  // Public API methods
  async getPage(pageId: string): Promise<SimpleGuidePage | null> {
    try {
      const filePath = path.join(this.config.outputDir, `${pageId}.html`);
      const content = await fs.readFile(filePath, 'utf8');
      
      return {
        id: pageId,
        title: this.extractTitle(content),
        content,
        lastUpdated: new Date(),
        difficulty: 'beginner',
        estimatedReadTime: this.calculateReadTime(content)
      };
    } catch (error) {
      return null;
    }
  }

  private extractTitle(html: string): string {
    const match = html.match(/<title>(.*?)<\/title>/);
    return match ? match[1] : 'Untitled';
  }

  private async copyCSSFiles(): Promise<void> {
    try {
      const cssFiles = ['main.css', 'interactive.css'];
      
      for (const cssFile of cssFiles) {
        const sourcePath = path.join(process.cwd(), 'docs/user-guide/styles', cssFile);
        const destPath = path.join(this.config.outputDir, 'styles', cssFile);
        
        if (await this.fileExists(sourcePath)) {
          await fs.copyFile(sourcePath, destPath);
          console.log(`✅ Copied CSS: ${cssFile}`);
        } else {
          console.log(`⚠️ CSS file not found: ${sourcePath}`);
        }
      }
    } catch (error) {
      console.error('❌ Failed to copy CSS files:', error);
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

export default SimpleUserGuideService;
