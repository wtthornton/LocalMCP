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
   * Enhanced with 2024 best practices from web research and Context7 documentation
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
Accessibility Guidelines (WCAG 2.2 & 2024 Best Practices):
- Use semantic HTML elements (header, nav, main, section, article, aside, footer)
- Implement proper ARIA landmarks with aria-labelledby for unique identification
- Add ARIA attributes: role="img" for icons, aria-label for accessible names
- Ensure keyboard navigation with proper tab order and focus management
- Include screen reader support with descriptive text alternatives
- Maintain color contrast ratios: 4.5:1 for normal text, 3:1 for large text
- Use descriptive link text that clearly states purpose
- Implement proper form labels and field associations
- Add skip links for keyboard users to bypass navigation
- Test with actual screen readers and assistive technologies
- Follow WCAG 2.2 AA standards for compliance
- Use aria-current="page" for current navigation items
- Implement proper heading hierarchy (h1-h6) for content structure`,

      'performance': `
Performance Guidelines (Core Web Vitals & 2024 Optimization):
- Optimize Core Web Vitals: LCP <2.5s, FID <100ms, CLS <0.1, INP <200ms
- Implement lazy loading for images, components, and non-critical resources
- Use code splitting and dynamic imports for JavaScript bundles
- Minimize bundle size with tree shaking and dead code elimination
- Implement effective caching strategies (browser, CDN, service worker)
- Optimize images with modern formats (WebP, AVIF) and responsive sizing
- Use critical CSS inlining and defer non-critical stylesheets
- Implement resource hints (preload, prefetch, preconnect)
- Minimize render-blocking resources and third-party scripts
- Use performance monitoring tools (Lighthouse, PageSpeed Insights, WebPageTest)
- Implement service workers for offline functionality and caching
- Optimize database queries and API response times
- Use performance budgets to maintain speed standards`,

      'security': `
Security Guidelines (OWASP Top 10 & 2024 Security Best Practices):
- Implement input validation and sanitization for all user inputs
- Use parameterized queries to prevent SQL injection attacks
- Implement Content Security Policy (CSP) headers with nonce-based scripts
- Set secure HTTP headers: X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security
- Use secure cookie attributes: HttpOnly, Secure, SameSite=Strict
- Implement proper authentication with multi-factor authentication (MFA)
- Use HTTPS everywhere with proper SSL/TLS configuration
- Implement rate limiting and DDoS protection
- Validate and sanitize file uploads with type checking and virus scanning
- Use secure session management with proper timeout and regeneration
- Implement proper authorization checks for all protected resources
- Regular security audits and penetration testing
- Keep dependencies updated and scan for known vulnerabilities
- Implement secure coding practices and security code reviews`,

      'testing': `
Testing Guidelines (2024 Testing Best Practices & Modern Frameworks):
- Write unit tests with high coverage using modern testing frameworks
- Implement integration tests for API endpoints and component interactions
- Use end-to-end testing for critical user journeys and workflows
- Follow Test-Driven Development (TDD) and Behavior-Driven Development (BDD)
- Use testing libraries that focus on user behavior (Testing Library family)
- Implement visual regression testing for UI components
- Use mocking and stubbing for external dependencies and APIs
- Write accessible tests that query elements by accessible roles and labels
- Implement performance testing for load and stress scenarios
- Use continuous integration with automated test execution
- Write maintainable tests with clear naming and documentation
- Implement test data management and test environment isolation
- Use code coverage tools to identify untested code paths
- Write tests that are independent, repeatable, and fast`,

      'documentation': `
Documentation Guidelines (2024 Documentation Best Practices):
- Write clear, concise API documentation with examples
- Include code comments explaining complex business logic
- Maintain up-to-date README files with setup and usage instructions
- Document architectural decisions and design patterns used
- Include troubleshooting guides and common issue resolutions
- Use consistent formatting and style guides for documentation
- Include visual diagrams for complex system architectures
- Document security considerations and compliance requirements
- Maintain changelog files for version history and breaking changes
- Include performance benchmarks and optimization guidelines
- Document testing strategies and coverage requirements
- Use automated documentation generation where possible`,

      'maintainability': `
Maintainability Guidelines (2024 Code Quality Standards):
- Follow consistent coding standards and style guides
- Write self-documenting code with clear variable and function names
- Implement proper error handling and logging throughout the application
- Use design patterns appropriately to reduce code complexity
- Write modular, reusable code with single responsibility principle
- Implement proper configuration management and environment separation
- Use static analysis tools to catch potential issues early
- Write comprehensive unit tests for all business logic
- Implement proper logging and monitoring for production debugging
- Use dependency injection for better testability and flexibility
- Follow SOLID principles and clean code practices
- Implement proper version control with meaningful commit messages`,

      'scalability': `
Scalability Guidelines (2024 Scalability Best Practices):
- Design for horizontal scaling with stateless application architecture
- Implement proper caching strategies at multiple levels
- Use database optimization techniques (indexing, query optimization)
- Implement load balancing and auto-scaling capabilities
- Design microservices architecture for independent scaling
- Use message queues and event-driven architecture for decoupling
- Implement proper monitoring and alerting for performance metrics
- Design for eventual consistency where appropriate
- Use CDN for static asset delivery and global performance
- Implement proper database sharding and partitioning strategies
- Use containerization and orchestration for deployment flexibility
- Plan for capacity growth and performance bottlenecks`,

      'userExperience': `
User Experience Guidelines (2024 UX Best Practices):
- Design mobile-first responsive interfaces for all screen sizes
- Implement intuitive navigation with clear information architecture
- Use consistent design systems and component libraries
- Optimize for fast loading times and smooth interactions
- Implement proper loading states and error handling
- Design accessible interfaces following WCAG guidelines
- Use progressive enhancement for core functionality
- Implement proper feedback mechanisms for user actions
- Design for different user skill levels and accessibility needs
- Use analytics and user research to inform design decisions
- Implement proper form validation with helpful error messages
- Design for internationalization and localization support`
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
