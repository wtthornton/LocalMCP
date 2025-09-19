#!/usr/bin/env node

/**
 * Simple User Guide Generator
 * 
 * Creates a basic multi-page HTML user guide for PromptMCP
 * This is a simplified version that works immediately while we develop
 * the full Context7 + Playwright integrated system in Phase 6.
 */

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

async function generateSimpleUserGuide() {
  console.log('📚 Generating Simple User Guide...\n');

  const outputDir = join(process.cwd(), 'docs', 'user-guide');
  
  try {
    // Create output directory
    await mkdir(outputDir, { recursive: true });
    await mkdir(join(outputDir, 'styles'), { recursive: true });
    await mkdir(join(outputDir, 'screenshots'), { recursive: true });

    // Generate CSS
    await generateCSS(outputDir);
    
    // Generate pages
    const pages = [
      { id: 'index', title: 'PromptMCP User Guide', content: generateIndexPage() },
      { id: 'getting-started', title: 'Getting Started', content: generateGettingStartedPage() },
      { id: 'quick-start', title: 'Quick Start', content: generateQuickStartPage() },
      { id: 'tool-reference', title: 'Tool Reference', content: generateToolReferencePage() },
      { id: 'pipeline-guide', title: 'Pipeline Guide', content: generatePipelineGuidePage() },
      { id: 'admin-console', title: 'Admin Console', content: generateAdminConsolePage() },
      { id: 'troubleshooting', title: 'Troubleshooting', content: generateTroubleshootingPage() }
    ];

    // Write all pages
    for (const page of pages) {
      const html = generatePageHTML(page.title, page.content, pages);
      const filePath = join(outputDir, `${page.id}.html`);
      await writeFile(filePath, html, 'utf-8');
      console.log(`✅ Generated: ${filePath}`);
    }

    console.log(`\n🎉 User Guide Generated Successfully!`);
    console.log(`📁 Output Directory: ${outputDir}`);
    console.log(`📄 Pages Generated: ${pages.length}`);
    console.log(`\n🌐 Open in browser: file://${join(outputDir, 'index.html').replace(/\\/g, '/')}`);

  } catch (error) {
    console.error('❌ Failed to generate user guide:', error);
    process.exit(1);
  }
}

function generateCSS(outputDir) {
  const css = `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      background: #0d1117;
      color: #e6edf3;
      display: flex;
      min-height: 100vh;
    }
    
    .sidebar {
      width: 250px;
      background: #161b22;
      border-right: 1px solid #30363d;
      padding: 20px;
      position: fixed;
      height: 100vh;
      overflow-y: auto;
    }
    
    .nav-header h2 {
      color: #58a6ff;
      margin-bottom: 5px;
    }
    
    .nav-header p {
      color: #8b949e;
      font-size: 14px;
    }
    
    .nav-menu {
      list-style: none;
      margin-top: 30px;
    }
    
    .nav-menu li {
      margin: 8px 0;
    }
    
    .nav-menu a {
      color: #e6edf3;
      text-decoration: none;
      padding: 8px 12px;
      border-radius: 6px;
      display: block;
      transition: all 0.2s;
    }
    
    .nav-menu a:hover {
      background: #21262d;
      color: #58a6ff;
    }
    
    .nav-menu a.active {
      background: #1f6feb;
      color: white;
    }
    
    .content {
      margin-left: 250px;
      padding: 40px;
      max-width: 900px;
      flex: 1;
    }
    
    h1, h2, h3 {
      color: #f0f6fc;
      margin: 20px 0 10px 0;
    }
    
    h1 {
      font-size: 2.5em;
      border-bottom: 2px solid #30363d;
      padding-bottom: 10px;
    }
    
    h2 {
      font-size: 1.8em;
      color: #58a6ff;
      margin-top: 30px;
    }
    
    h3 {
      font-size: 1.3em;
      color: #79c0ff;
    }
    
    p {
      margin: 15px 0;
      color: #e6edf3;
    }
    
    .code-block {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 6px;
      padding: 20px;
      margin: 20px 0;
      overflow-x: auto;
    }
    
    .code-block code {
      color: #f8f8f2;
      font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
      font-size: 14px;
    }
    
    .highlight {
      background: #264f78;
      padding: 2px 6px;
      border-radius: 3px;
      color: #79c0ff;
    }
    
    .feature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }
    
    .feature-card {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 8px;
      padding: 20px;
      transition: border-color 0.2s;
    }
    
    .feature-card:hover {
      border-color: #58a6ff;
    }
    
    .feature-card h3 {
      color: #58a6ff;
      margin-top: 0;
    }
    
    .status-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
      margin-left: 10px;
    }
    
    .status-completed {
      background: #238636;
      color: white;
    }
    
    .status-in-progress {
      background: #f85149;
      color: white;
    }
    
    .status-pending {
      background: #8b949e;
      color: white;
    }
    
    .tool-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 15px;
      margin: 20px 0;
    }
    
    .tool-card {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 6px;
      padding: 15px;
    }
    
    .tool-card h4 {
      color: #58a6ff;
      margin: 0 0 10px 0;
    }
    
    .tool-card p {
      font-size: 14px;
      margin: 5px 0;
    }
    
    .example-box {
      background: #0d1117;
      border-left: 4px solid #58a6ff;
      padding: 15px;
      margin: 15px 0;
    }
    
    .example-box h4 {
      color: #79c0ff;
      margin: 0 0 10px 0;
    }
  `;

  return writeFile(join(outputDir, 'styles', 'main.css'), css, 'utf-8');
}

function generatePageHTML(title, content, allPages) {
  const navigation = allPages
    .map(page => `<li><a href="${page.id}.html">${page.title}</a></li>`)
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - PromptMCP User Guide</title>
    <link rel="stylesheet" href="styles/main.css">
</head>
<body>
    <nav class="sidebar">
        <div class="nav-header">
            <h2>PromptMCP</h2>
            <p>User Guide</p>
        </div>
        <ul class="nav-menu">
            ${navigation}
        </ul>
    </nav>
    <main class="content">
        ${content}
    </main>
</body>
</html>`;
}

function generateIndexPage() {
  return `
    <h1>Welcome to PromptMCP</h1>
    <p>Your comprehensive AI-powered coding assistant for vibe coders who want smart help without deep framework expertise.</p>
    
    <h2>What is PromptMCP?</h2>
    <p>PromptMCP is a local Model Context Protocol (MCP) server that provides AI assistance for coding tasks. It's designed for developers who prefer AI assistance and simple setups.</p>
    
    <h2>Key Features</h2>
    <div class="feature-grid">
        <div class="feature-card">
            <h3>🚀 Simple Setup</h3>
            <p>Just run <span class="highlight">docker run -p 3000:3000 promptmcp</span> and you're ready to go!</p>
        </div>
        <div class="feature-card">
            <h3>🧠 Smart Context</h3>
            <p>AI understands your project structure, dependencies, and coding patterns.</p>
        </div>
        <div class="feature-card">
            <h3>📚 Cached Docs</h3>
            <p>Instant access to framework documentation with Context7 integration.</p>
        </div>
        <div class="feature-card">
            <h3>🔄 Learning System</h3>
            <p>Adapts and improves based on your coding patterns and successful solutions.</p>
        </div>
    </div>
    
    <h2>Quick Start</h2>
    <div class="example-box">
        <h4>1. Start PromptMCP</h4>
        <div class="code-block">
            <code>docker run -p 3000:3000 promptmcp</code>
        </div>
    </div>
    
    <div class="example-box">
        <h4>2. Connect to Cursor</h4>
        <p>Point Cursor to <span class="highlight">localhost:3000</span> as your MCP endpoint.</p>
    </div>
    
    <div class="example-box">
        <h4>3. Start Coding with AI</h4>
        <p>Ask AI to create, analyze, fix, or learn from your code!</p>
    </div>
    
    <h2>Development Status</h2>
    <p>PromptMCP is currently in active development with the following phases:</p>
    <ul>
        <li><strong>Phase 0 (MVP)</strong> <span class="status-badge status-completed">COMPLETED</span> - Basic MCP server with 4 tools</li>
        <li><strong>Phase 1 (RAG + Context7)</strong> <span class="status-badge status-completed">COMPLETED</span> - Vector database and documentation caching</li>
        <li><strong>Phase 2 (Dynamic Pipeline)</strong> <span class="status-badge status-completed">COMPLETED</span> - Smart pipeline engine</li>
        <li><strong>Phase 3 (Lessons Learned)</strong> <span class="status-badge status-completed">COMPLETED</span> - Adaptive learning system</li>
        <li><strong>Phase 4+ (Future)</strong> <span class="status-badge status-pending">PLANNED</span> - Multi-project support and advanced features</li>
    </ul>
  `;
}

function generateGettingStartedPage() {
  return `
    <h1>Getting Started</h1>
    <p>This guide will help you get PromptMCP up and running quickly.</p>
    
    <h2>Prerequisites</h2>
    <ul>
        <li><strong>Docker</strong> - For running the PromptMCP container</li>
        <li><strong>Cursor IDE</strong> - For AI-powered coding assistance</li>
        <li><strong>Node.js project</strong> - Your coding project (TypeScript, JavaScript, etc.)</li>
    </ul>
    
    <h2>Installation</h2>
    <div class="example-box">
        <h4>Step 1: Pull the PromptMCP Image</h4>
        <div class="code-block">
            <code>docker pull promptmcp:latest</code>
        </div>
    </div>
    
    <div class="example-box">
        <h4>Step 2: Run PromptMCP</h4>
        <div class="code-block">
            <code>docker run -p 3000:3000 -v $(pwd):/workspace promptmcp</code>
        </div>
    </div>
    
    <div class="example-box">
        <h4>Step 3: Verify Installation</h4>
        <div class="code-block">
            <code>curl http://localhost:3000/health</code>
        </div>
    </div>
    
    <h2>Configuration</h2>
    <p>PromptMCP uses a simple configuration system. Create a <span class="highlight">promptmcp.config.json</span> file in your project root:</p>
    
    <div class="code-block">
        <code>{
  "context7": {
    "apiKey": "your-context7-api-key",
    "cacheEnabled": true
  },
  "vectorDb": {
    "type": "qdrant",
    "url": "http://localhost:6333"
  },
  "admin": {
    "enabled": true,
    "port": 3001
  }
}</code>
    </div>
    
    <h2>Next Steps</h2>
    <p>Once PromptMCP is running, proceed to the <a href="quick-start.html">Quick Start</a> guide to learn how to use the 4 core tools.</p>
  `;
}

function generateQuickStartPage() {
  return `
    <h1>Quick Start</h1>
    <p>Learn how to use PromptMCP's 4 core tools with practical examples.</p>
    
    <h2>The 4 Core Tools</h2>
    <div class="tool-grid">
        <div class="tool-card">
            <h4>🔧 promptmcp.create</h4>
            <p><strong>Purpose:</strong> Create new files, components, or code</p>
            <p><strong>Example:</strong> "Create me a dark theme Hello World HTML page"</p>
        </div>
        <div class="tool-card">
            <h4>🔍 promptmcp.analyze</h4>
            <p><strong>Purpose:</strong> Analyze existing code and project structure</p>
            <p><strong>Example:</strong> "What's in this React component?"</p>
        </div>
        <div class="tool-card">
            <h4>🛠️ promptmcp.fix</h4>
            <p><strong>Purpose:</strong> Fix errors, bugs, and issues in code</p>
            <p><strong>Example:</strong> "Fix this TypeScript compilation error"</p>
        </div>
        <div class="tool-card">
            <h4>🧠 promptmcp.learn</h4>
            <p><strong>Purpose:</strong> Remember patterns and solutions for future use</p>
            <p><strong>Example:</strong> "Remember this authentication pattern"</p>
        </div>
    </div>
    
    <h2>Practical Examples</h2>
    
    <div class="example-box">
        <h4>Creating a React Component</h4>
        <p><strong>Request:</strong> "Create a reusable Button component with TypeScript and Tailwind CSS"</p>
        <p><strong>Result:</strong> PromptMCP creates a properly typed, styled Button component with props interface.</p>
    </div>
    
    <div class="example-box">
        <h4>Analyzing Project Structure</h4>
        <p><strong>Request:</strong> "Analyze this Next.js project and tell me what's missing"</p>
        <p><strong>Result:</strong> PromptMCP provides a comprehensive analysis of your project structure, dependencies, and suggests improvements.</p>
    </div>
    
    <div class="example-box">
        <h4>Fixing TypeScript Errors</h4>
        <p><strong>Request:</strong> "Fix the TypeScript error in src/components/Header.tsx"</p>
        <p><strong>Result:</strong> PromptMCP identifies the error, provides a fix, and explains the solution.</p>
    </div>
    
    <h2>Best Practices</h2>
    <ul>
        <li><strong>Be Specific:</strong> Provide clear, detailed requests for better results</li>
        <li><strong>Include Context:</strong> Mention your framework, language, and project type</li>
        <li><strong>Iterate:</strong> Refine your requests based on the AI's responses</li>
        <li><strong>Learn:</strong> Use the learn tool to capture successful patterns</li>
    </ul>
  `;
}

function generateToolReferencePage() {
  return `
    <h1>Tool Reference</h1>
    <p>Complete reference for all PromptMCP tools and their capabilities.</p>
    
    <h2>promptmcp.create</h2>
    <p>Creates new files, components, or code based on your specifications.</p>
    
    <h3>Parameters</h3>
    <ul>
        <li><strong>description</strong> - What you want to create</li>
        <li><strong>framework</strong> - Target framework (React, Vue, Angular, etc.)</li>
        <li><strong>language</strong> - Programming language (TypeScript, JavaScript, etc.)</li>
        <li><strong>styling</strong> - CSS framework (Tailwind, Styled Components, etc.)</li>
    </ul>
    
    <h3>Example</h3>
    <div class="code-block">
        <code>{
  "tool": "promptmcp.create",
  "parameters": {
    "description": "A responsive navigation bar with mobile menu",
    "framework": "React",
    "language": "TypeScript",
    "styling": "Tailwind CSS"
  }
}</code>
    </div>
    
    <h2>promptmcp.analyze</h2>
    <p>Analyzes existing code and provides insights about structure, patterns, and potential issues.</p>
    
    <h3>Parameters</h3>
    <ul>
        <li><strong>targetPath</strong> - File or directory to analyze</li>
        <li><strong>analysisType</strong> - Type of analysis (structure, performance, security, etc.)</li>
        <li><strong>depth</strong> - Analysis depth (shallow, medium, deep)</li>
    </ul>
    
    <h3>Example</h3>
    <div class="code-block">
        <code>{
  "tool": "promptmcp.analyze",
  "parameters": {
    "targetPath": "src/components",
    "analysisType": "structure",
    "depth": "deep"
  }
}</code>
    </div>
    
    <h2>promptmcp.fix</h2>
    <p>Identifies and fixes errors, bugs, and issues in your code.</p>
    
    <h3>Parameters</h3>
    <ul>
        <li><strong>targetPath</strong> - File containing the issue</li>
        <li><strong>errorDescription</strong> - Description of the error or issue</li>
        <li><strong>fixType</strong> - Type of fix (syntax, logic, performance, etc.)</li>
    </ul>
    
    <h3>Example</h3>
    <div class="code-block">
        <code>{
  "tool": "promptmcp.fix",
  "parameters": {
    "targetPath": "src/utils/helpers.ts",
    "errorDescription": "TypeScript error: Property 'name' does not exist on type 'User'",
    "fixType": "syntax"
  }
}</code>
    </div>
    
    <h2>promptmcp.learn</h2>
    <p>Captures patterns, solutions, and best practices for future reference.</p>
    
    <h3>Parameters</h3>
    <ul>
        <li><strong>pattern</strong> - The pattern or solution to remember</li>
        <li><strong>context</strong> - Context where this pattern applies</li>
        <li><strong>category</strong> - Category of the pattern (authentication, UI, API, etc.)</li>
    </ul>
    
    <h3>Example</h3>
    <div class="code-block">
        <code>{
  "tool": "promptmcp.learn",
  "parameters": {
    "pattern": "JWT token validation middleware",
    "context": "Express.js API authentication",
    "category": "authentication"
  }
}</code>
    </div>
  `;
}

function generatePipelineGuidePage() {
  return `
    <h1>Pipeline Guide</h1>
    <p>Understanding the Dynamic Pipeline Engine that powers all PromptMCP tools.</p>
    
    <h2>What is the Dynamic Pipeline?</h2>
    <p>The Dynamic Pipeline Engine is the invisible brain of PromptMCP. It processes every request through a series of intelligent stages, each adding context and value to your request.</p>
    
    <h2>Pipeline Stages</h2>
    <div class="feature-grid">
        <div class="feature-card">
            <h3>📋 Retrieve.AgentsMD</h3>
            <p>Reads your project's AGENTS.md file to understand your coding guidelines and preferences.</p>
        </div>
        <div class="feature-card">
            <h3>🔍 Detect.RepoFacts</h3>
            <p>Analyzes your repository structure to understand the project type, framework, and dependencies.</p>
        </div>
        <div class="feature-card">
            <h3>📚 Retrieve.Context7</h3>
            <p>Fetches relevant documentation from Context7's cached library of frameworks and tools.</p>
        </div>
        <div class="feature-card">
            <h3>🧠 Retrieve.RAG</h3>
            <p>Searches your project's vector database for relevant code patterns, ADRs, and design decisions.</p>
        </div>
        <div class="feature-card">
            <h3>📖 Read.Snippet</h3>
            <p>Reads and analyzes the specific code files you're working with.</p>
        </div>
        <div class="feature-card">
            <h3>🤔 Reason.Plan</h3>
            <p>Creates an execution plan based on all the gathered context and your request.</p>
        </div>
        <div class="feature-card">
            <h3>✏️ Edit</h3>
            <p>Executes the planned changes to your code files.</p>
        </div>
        <div class="feature-card">
            <h3>✅ Validate</h3>
            <p>Validates the changes to ensure they meet quality standards and don't introduce errors.</p>
        </div>
        <div class="feature-card">
            <h3>🚪 Gate</h3>
            <p>Enforces policies and security checks before finalizing changes.</p>
        </div>
        <div class="feature-card">
            <h3>📝 Document</h3>
            <p>Generates documentation about the changes made.</p>
        </div>
        <div class="feature-card">
            <h3>🎓 Learn</h3>
            <p>Captures lessons learned and patterns for future use.</p>
        </div>
    </div>
    
    <h2>How It Works</h2>
    <ol>
        <li><strong>Request Received</strong> - You make a request through one of the 4 tools</li>
        <li><strong>Context Gathering</strong> - Pipeline gathers context from multiple sources</li>
        <li><strong>Analysis & Planning</strong> - AI analyzes the context and creates a plan</li>
        <li><strong>Execution</strong> - Changes are made to your code</li>
        <li><strong>Validation</strong> - Quality checks and policy enforcement</li>
        <li><strong>Learning</strong> - Patterns are captured for future use</li>
    </ol>
    
    <h2>Benefits</h2>
    <ul>
        <li><strong>Context-Aware</strong> - Every request understands your project and preferences</li>
        <li><strong>Quality Assured</strong> - Built-in validation and policy enforcement</li>
        <li><strong>Learning System</strong> - Gets smarter with every interaction</li>
        <li><strong>Transparent</strong> - You can see exactly what the pipeline is doing</li>
    </ul>
  `;
}

function generateAdminConsolePage() {
  return `
    <h1>Admin Console</h1>
    <p>Monitor, debug, and manage your PromptMCP instance through the web-based admin console.</p>
    
    <h2>Accessing the Admin Console</h2>
    <p>The admin console is available at <span class="highlight">http://localhost:3001</span> when enabled.</p>
    
    <div class="example-box">
        <h4>Enable Admin Console</h4>
        <p>Add this to your <span class="highlight">promptmcp.config.json</span>:</p>
        <div class="code-block">
            <code>{
  "admin": {
    "enabled": true,
    "port": 3001,
    "auth": {
      "username": "admin",
      "password": "your-secure-password"
    }
  }
}</code>
        </div>
    </div>
    
    <h2>Console Features</h2>
    <div class="feature-grid">
        <div class="feature-card">
            <h3>📊 System Metrics</h3>
            <p>Monitor CPU usage, memory consumption, and performance metrics.</p>
        </div>
        <div class="feature-card">
            <h3>🔧 Service Health</h3>
            <p>Check the health status of all PromptMCP services and dependencies.</p>
        </div>
        <div class="feature-card">
            <h3>📝 Logs & Debugging</h3>
            <p>View real-time logs and debug information for troubleshooting.</p>
        </div>
        <div class="feature-card">
            <h3>🎯 Tool Statistics</h3>
            <p>See usage statistics for each of the 4 core tools.</p>
        </div>
        <div class="feature-card">
            <h3>💾 Cache Management</h3>
            <p>Monitor cache performance and manage cached content.</p>
        </div>
        <div class="feature-card">
            <h3>🧠 Learning Analytics</h3>
            <p>View insights from the lessons learned system.</p>
        </div>
    </div>
    
    <h2>API Endpoints</h2>
    <p>The admin console exposes several API endpoints for programmatic access:</p>
    
    <ul>
        <li><strong>GET /api/health</strong> - System health check</li>
        <li><strong>GET /api/metrics</strong> - Performance metrics</li>
        <li><strong>GET /api/services</strong> - Service status</li>
        <li><strong>GET /api/cache</strong> - Cache statistics</li>
        <li><strong>GET /api/logs</strong> - System logs</li>
        <li><strong>GET /api/tools</strong> - Tool usage statistics</li>
        <li><strong>GET /api/analytics</strong> - Learning analytics</li>
        <li><strong>GET /api/lessons</strong> - Lessons learned data</li>
        <li><strong>GET /api/learning</strong> - Learning metrics</li>
    </ul>
    
    <h2>Security</h2>
    <p>The admin console includes several security features:</p>
    <ul>
        <li><strong>Authentication</strong> - Username/password protection</li>
        <li><strong>HTTPS Support</strong> - Secure communication</li>
        <li><strong>Access Logging</strong> - Track who accesses the console</li>
        <li><strong>Rate Limiting</strong> - Prevent abuse</li>
    </ul>
  `;
}

function generateTroubleshootingPage() {
  return `
    <h1>Troubleshooting</h1>
    <p>Common issues and their solutions when using PromptMCP.</p>
    
    <h2>Installation Issues</h2>
    
    <div class="example-box">
        <h4>Docker Container Won't Start</h4>
        <p><strong>Symptoms:</strong> Container exits immediately or fails to start</p>
        <p><strong>Solutions:</strong></p>
        <ul>
            <li>Check Docker is running: <span class="highlight">docker info</span></li>
            <li>Verify port 3000 is available: <span class="highlight">netstat -an | grep 3000</span></li>
            <li>Check container logs: <span class="highlight">docker logs &lt;container-id&gt;</span></li>
        </ul>
    </div>
    
    <div class="example-box">
        <h4>Context7 Configuration Issues</h4>
        <p><strong>Symptoms:</strong> "Failed to connect to Context7" errors</p>
        <p><strong>Solutions:</strong></p>
        <ul>
            <li>Verify your Context7 API key is correct</li>
            <li>Check internet connectivity</li>
            <li>Ensure Context7 service is available</li>
        </ul>
    </div>
    
    <h2>Performance Issues</h2>
    
    <div class="example-box">
        <h4>Slow Response Times</h4>
        <p><strong>Symptoms:</strong> Requests take longer than expected</p>
        <p><strong>Solutions:</strong></p>
        <ul>
            <li>Check system resources: <span class="highlight">docker stats</span></li>
            <li>Monitor vector database performance</li>
            <li>Clear cache if it's too large</li>
            <li>Restart the container</li>
        </ul>
    </div>
    
    <div class="example-box">
        <h4>High Memory Usage</h4>
        <p><strong>Symptoms:</strong> Container uses excessive memory</p>
        <p><strong>Solutions:</strong></p>
        <ul>
            <li>Reduce cache size in configuration</li>
            <li>Limit vector database memory usage</li>
            <li>Restart container periodically</li>
        </ul>
    </div>
    
    <h2>Tool-Specific Issues</h2>
    
    <div class="example-box">
        <h4>Create Tool Not Working</h4>
        <p><strong>Symptoms:</strong> Files not being created or created incorrectly</p>
        <p><strong>Solutions:</strong></p>
        <ul>
            <li>Check file permissions in mounted volume</li>
            <li>Verify target directory exists</li>
            <li>Check for conflicting files</li>
        </ul>
    </div>
    
    <div class="example-box">
        <h4>Analyze Tool Returns Empty Results</h4>
        <p><strong>Symptoms:</strong> Analysis returns no insights</p>
        <p><strong>Solutions:</strong></p>
        <ul>
            <li>Verify target path exists and is readable</li>
            <li>Check if files contain valid code</li>
            <li>Ensure proper file extensions</li>
        </ul>
    </div>
    
    <h2>Getting Help</h2>
    <p>If you're still experiencing issues:</p>
    <ul>
        <li>Check the <a href="admin-console.html">Admin Console</a> for detailed logs</li>
        <li>Enable debug mode in your configuration</li>
        <li>Collect system information and error logs</li>
        <li>Create an issue on the project repository</li>
    </ul>
    
    <h2>Debug Mode</h2>
    <p>Enable debug mode for more detailed logging:</p>
    <div class="code-block">
        <code>{
  "debug": {
    "enabled": true,
    "level": "verbose",
    "logFile": "promptmcp-debug.log"
  }
}</code>
    </div>
  `;
}

// Run the generator
generateSimpleUserGuide().catch(error => {
  console.error('❌ Failed to generate user guide:', error);
  process.exit(1);
});
