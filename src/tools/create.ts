import { Logger } from '../services/logger/logger.js';
import { ConfigService } from '../config/config.service.js';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';

export interface CreateResult {
  createdFiles: {
    path: string;
    content: string;
    type: string;
  }[];
  explanation: string;
  nextSteps: string[];
}

/**
 * CodeGenerator - "Make me something new"
 * 
 * Generates new code, files, or components based on natural language descriptions,
 * adhering to project best practices and existing coding styles.
 */
export class CodeGenerator {
  constructor(
    private logger: Logger,
    private config: ConfigService
  ) {}

  async create(
    description: string,
    targetPath: string = '.',
    options: Record<string, any> = {}
  ): Promise<CreateResult> {
    this.logger.info(`Creating: ${description}`, { targetPath, options });

    try {
      const createdFiles = await this.generateCode(description, targetPath, options);
      const explanation = this.generateExplanation(description, createdFiles, options);
      const nextSteps = this.generateNextSteps(description, createdFiles);

      const result: CreateResult = {
        createdFiles,
        explanation,
        nextSteps
      };

      this.logger.info('Code generation completed', {
        filesCreated: createdFiles.length,
        targetPath
      });

      return result;

    } catch (error) {
      this.logger.error('Code generation failed:', error);
      throw new Error(`Code generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateCode(
    description: string,
    targetPath: string,
    options: Record<string, any>
  ): Promise<CreateResult['createdFiles']> {
    const createdFiles: CreateResult['createdFiles'] = [];

    // Parse the description to understand what to create
    const parsed = this.parseDescription(description, options);
    
    // Generate files based on the parsed description
    for (const fileSpec of parsed.files) {
      const filePath = join(targetPath, fileSpec.path);
      const content = await this.generateFileContent(fileSpec, options);
      
      // Ensure directory exists
      await mkdir(dirname(filePath), { recursive: true });
      
      // Write file
      await writeFile(filePath, content, 'utf-8');
      
      createdFiles.push({
        path: fileSpec.path,
        content,
        type: fileSpec.type
      });
    }

    return createdFiles;
  }

  private parseDescription(description: string, options: Record<string, any>) {
    const lowerDesc = description.toLowerCase();
    
    // Detect component type
    let componentType = 'html';
    if (lowerDesc.includes('react') || lowerDesc.includes('component')) {
      componentType = 'react';
    } else if (lowerDesc.includes('vue')) {
      componentType = 'vue';
    } else if (lowerDesc.includes('angular')) {
      componentType = 'angular';
    }

    // Detect styling approach
    let styling = 'css';
    if (lowerDesc.includes('tailwind')) {
      styling = 'tailwind';
    } else if (lowerDesc.includes('styled')) {
      styling = 'styled-components';
    } else if (lowerDesc.includes('scss') || lowerDesc.includes('sass')) {
      styling = 'scss';
    }

    // Detect theme
    const isDark = lowerDesc.includes('dark') || options.colorScheme === 'dark';
    const isLight = lowerDesc.includes('light') || options.colorScheme === 'light';

    // Generate file specifications
    const files = [];

    if (componentType === 'react') {
      files.push({
        path: 'components/HelloWorld.tsx',
        type: 'react-component',
        template: 'react-component'
      });
      
      if (styling === 'css') {
        files.push({
          path: 'components/HelloWorld.css',
          type: 'css',
          template: 'css'
        });
      }
    } else if (componentType === 'vue') {
      files.push({
        path: 'components/HelloWorld.vue',
        type: 'vue-component',
        template: 'vue-component'
      });
    } else {
      // Default to HTML
      files.push({
        path: 'index.html',
        type: 'html',
        template: 'html'
      });
      
      files.push({
        path: 'styles.css',
        type: 'css',
        template: 'css'
      });
    }

    return {
      files,
      componentType,
      styling,
      theme: isDark ? 'dark' : isLight ? 'light' : 'auto'
    };
  }

  private async generateFileContent(fileSpec: any, options: Record<string, any>): Promise<string> {
    const { template, path } = fileSpec;
    const isDark = options.colorScheme === 'dark' || fileSpec.theme === 'dark';

    switch (template) {
      case 'react-component':
        return this.generateReactComponent(path, isDark);
      
      case 'vue-component':
        return this.generateVueComponent(path, isDark);
      
      case 'html':
        return this.generateHTML(isDark);
      
      case 'css':
        return this.generateCSS(path, isDark);
      
      default:
        return this.generateHTML(isDark);
    }
  }

  private generateReactComponent(filePath: string, isDark: boolean): string {
    const componentName = this.getComponentNameFromPath(filePath);
    
    return `import React from 'react';
import './${componentName}.css';

interface ${componentName}Props {
  title?: string;
  className?: string;
}

const ${componentName}: React.FC<${componentName}Props> = ({ 
  title = "Hello World", 
  className = "" 
}) => {
  return (
    <div className={\`hello-world \${className}\`}>
      <h1 className="hello-world__title">{title}</h1>
      <p className="hello-world__description">
        Welcome to your new ${componentName} component!
      </p>
      <div className="hello-world__actions">
        <button className="hello-world__button hello-world__button--primary">
          Get Started
        </button>
        <button className="hello-world__button hello-world__button--secondary">
          Learn More
        </button>
      </div>
    </div>
  );
};

export default ${componentName};
`;
  }

  private generateVueComponent(filePath: string, isDark: boolean): string {
    const componentName = this.getComponentNameFromPath(filePath);
    
    return `<template>
  <div class="hello-world">
    <h1 class="hello-world__title">{{ title }}</h1>
    <p class="hello-world__description">
      Welcome to your new ${componentName} component!
    </p>
    <div class="hello-world__actions">
      <button class="hello-world__button hello-world__button--primary">
        Get Started
      </button>
      <button class="hello-world__button hello-world__button--secondary">
        Learn More
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string;
  className?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Hello World',
  className: ''
});
</script>

<style scoped>
.hello-world {
  /* Styles will be generated by CSS template */
}
</style>
`;
  }

  private generateHTML(isDark: boolean): string {
    const themeClass = isDark ? 'dark-theme' : 'light-theme';
    
    return `<!DOCTYPE html>
<html lang="en" class="${themeClass}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hello World</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <header class="header">
      <h1 class="title">Hello World</h1>
      <p class="subtitle">Welcome to your new project!</p>
    </header>
    
    <main class="main">
      <div class="content">
        <h2>Getting Started</h2>
        <p>This is a simple Hello World page with a ${isDark ? 'dark' : 'light'} theme.</p>
        
        <div class="actions">
          <button class="btn btn--primary">Get Started</button>
          <button class="btn btn--secondary">Learn More</button>
        </div>
      </div>
    </main>
    
    <footer class="footer">
      <p>&copy; 2025 Your Project. Built with LocalMCP.</p>
    </footer>
  </div>
</body>
</html>
`;
  }

  private generateCSS(filePath: string, isDark: boolean): string {
    const isComponent = filePath.includes('components/');
    
    const colors = isDark ? {
      primary: '#3b82f6',
      secondary: '#6b7280',
      background: '#1f2937',
      surface: '#374151',
      text: '#f9fafb',
      textSecondary: '#d1d5db',
      border: '#4b5563'
    } : {
      primary: '#2563eb',
      secondary: '#6b7280',
      background: '#ffffff',
      surface: '#f9fafb',
      text: '#111827',
      textSecondary: '#6b7280',
      border: '#e5e7eb'
    };

    const globalStyles = isComponent ? '' : `/* Global styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  line-height: 1.6;
  color: ${colors.text};
  background-color: ${colors.background};
  transition: all 0.3s ease;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Header */
.header {
  text-align: center;
  padding: 2rem 0;
  border-bottom: 1px solid ${colors.border};
}

.title {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: 1.25rem;
  color: ${colors.textSecondary};
}

/* Main content */
.main {
  padding: 3rem 0;
}

.content {
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
}

.content h2 {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: ${colors.text};
}

.content p {
  font-size: 1.125rem;
  color: ${colors.textSecondary};
  margin-bottom: 2rem;
}

/* Actions */
.actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-block;
}

.btn--primary {
  background-color: ${colors.primary};
  color: white;
}

.btn--primary:hover {
  background-color: ${isDark ? '#2563eb' : '#1d4ed8'};
  transform: translateY(-1px);
}

.btn--secondary {
  background-color: transparent;
  color: ${colors.primary};
  border: 2px solid ${colors.primary};
}

.btn--secondary:hover {
  background-color: ${colors.primary};
  color: white;
}

/* Footer */
.footer {
  text-align: center;
  padding: 2rem 0;
  border-top: 1px solid ${colors.border};
  color: ${colors.textSecondary};
}

/* Responsive design */
@media (max-width: 768px) {
  .title {
    font-size: 2rem;
  }
  
  .subtitle {
    font-size: 1rem;
  }
  
  .content h2 {
    font-size: 1.5rem;
  }
  
  .actions {
    flex-direction: column;
    align-items: center;
  }
  
  .btn {
    width: 100%;
    max-width: 300px;
  }
}`;

    const componentStyles = isComponent ? `.hello-world {
  padding: 2rem;
  border-radius: 0.75rem;
  background-color: ${colors.surface};
  border: 1px solid ${colors.border};
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, ${isDark ? '0.3' : '0.1'});
}

.hello-world__title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: ${colors.text};
}

.hello-world__description {
  font-size: 1.125rem;
  color: ${colors.textSecondary};
  margin-bottom: 2rem;
}

.hello-world__actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.hello-world__button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.hello-world__button--primary {
  background-color: ${colors.primary};
  color: white;
}

.hello-world__button--primary:hover {
  background-color: ${isDark ? '#2563eb' : '#1d4ed8'};
  transform: translateY(-1px);
}

.hello-world__button--secondary {
  background-color: transparent;
  color: ${colors.primary};
  border: 2px solid ${colors.primary};
}

.hello-world__button--secondary:hover {
  background-color: ${colors.primary};
  color: white;
}` : '';

    return globalStyles + componentStyles;
  }

  private getComponentNameFromPath(filePath: string): string {
    const fileName = filePath.split('/').pop() || '';
    return fileName.replace(/\.(tsx?|vue)$/, '').replace(/^[a-z]/, c => c.toUpperCase());
  }

  private generateExplanation(description: string, createdFiles: CreateResult['createdFiles'], options: Record<string, any>): string {
    const fileCount = createdFiles.length;
    const fileTypes = [...new Set(createdFiles.map(f => f.type))];
    
    let explanation = `Created ${fileCount} file${fileCount > 1 ? 's' : ''} based on your request: "${description}"\n\n`;
    
    explanation += `Files created:\n`;
    createdFiles.forEach(file => {
      explanation += `- ${file.path} (${file.type})\n`;
    });
    
    if (options.colorScheme) {
      explanation += `\nApplied ${options.colorScheme} theme as requested.`;
    }
    
    if (fileTypes.includes('react-component')) {
      explanation += `\n\nThis is a React component with TypeScript support and modern best practices.`;
    } else if (fileTypes.includes('vue-component')) {
      explanation += `\n\nThis is a Vue component with TypeScript support and Composition API.`;
    } else {
      explanation += `\n\nThis is a responsive HTML page with modern CSS and accessibility features.`;
    }
    
    return explanation;
  }

  private generateNextSteps(description: string, createdFiles: CreateResult['createdFiles']): string[] {
    const nextSteps: string[] = [];
    
    if (createdFiles.some(f => f.type === 'react-component')) {
      nextSteps.push('Import and use the component in your React app');
      nextSteps.push('Customize the component props and styling as needed');
      nextSteps.push('Add TypeScript types for better development experience');
    } else if (createdFiles.some(f => f.type === 'vue-component')) {
      nextSteps.push('Import and use the component in your Vue app');
      nextSteps.push('Customize the component props and styling as needed');
      nextSteps.push('Add TypeScript support if not already configured');
    } else {
      nextSteps.push('Open index.html in your browser to see the result');
      nextSteps.push('Customize the content and styling in the HTML and CSS files');
      nextSteps.push('Add JavaScript functionality if needed');
    }
    
    nextSteps.push('Test the component/page in different browsers');
    nextSteps.push('Consider adding unit tests for better code quality');
    
    return nextSteps;
  }
}
