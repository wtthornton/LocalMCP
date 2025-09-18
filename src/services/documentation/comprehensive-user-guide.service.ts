/**
 * Comprehensive User Guide Service
 * 
 * Phase 6: Advanced documentation system with Context7 integration
 * 
 * Benefits for vibe coders:
 * - Always up-to-date documentation
 * - Context-aware content generation
 * - Interactive examples and tutorials
 * - Multi-format export capabilities
 * - Offline access and PWA features
 */

import { Context7MCPClientService } from '../context7/context7-mcp-client.service';
import { PlaywrightService } from '../playwright/playwright.service';
import { VectorDatabaseService } from '../vector-database/vector-database.service';
import { ConfigService } from '../config/config.service';
import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface UserGuideConfig {
  outputDir: string;
  templateDir: string;
  autoUpdate: boolean;
  includeScreenshots: boolean;
  theme: 'modern-dark' | 'light' | 'auto';
  languages: string[];
  exportFormats: ('html' | 'pdf' | 'epub' | 'zip')[];
  pwaEnabled: boolean;
  offlineMode: boolean;
  searchEnabled: boolean;
  analyticsEnabled: boolean;
}

export interface GuidePage {
  id: string;
  title: string;
  content: string;
  lastUpdated: Date;
  screenshots: string[];
  interactiveExamples: InteractiveExample[];
  relatedPages: string[];
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedReadTime: number;
}

export interface InteractiveExample {
  id: string;
  title: string;
  description: string;
  code: string;
  language: string;
  runnable: boolean;
  expectedOutput?: string;
  explanation: string;
}

export interface UserGuideAnalytics {
  pageViews: Map<string, number>;
  searchQueries: string[];
  userFeedback: Map<string, number>;
  popularPages: string[];
  averageReadTime: Map<string, number>;
  exportUsage: Map<string, number>;
}

export class ComprehensiveUserGuideService extends EventEmitter {
  private config: UserGuideConfig;
  private context7Client: Context7MCPClientService;
  private playwrightService: PlaywrightService;
  private vectorDb: VectorDatabaseService;
  private analytics: UserGuideAnalytics;
  private isGenerating: boolean = false;

  constructor(
    configService: ConfigService,
    context7Client: Context7MCPClientService,
    playwrightService: PlaywrightService,
    vectorDb: VectorDatabaseService
  ) {
    super();
    
    this.config = {
      outputDir: configService.getNested('userGuide', 'outputDir') || 'docs/comprehensive-guide',
      templateDir: configService.getNested('userGuide', 'templateDir') || 'templates/user-guide',
      autoUpdate: configService.getNested('userGuide', 'autoUpdate') || true,
      includeScreenshots: configService.getNested('userGuide', 'includeScreenshots') || true,
      theme: configService.getNested('userGuide', 'theme') || 'modern-dark',
      languages: configService.getNested('userGuide', 'languages') || ['typescript', 'javascript', 'python', 'go'],
      exportFormats: configService.getNested('userGuide', 'exportFormats') || ['html', 'pdf', 'epub'],
      pwaEnabled: configService.getNested('userGuide', 'pwaEnabled') || true,
      offlineMode: configService.getNested('userGuide', 'offlineMode') || true,
      searchEnabled: configService.getNested('userGuide', 'searchEnabled') || true,
      analyticsEnabled: configService.getNested('userGuide', 'analyticsEnabled') || true
    };

    this.context7Client = context7Client;
    this.playwrightService = playwrightService;
    this.vectorDb = vectorDb;
    this.analytics = {
      pageViews: new Map(),
      searchQueries: [],
      userFeedback: new Map(),
      popularPages: [],
      averageReadTime: new Map(),
      exportUsage: new Map()
    };
  }

  async start(): Promise<void> {
    console.log('🚀 Starting Comprehensive User Guide Service...');
    
    try {
      // Ensure output directory exists
      await fs.mkdir(this.config.outputDir, { recursive: true });
      await fs.mkdir(path.join(this.config.outputDir, 'assets'), { recursive: true });
      await fs.mkdir(path.join(this.config.outputDir, 'screenshots'), { recursive: true });
      await fs.mkdir(path.join(this.config.outputDir, 'examples'), { recursive: true });

      // Generate initial guide
      await this.generateComprehensiveGuide();
      
      // Set up auto-update if enabled
      if (this.config.autoUpdate) {
        this.setupAutoUpdate();
      }

      console.log('✅ Comprehensive User Guide Service started');
      this.emit('started');
    } catch (error) {
      console.error('❌ Failed to start Comprehensive User Guide Service:', error);
      this.emit('error', error);
      throw error;
    }
  }

  async generateComprehensiveGuide(): Promise<void> {
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
      
      // Generate PWA manifest if enabled
      if (this.config.pwaEnabled) {
        await this.generatePWAManifest();
      }
      
      // Generate service worker for offline mode
      if (this.config.offlineMode) {
        await this.generateServiceWorker();
      }
      
      // Generate search index
      if (this.config.searchEnabled) {
        await this.generateSearchIndex(pages);
      }

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

  private async generateAllPages(): Promise<GuidePage[]> {
    const pages: GuidePage[] = [];

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

  private async generatePage(id: string, title: string, difficulty: 'beginner' | 'intermediate' | 'advanced'): Promise<GuidePage> {
    console.log(`📄 Generating page: ${title}`);

    // Get Context7 content for this page
    const context7Content = await this.getContext7Content(title);
    
    // Generate interactive examples
    const examples = await this.generateInteractiveExamples(title);
    
    // Take screenshots if enabled
    const screenshots: string[] = [];
    if (this.config.includeScreenshots) {
      screenshots.push(...await this.generateScreenshots(id, title));
    }

    // Generate page content
    const content = await this.generatePageContent(title, context7Content, examples, difficulty);
    
    // Save page
    const page: GuidePage = {
      id,
      title,
      content,
      lastUpdated: new Date(),
      screenshots,
      interactiveExamples: examples,
      relatedPages: this.getRelatedPages(id),
      tags: this.generateTags(title, difficulty),
      difficulty,
      estimatedReadTime: this.calculateReadTime(content)
    };

    await this.savePage(page);
    return page;
  }

  private async getContext7Content(topic: string): Promise<string> {
    try {
      // Search for relevant documentation
      const searchResults = await this.context7Client.searchDocumentation(topic, 5);
      
      if (searchResults && searchResults.length > 0) {
        return searchResults.map(result => result.content).join('\n\n');
      }
      
      return `# ${topic}\n\nContent will be generated based on Context7 documentation.`;
    } catch (error) {
      console.warn(`⚠️  Context7 content unavailable for ${topic}:`, error);
      return `# ${topic}\n\nContent will be generated based on Context7 documentation.`;
    }
  }

  private async generateInteractiveExamples(topic: string): Promise<InteractiveExample[]> {
    const examples: InteractiveExample[] = [];

    // Generate examples based on topic
    switch (topic.toLowerCase()) {
      case 'getting started':
        examples.push({
          id: 'basic-setup',
          title: 'Basic Setup',
          description: 'Set up LocalMCP in your project',
          code: `# Install LocalMCP
npm install localmcp

# Start the server
npx localmcp start

# Test the connection
curl http://localhost:3000/health`,
          language: 'bash',
          runnable: true,
          expectedOutput: '{"status":"healthy","services":{"localmcp":"healthy"}}',
          explanation: 'This example shows how to install and start LocalMCP.'
        });
        break;

      case 'tool reference':
        examples.push({
          id: 'analyze-tool',
          title: 'Using localmcp.analyze',
          description: 'Analyze your code and project structure',
          code: `{
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
}`,
          language: 'json',
          runnable: true,
          expectedOutput: 'Analysis results with code quality metrics and suggestions',
          explanation: 'This example shows how to use the analyze tool to examine your code.'
        });
        break;
    }

    return examples;
  }

  private async generateScreenshots(pageId: string, title: string): Promise<string[]> {
    const screenshots: string[] = [];
    
    try {
      // Take screenshot of the main application
      const mainScreenshot = await this.playwrightService.takeScreenshot(
        'http://localhost:3000/health',
        `screenshots/${pageId}-main.png`
      );
      if (mainScreenshot) screenshots.push(mainScreenshot);

      // Take screenshot of admin console if available
      const adminScreenshot = await this.playwrightService.takeScreenshot(
        'http://localhost:3003',
        `screenshots/${pageId}-admin.png`
      );
      if (adminScreenshot) screenshots.push(adminScreenshot);

    } catch (error) {
      console.warn(`⚠️  Screenshot generation failed for ${pageId}:`, error);
    }

    return screenshots;
  }

  private async generatePageContent(
    title: string, 
    context7Content: string, 
    examples: InteractiveExample[], 
    difficulty: string
  ): Promise<string> {
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
                <span class="read-time">${this.calculateReadTime(context7Content)} min read</span>
            </div>
        </div>
        
        <div class="page-content">
            ${this.markdownToHtml(context7Content)}
        </div>
        
        ${examples.length > 0 ? this.generateExamplesSection(examples) : ''}
        
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

  private generateExamplesSection(examples: InteractiveExample[]): string {
    return `
    <div class="examples-section">
        <h2>Interactive Examples</h2>
        ${examples.map(example => `
        <div class="example-card" data-example-id="${example.id}">
            <h3>${example.title}</h3>
            <p>${example.description}</p>
            <div class="code-block">
                <pre><code class="language-${example.language}">${example.code}</code></pre>
                ${example.runnable ? '<button class="run-example-btn">Run Example</button>' : ''}
            </div>
            ${example.expectedOutput ? `
            <div class="expected-output" style="display: none;">
                <h4>Expected Output:</h4>
                <pre><code>${example.expectedOutput}</code></pre>
            </div>
            ` : ''}
            <div class="explanation">
                <p>${example.explanation}</p>
            </div>
        </div>
        `).join('')}
    </div>`;
  }

  private async savePage(page: GuidePage): Promise<void> {
    const filePath = path.join(this.config.outputDir, `${page.id}.html`);
    await fs.writeFile(filePath, page.content, 'utf8');
    
    // Update analytics
    if (this.config.analyticsEnabled) {
      this.analytics.pageViews.set(page.id, 0);
    }
  }

  private async generateMainIndex(pages: GuidePage[]): Promise<void> {
    const indexContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LocalMCP Comprehensive User Guide</title>
    <link rel="stylesheet" href="styles/main.css">
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
                    <span class="stat-number">${pages.reduce((sum, page) => sum + page.interactiveExamples.length, 0)}</span>
                    <span class="stat-label">Examples</span>
                </div>
                <div class="stat">
                    <span class="stat-number">${pages.reduce((sum, page) => sum + page.screenshots.length, 0)}</span>
                    <span class="stat-label">Screenshots</span>
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
                <div class="page-tags">
                    ${page.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
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
  '/scripts/main.js',
  '/scripts/search.js',
  '/scripts/analytics.js'
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

  private async generateSearchIndex(pages: GuidePage[]): Promise<void> {
    const searchIndex = {
      pages: pages.map(page => ({
        id: page.id,
        title: page.title,
        content: this.extractSearchableContent(page.content),
        tags: page.tags,
        difficulty: page.difficulty
      }))
    };

    await fs.writeFile(
      path.join(this.config.outputDir, 'search-index.json'),
      JSON.stringify(searchIndex, null, 2),
      'utf8'
    );
  }

  private setupAutoUpdate(): void {
    // Update guide every hour
    setInterval(async () => {
      try {
        await this.generateComprehensiveGuide();
        console.log('🔄 User guide auto-updated');
      } catch (error) {
        console.error('❌ Auto-update failed:', error);
      }
    }, 60 * 60 * 1000); // 1 hour
  }

  // Helper methods
  private getRelatedPages(pageId: string): string[] {
    const relations: Record<string, string[]> = {
      'getting-started': ['quick-start', 'tool-reference'],
      'quick-start': ['getting-started', 'tool-reference', 'pipeline-guide'],
      'tool-reference': ['pipeline-guide', 'admin-console'],
      'pipeline-guide': ['tool-reference', 'advanced-features'],
      'admin-console': ['tool-reference', 'troubleshooting'],
      'troubleshooting': ['admin-console', 'deployment']
    };
    return relations[pageId] || [];
  }

  private generateTags(title: string, difficulty: string): string[] {
    const tags = [difficulty];
    
    if (title.toLowerCase().includes('start')) tags.push('beginner', 'setup');
    if (title.toLowerCase().includes('tool')) tags.push('reference', 'api');
    if (title.toLowerCase().includes('pipeline')) tags.push('advanced', 'architecture');
    if (title.toLowerCase().includes('admin')) tags.push('management', 'monitoring');
    if (title.toLowerCase().includes('troubleshoot')) tags.push('debug', 'help');
    
    return tags;
  }

  private calculateReadTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  private markdownToHtml(markdown: string): string {
    // Simple markdown to HTML conversion
    return markdown
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/`(.*)`/gim, '<code>$1</code>')
      .replace(/\n\n/gim, '</p><p>')
      .replace(/^(.*)$/gim, '<p>$1</p>');
  }

  private extractSearchableContent(html: string): string {
    // Extract text content from HTML for search
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  private generatePageDescription(pageId: string): string {
    const descriptions: Record<string, string> = {
      'getting-started': 'Learn how to set up and configure LocalMCP for your project',
      'quick-start': 'Get up and running with LocalMCP in minutes',
      'tool-reference': 'Complete reference for all LocalMCP tools and APIs',
      'pipeline-guide': 'Understand how the dynamic pipeline works',
      'admin-console': 'Manage and monitor your LocalMCP instance',
      'troubleshooting': 'Solve common issues and problems'
    };
    return descriptions[pageId] || 'Learn more about LocalMCP';
  }

  // Public API methods
  async getPage(pageId: string): Promise<GuidePage | null> {
    try {
      const filePath = path.join(this.config.outputDir, `${pageId}.html`);
      const content = await fs.readFile(filePath, 'utf8');
      
      // Parse page content (simplified)
      return {
        id: pageId,
        title: this.extractTitle(content),
        content,
        lastUpdated: new Date(),
        screenshots: [],
        interactiveExamples: [],
        relatedPages: [],
        tags: [],
        difficulty: 'beginner',
        estimatedReadTime: this.calculateReadTime(content)
      };
    } catch (error) {
      return null;
    }
  }

  async searchPages(query: string): Promise<GuidePage[]> {
    // Implement search functionality
    return [];
  }

  async exportGuide(format: 'pdf' | 'epub' | 'zip'): Promise<string> {
    // Implement export functionality
    return '';
  }

  getAnalytics(): UserGuideAnalytics {
    return this.analytics;
  }

  private extractTitle(html: string): string {
    const match = html.match(/<title>(.*?)<\/title>/);
    return match ? match[1] : 'Untitled';
  }
}

export default ComprehensiveUserGuideService;
