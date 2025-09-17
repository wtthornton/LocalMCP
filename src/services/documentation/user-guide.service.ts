import { Logger } from '../logger/logger.js';
import { ConfigService } from '../../config/config.service.js';
import { Context7Service } from '../context7/context7.service.js';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import type { UserGuideConfig, UserGuidePage, UserGuideTemplate } from './user-guide.types.js';

/**
 * User Guide Generation Service
 * 
 * Creates comprehensive multi-page HTML user guides using Context7 for content
 * and integrates with the pipeline for automatic updates after each phase.
 */
export class UserGuideService {
  private config: UserGuideConfig;
  private outputDir: string;

  constructor(
    private logger: Logger,
    private configService: ConfigService,
    private context7: Context7Service
  ) {
    this.config = {
      outputDir: configService.getNested('userGuide', 'outputDir') || 'docs/user-guide',
      templateDir: configService.getNested('userGuide', 'templateDir') || 'templates/user-guide',
      autoUpdate: configService.getNested('userGuide', 'autoUpdate') || true,
      includeScreenshots: configService.getNested('userGuide', 'includeScreenshots') || true,
      theme: configService.getNested('userGuide', 'theme') || 'modern-dark'
    };
    
    this.outputDir = join(process.cwd(), this.config.outputDir);
  }

  /**
   * Generate complete user guide with all phases and features
   */
  async generateUserGuide(phaseData?: any): Promise<string[]> {
    this.logger.info('Generating comprehensive user guide...');
    
    try {
      // Ensure output directory exists
      await mkdir(this.outputDir, { recursive: true });
      
      // Generate all pages
      const pages = await this.generateAllPages(phaseData);
      
      // Generate navigation and index
      await this.generateNavigation(pages);
      await this.generateIndex(pages);
      
      // Copy assets
      await this.copyAssets();
      
      this.logger.info('User guide generation completed', {
        outputDir: this.outputDir,
        pagesGenerated: pages.length
      });
      
      return pages.map(page => page.outputPath);
      
    } catch (error) {
      this.logger.error('Failed to generate user guide:', error);
      throw error;
    }
  }

  /**
   * Update user guide after phase completion
   */
  async updateUserGuide(phaseName: string, phaseData: any): Promise<void> {
    if (!this.config.autoUpdate) {
      this.logger.info('Auto-update disabled, skipping user guide update');
      return;
    }

    this.logger.info(`Updating user guide for phase: ${phaseName}`);
    
    try {
      // Update specific phase page
      await this.updatePhasePage(phaseName, phaseData);
      
      // Update index and navigation
      await this.updateIndexAndNavigation();
      
      this.logger.info(`User guide updated for phase: ${phaseName}`);
      
    } catch (error) {
      this.logger.error(`Failed to update user guide for phase ${phaseName}:`, error);
      throw error;
    }
  }

  private async generateAllPages(phaseData?: any): Promise<UserGuidePage[]> {
    const pages: UserGuidePage[] = [];

    // Generate main pages
    pages.push(await this.generateGettingStartedPage());
    pages.push(await this.generateQuickStartPage());
    pages.push(await this.generateToolReferencePage());
    pages.push(await this.generatePipelineGuidePage());
    
    // Generate phase-specific pages
    pages.push(await this.generatePhasePage('Phase 0', 'MVP Setup', phaseData?.phase0));
    pages.push(await this.generatePhasePage('Phase 1', 'RAG + Context7 + Pipeline', phaseData?.phase1));
    pages.push(await this.generatePhasePage('Phase 2', 'Dynamic Pipeline', phaseData?.phase2));
    pages.push(await this.generatePhasePage('Phase 3', 'Lessons Learned', phaseData?.phase3));
    
    // Generate advanced pages
    pages.push(await this.generateAdminConsolePage());
    pages.push(await this.generateTroubleshootingPage());
    pages.push(await this.generateAPIReferencePage());
    pages.push(await this.generateExamplesPage());

    return pages;
  }

  private async generateGettingStartedPage(): Promise<UserGuidePage> {
    const content = await this.getContext7Content('getting-started', 'LocalMCP introduction and setup');
    
    const page: UserGuidePage = {
      id: 'getting-started',
      title: 'Getting Started',
      description: 'Introduction to LocalMCP and initial setup',
      content: this.applyTemplate('getting-started', content),
      outputPath: join(this.outputDir, 'getting-started.html'),
      order: 1
    };

    await this.writePage(page);
    return page;
  }

  private async generateQuickStartPage(): Promise<UserGuidePage> {
    const content = await this.getContext7Content('quick-start', 'LocalMCP quick start tutorial');
    
    const page: UserGuidePage = {
      id: 'quick-start',
      title: 'Quick Start',
      description: 'Quick tutorial to get up and running',
      content: this.applyTemplate('quick-start', content),
      outputPath: join(this.outputDir, 'quick-start.html'),
      order: 2
    };

    await this.writePage(page);
    return page;
  }

  private async generateToolReferencePage(): Promise<UserGuidePage> {
    const content = await this.getContext7Content('tool-reference', 'LocalMCP tools documentation');
    
    const page: UserGuidePage = {
      id: 'tool-reference',
      title: 'Tool Reference',
      description: 'Complete reference for all 4 LocalMCP tools',
      content: this.applyTemplate('tool-reference', content),
      outputPath: join(this.outputDir, 'tool-reference.html'),
      order: 3
    };

    await this.writePage(page);
    return page;
  }

  private async generatePipelineGuidePage(): Promise<UserGuidePage> {
    const content = await this.getContext7Content('pipeline-guide', 'Dynamic Pipeline Engine guide');
    
    const page: UserGuidePage = {
      id: 'pipeline-guide',
      title: 'Pipeline Guide',
      description: 'Understanding the Dynamic Pipeline Engine',
      content: this.applyTemplate('pipeline-guide', content),
      outputPath: join(this.outputDir, 'pipeline-guide.html'),
      order: 4
    };

    await this.writePage(page);
    return page;
  }

  private async generatePhasePage(phaseName: string, phaseTitle: string, phaseData?: any): Promise<UserGuidePage> {
    const content = await this.getContext7Content(`${phaseName.toLowerCase().replace(' ', '-')}`, `${phaseTitle} implementation details`);
    
    const page: UserGuidePage = {
      id: phaseName.toLowerCase().replace(' ', '-'),
      title: `${phaseName}: ${phaseTitle}`,
      description: `Implementation details for ${phaseTitle}`,
      content: this.applyTemplate('phase', { ...content, phaseData }),
      outputPath: join(this.outputDir, `${phaseName.toLowerCase().replace(' ', '-')}.html`),
      order: 5
    };

    await this.writePage(page);
    return page;
  }

  private async generateAdminConsolePage(): Promise<UserGuidePage> {
    const content = await this.getContext7Content('admin-console', 'Admin console and debugging');
    
    const page: UserGuidePage = {
      id: 'admin-console',
      title: 'Admin Console',
      description: 'Using the admin console for debugging and monitoring',
      content: this.applyTemplate('admin-console', content),
      outputPath: join(this.outputDir, 'admin-console.html'),
      order: 6
    };

    await this.writePage(page);
    return page;
  }

  private async generateTroubleshootingPage(): Promise<UserGuidePage> {
    const content = await this.getContext7Content('troubleshooting', 'Common issues and solutions');
    
    const page: UserGuidePage = {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      description: 'Common issues and their solutions',
      content: this.applyTemplate('troubleshooting', content),
      outputPath: join(this.outputDir, 'troubleshooting.html'),
      order: 7
    };

    await this.writePage(page);
    return page;
  }

  private async generateAPIReferencePage(): Promise<UserGuidePage> {
    const content = await this.getContext7Content('api-reference', 'LocalMCP API documentation');
    
    const page: UserGuidePage = {
      id: 'api-reference',
      title: 'API Reference',
      description: 'Complete API documentation',
      content: this.applyTemplate('api-reference', content),
      outputPath: join(this.outputDir, 'api-reference.html'),
      order: 8
    };

    await this.writePage(page);
    return page;
  }

  private async generateExamplesPage(): Promise<UserGuidePage> {
    const content = await this.getContext7Content('examples', 'LocalMCP usage examples');
    
    const page: UserGuidePage = {
      id: 'examples',
      title: 'Examples',
      description: 'Real-world usage examples and tutorials',
      content: this.applyTemplate('examples', content),
      outputPath: join(this.outputDir, 'examples.html'),
      order: 9
    };

    await this.writePage(page);
    return page;
  }

  private async getContext7Content(topic: string, description: string): Promise<any> {
    try {
      // Use Context7 to get relevant content
      const result = await this.context7.getLibraryDocs('mcp-framework', topic);
      return result || { title: topic, content: description };
    } catch (error) {
      this.logger.warn(`Failed to get Context7 content for ${topic}:`, error);
      return { title: topic, content: description };
    }
  }

  private applyTemplate(templateName: string, content: any): string {
    // Apply HTML template with theme and styling
    return this.getTemplate(templateName).replace('{{CONTENT}}', this.formatContent(content));
  }

  private getTemplate(templateName: string): string {
    // Return appropriate HTML template
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}} - LocalMCP User Guide</title>
    <link rel="stylesheet" href="styles/main.css">
    <link rel="stylesheet" href="styles/${this.config.theme}.css">
</head>
<body>
    <nav class="sidebar">
        <div class="nav-header">
            <h2>LocalMCP</h2>
            <p>User Guide</p>
        </div>
        <ul class="nav-menu">
            <li><a href="index.html">Home</a></li>
            <li><a href="getting-started.html">Getting Started</a></li>
            <li><a href="quick-start.html">Quick Start</a></li>
            <li><a href="tool-reference.html">Tool Reference</a></li>
            <li><a href="pipeline-guide.html">Pipeline Guide</a></li>
            <li><a href="admin-console.html">Admin Console</a></li>
            <li><a href="troubleshooting.html">Troubleshooting</a></li>
            <li><a href="api-reference.html">API Reference</a></li>
            <li><a href="examples.html">Examples</a></li>
        </ul>
    </nav>
    <main class="content">
        {{CONTENT}}
    </main>
</body>
</html>`;
  }

  private formatContent(content: any): string {
    if (typeof content === 'string') {
      return `<div class="content-body">${content}</div>`;
    }
    
    return `
      <div class="content-body">
        <h1>${content.title || 'Documentation'}</h1>
        <div class="content-text">
          ${content.content || 'Content not available'}
        </div>
        ${content.code ? `<pre><code>${content.code}</code></pre>` : ''}
        ${content.examples ? `<div class="examples">${content.examples}</div>` : ''}
      </div>
    `;
  }

  private async writePage(page: UserGuidePage): Promise<void> {
    await writeFile(page.outputPath, page.content, 'utf-8');
    this.logger.debug(`Generated page: ${page.outputPath}`);
  }

  private async generateNavigation(pages: UserGuidePage[]): Promise<void> {
    // Generate navigation structure
    const navContent = this.generateNavHTML(pages);
    const navPath = join(this.outputDir, 'navigation.html');
    await writeFile(navPath, navContent, 'utf-8');
  }

  private async generateIndex(pages: UserGuidePage[]): Promise<void> {
    const indexContent = this.generateIndexHTML(pages);
    const indexPath = join(this.outputDir, 'index.html');
    await writeFile(indexPath, indexContent, 'utf-8');
  }

  private generateNavHTML(pages: UserGuidePage[]): string {
    const navItems = pages
      .sort((a, b) => a.order - b.order)
      .map(page => `<li><a href="${page.id}.html">${page.title}</a></li>`)
      .join('\n');
    
    return `
      <nav class="user-guide-nav">
        <ul>
          ${navItems}
        </ul>
      </nav>
    `;
  }

  private generateIndexHTML(pages: UserGuidePage[]): string {
    const pageList = pages
      .sort((a, b) => a.order - b.order)
      .map(page => `
        <div class="page-card">
          <h3><a href="${page.id}.html">${page.title}</a></h3>
          <p>${page.description}</p>
        </div>
      `)
      .join('\n');
    
    return this.applyTemplate('index', { 
      title: 'LocalMCP User Guide',
      content: `
        <h1>Welcome to LocalMCP</h1>
        <p>Your comprehensive guide to the LocalMCP system for vibe coders.</p>
        <div class="page-grid">
          ${pageList}
        </div>
      `
    });
  }

  private async copyAssets(): Promise<void> {
    // Copy CSS and JS assets
    const assetsDir = join(this.outputDir, 'styles');
    await mkdir(assetsDir, { recursive: true });
    
    // Create main CSS
    const mainCSS = this.generateMainCSS();
    await writeFile(join(assetsDir, 'main.css'), mainCSS, 'utf-8');
    
    // Create theme CSS
    const themeCSS = this.generateThemeCSS();
    await writeFile(join(assetsDir, `${this.config.theme}.css`), themeCSS, 'utf-8');
  }

  private generateMainCSS(): string {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        display: flex;
        min-height: 100vh;
      }
      
      .sidebar {
        width: 250px;
        background: #1a1a1a;
        color: #e0e0e0;
        padding: 20px;
        position: fixed;
        height: 100vh;
        overflow-y: auto;
      }
      
      .content {
        margin-left: 250px;
        padding: 40px;
        max-width: 800px;
        flex: 1;
      }
      
      .nav-menu li {
        margin: 10px 0;
      }
      
      .nav-menu a {
        color: #e0e0e0;
        text-decoration: none;
        padding: 8px 12px;
        border-radius: 4px;
        display: block;
        transition: background 0.2s;
      }
      
      .nav-menu a:hover {
        background: #333;
      }
      
      h1, h2, h3 {
        margin: 20px 0 10px 0;
        color: #fff;
      }
      
      .content-body {
        color: #e0e0e0;
      }
      
      pre {
        background: #2a2a2a;
        padding: 20px;
        border-radius: 8px;
        overflow-x: auto;
        margin: 20px 0;
      }
      
      code {
        color: #f8f8f2;
        font-family: 'Monaco', 'Menlo', monospace;
      }
    `;
  }

  private generateThemeCSS(): string {
    if (this.config.theme === 'modern-dark') {
      return `
        body {
          background: #0d1117;
          color: #e6edf3;
        }
        
        .sidebar {
          background: #161b22;
          border-right: 1px solid #30363d;
        }
        
        .content {
          background: #0d1117;
        }
        
        h1, h2, h3 {
          color: #f0f6fc;
        }
        
        .page-card {
          background: #161b22;
          border: 1px solid #30363d;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          transition: border-color 0.2s;
        }
        
        .page-card:hover {
          border-color: #58a6ff;
        }
        
        .page-card a {
          color: #58a6ff;
          text-decoration: none;
        }
      `;
    }
    
    return '';
  }

  private async updatePhasePage(phaseName: string, phaseData: any): Promise<void> {
    const page = await this.generatePhasePage(phaseName, phaseData.title || phaseName, phaseData);
    await this.writePage(page);
  }

  private async updateIndexAndNavigation(): Promise<void> {
    const pages = await this.getAllPages();
    await this.generateNavigation(pages);
    await this.generateIndex(pages);
  }

  private async getAllPages(): Promise<UserGuidePage[]> {
    // Read existing pages from directory
    // This is a simplified version - in reality, you'd scan the directory
    return [];
  }
}
