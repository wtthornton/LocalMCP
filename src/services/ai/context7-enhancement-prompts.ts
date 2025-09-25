/**
 * Context7 Enhancement Prompts Service
 * 
 * Provides specialized prompts for enhancing Context7 documentation
 * with OpenAI. Includes framework-specific, quality-focused, and
 * project-aware enhancement strategies.
 * 
 * Benefits for vibe coders:
 * - Framework-specific documentation enhancement
 * - Quality-focused improvements (accessibility, performance, security)
 * - Project-aware adaptations
 * - Consistent enhancement patterns
 */

export interface Context7EnhancementPrompt {
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
  temperature: number;
}

export class Context7EnhancementPrompts {
  
  /**
   * Select the appropriate enhancement prompt based on strategy and context
   */
  selectContext7EnhancementPrompt(
    strategy: 'general' | 'framework-specific' | 'quality-focused' | 'project-aware',
    framework?: string,
    qualityFocus?: string[],
    projectType?: string
  ): Context7EnhancementPrompt {
    
    switch (strategy) {
      case 'framework-specific':
        return this.getFrameworkSpecificPrompt(framework);
      
      case 'quality-focused':
        return this.getQualityFocusedPrompt(qualityFocus);
      
      case 'project-aware':
        return this.getProjectAwarePrompt(projectType);
      
      case 'general':
      default:
        return this.getGeneralPrompt();
    }
  }

  /**
   * General Context7 enhancement prompt
   */
  private getGeneralPrompt(): Context7EnhancementPrompt {
    return {
      systemPrompt: `You are an expert developer assistant specializing in enhancing technical documentation. Your task is to transform raw Context7 documentation into clear, actionable, and well-structured guidance that helps developers implement features effectively.

Key Enhancement Guidelines:
- Make documentation more readable and scannable
- Add clear headings and structure
- Include practical code examples
- Explain the "why" behind recommendations
- Add implementation tips and best practices
- Use markdown formatting for better readability
- Keep technical accuracy while improving clarity

Output Format:
- Use clear headings (##, ###)
- Include code examples in appropriate language blocks
- Add bullet points for key concepts
- Provide step-by-step guidance where applicable
- Include warnings or important notes when relevant`,

      userPrompt: `Please enhance the following Context7 documentation to make it more actionable and developer-friendly. Focus on clarity, practical examples, and implementation guidance.

Context7 Documentation:
{originalDocs}

Enhanced Documentation:`,
      
      maxTokens: 2000,
      temperature: 0.7
    };
  }

  /**
   * Framework-specific enhancement prompt
   */
  private getFrameworkSpecificPrompt(framework?: string): Context7EnhancementPrompt {
    const frameworkGuidance = this.getFrameworkGuidance(framework);
    
    return {
      systemPrompt: `You are an expert ${framework || 'framework'} developer specializing in enhancing technical documentation. Your task is to transform raw Context7 documentation into ${framework || 'framework'}-specific, actionable guidance.

${frameworkGuidance}

Key Enhancement Guidelines:
- Focus on ${framework || 'framework'}-specific patterns and conventions
- Include ${framework || 'framework'}-specific code examples
- Reference ${framework || 'framework'} best practices
- Use ${framework || 'framework'} terminology and concepts
- Provide ${framework || 'framework'}-specific implementation tips
- Include ${framework || 'framework'} ecosystem considerations

Output Format:
- Use clear headings (##, ###)
- Include ${framework || 'framework'} code examples in appropriate language blocks
- Add bullet points for key concepts
- Provide step-by-step guidance where applicable
- Include ${framework || 'framework'}-specific warnings or notes`,

      userPrompt: `Please enhance the following Context7 documentation specifically for ${framework || 'framework'} development. Make it actionable and follow ${framework || 'framework'} best practices.

Context7 Documentation:
{originalDocs}

Enhanced ${framework || 'Framework'} Documentation:`,
      
      maxTokens: 2500,
      temperature: 0.6
    };
  }

  /**
   * Quality-focused enhancement prompt
   */
  private getQualityFocusedPrompt(qualityFocus?: string[]): Context7EnhancementPrompt {
    const qualityGuidance = this.getQualityGuidance(qualityFocus);
    
    return {
      systemPrompt: `You are an expert developer specializing in ${qualityFocus?.join(', ') || 'code quality'}. Your task is to enhance Context7 documentation with a focus on ${qualityFocus?.join(', ') || 'quality'} considerations.

${qualityGuidance}

Key Enhancement Guidelines:
- Emphasize ${qualityFocus?.join(', ') || 'quality'} best practices
- Include ${qualityFocus?.join(', ') || 'quality'}-focused code examples
- Add ${qualityFocus?.join(', ') || 'quality'} checklists or guidelines
- Highlight potential ${qualityFocus?.join(', ') || 'quality'} issues
- Provide ${qualityFocus?.join(', ') || 'quality'} optimization tips
- Include ${qualityFocus?.join(', ') || 'quality'} testing considerations

Output Format:
- Use clear headings (##, ###)
- Include quality-focused code examples
- Add quality checklists or guidelines
- Provide step-by-step quality implementation
- Include quality warnings or important notes`,

      userPrompt: `Please enhance the following Context7 documentation with a focus on ${qualityFocus?.join(', ') || 'code quality'}. Make it actionable and emphasize ${qualityFocus?.join(', ') || 'quality'} best practices.

Context7 Documentation:
{originalDocs}

Quality-Focused Enhanced Documentation:`,
      
      maxTokens: 2500,
      temperature: 0.6
    };
  }

  /**
   * Project-aware enhancement prompt
   */
  private getProjectAwarePrompt(projectType?: string): Context7EnhancementPrompt {
    const projectGuidance = this.getProjectGuidance(projectType);
    
    return {
      systemPrompt: `You are an expert developer specializing in ${projectType || 'software'} projects. Your task is to enhance Context7 documentation with ${projectType || 'project'}-specific considerations and best practices.

${projectGuidance}

Key Enhancement Guidelines:
- Focus on ${projectType || 'project'}-specific patterns and architecture
- Include ${projectType || 'project'}-specific code examples
- Reference ${projectType || 'project'} best practices and conventions
- Use ${projectType || 'project'} terminology and concepts
- Provide ${projectType || 'project'}-specific implementation guidance
- Include ${projectType || 'project'} ecosystem and tooling considerations

Output Format:
- Use clear headings (##, ###)
- Include ${projectType || 'project'}-specific code examples
- Add bullet points for key concepts
- Provide step-by-step ${projectType || 'project'} implementation
- Include ${projectType || 'project'}-specific warnings or notes`,

      userPrompt: `Please enhance the following Context7 documentation specifically for ${projectType || 'project'} development. Make it actionable and follow ${projectType || 'project'} best practices.

Context7 Documentation:
{originalDocs}

${projectType || 'Project'}-Specific Enhanced Documentation:`,
      
      maxTokens: 2500,
      temperature: 0.6
    };
  }

  /**
   * Get framework-specific guidance
   */
  private getFrameworkGuidance(framework?: string): string {
    const guidance: Record<string, string> = {
      'react': `
React-Specific Guidelines:
- Use functional components with hooks
- Follow React naming conventions (PascalCase for components)
- Include proper prop types and TypeScript interfaces
- Show proper state management patterns
- Include useEffect, useState, and custom hooks examples
- Reference React ecosystem tools (Create React App, Next.js, etc.)
- Include JSX syntax and React-specific patterns`,

      'vue': `
Vue-Specific Guidelines:
- Use Vue 3 Composition API patterns
- Follow Vue naming conventions (kebab-case for components)
- Include proper props and emits definitions
- Show reactive data and computed properties
- Include Vue ecosystem tools (Vite, Nuxt.js, etc.)
- Reference Vue-specific patterns and directives`,

      'angular': `
Angular-Specific Guidelines:
- Use Angular CLI and modern Angular patterns
- Follow Angular naming conventions (PascalCase for components)
- Include proper TypeScript interfaces and decorators
- Show dependency injection and services
- Include Angular ecosystem tools and modules
- Reference Angular-specific patterns and concepts`,

      'html': `
HTML-Specific Guidelines:
- Use semantic HTML elements
- Include proper accessibility attributes
- Show modern HTML5 features
- Include CSS integration examples
- Reference HTML best practices and standards
- Include responsive design considerations`,

      'node': `
Node.js-Specific Guidelines:
- Use modern ES6+ JavaScript features
- Follow Node.js conventions and patterns
- Include proper error handling
- Show async/await patterns
- Reference Node.js ecosystem (Express, npm, etc.)
- Include server-side specific considerations`
    };

    return guidance[framework?.toLowerCase() || ''] || `
${framework || 'Framework'}-Specific Guidelines:
- Use ${framework || 'framework'} conventions and patterns
- Include ${framework || 'framework'}-specific code examples
- Reference ${framework || 'framework'} best practices
- Show ${framework || 'framework'} ecosystem integration
- Include ${framework || 'framework'}-specific considerations`;
  }

  /**
   * Get quality-focused guidance
   */
  private getQualityGuidance(qualityFocus?: string[]): string {
    if (!qualityFocus || qualityFocus.length === 0) {
      return `
Quality Guidelines:
- Focus on code quality and maintainability
- Include proper error handling
- Show clean code principles
- Add performance considerations
- Include testing best practices`;
    }

    const guidance: Record<string, string> = {
      'accessibility': `
Accessibility Guidelines:
- Include ARIA attributes and semantic HTML
- Show keyboard navigation patterns
- Add screen reader considerations
- Include color contrast and visual accessibility
- Reference WCAG guidelines and standards
- Show accessibility testing approaches`,

      'performance': `
Performance Guidelines:
- Include performance optimization techniques
- Show lazy loading and code splitting
- Add caching strategies
- Include bundle size optimization
- Reference performance monitoring tools
- Show performance testing approaches`,

      'security': `
Security Guidelines:
- Include security best practices
- Show input validation and sanitization
- Add authentication and authorization patterns
- Include security headers and HTTPS
- Reference security testing approaches
- Show vulnerability prevention techniques`,

      'testing': `
Testing Guidelines:
- Include unit testing patterns
- Show integration testing approaches
- Add end-to-end testing strategies
- Include test-driven development practices
- Reference testing frameworks and tools
- Show testing best practices and patterns`
    };

    return qualityFocus.map(focus => guidance[focus.toLowerCase()] || `${focus} Guidelines: Focus on ${focus} best practices`).join('\n\n');
  }

  /**
   * Get project-aware guidance
   */
  private getProjectGuidance(projectType?: string): string {
    const guidance: Record<string, string> = {
      'frontend': `
Frontend Project Guidelines:
- Focus on user interface and user experience
- Include responsive design considerations
- Show component-based architecture
- Reference frontend build tools and bundlers
- Include browser compatibility considerations
- Show frontend performance optimization`,

      'backend': `
Backend Project Guidelines:
- Focus on API design and server-side logic
- Include database integration patterns
- Show authentication and authorization
- Reference backend frameworks and tools
- Include server performance considerations
- Show backend security best practices`,

      'fullstack': `
Fullstack Project Guidelines:
- Focus on end-to-end application development
- Include frontend-backend integration
- Show full-stack architecture patterns
- Reference full-stack frameworks and tools
- Include deployment and DevOps considerations
- Show full-stack testing strategies`,

      'library': `
Library Project Guidelines:
- Focus on reusable code and APIs
- Include proper documentation and examples
- Show versioning and compatibility
- Reference library development tools
- Include distribution and publishing considerations
- Show library testing and validation`,

      'mobile': `
Mobile Project Guidelines:
- Focus on mobile-specific patterns and considerations
- Include responsive design for mobile
- Show mobile performance optimization
- Reference mobile development frameworks
- Include mobile testing approaches
- Show mobile platform considerations`
    };

    return guidance[projectType?.toLowerCase() || ''] || `
${projectType || 'Project'} Guidelines:
- Focus on ${projectType || 'project'}-specific patterns and architecture
- Include ${projectType || 'project'} best practices
- Show ${projectType || 'project'}-specific implementation
- Reference ${projectType || 'project'} tools and ecosystem
- Include ${projectType || 'project'} considerations and constraints`;
  }
}
