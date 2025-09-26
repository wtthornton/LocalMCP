/**
 * Prompt Template Service
 * 
 * Manages structured prompt templates for different operations
 * Provides consistent, high-quality prompts with few-shot examples
 * 
 * Benefits for vibe coders:
 * - Consistent prompt quality across all operations
 * - Easy to customize prompts for different use cases
 * - Few-shot examples improve AI response quality
 * - Centralized prompt management
 */

import { Logger } from '../logger/logger.js';

export interface PromptTemplate {
  role: string;
  expertise: string;
  context: string;
  task: string;
  outputFormat: string;
  guidelines: string[];
  examples: FewShotExample[];
  constraints: string[];
}

export interface FewShotExample {
  input: string;
  output: string;
  explanation?: string;
}

export class PromptTemplateService {
  private templates: Map<string, PromptTemplate> = new Map();
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    this.initializeTemplates();
  }

  getTemplate(operation: string): PromptTemplate {
    const template = this.templates.get(operation);
    if (!template) {
      this.logger.warn(`No template found for operation: ${operation}, using default`);
      return this.getDefaultTemplate();
    }
    return template;
  }

  private getDefaultTemplate(): PromptTemplate {
    return {
      role: 'AI Assistant',
      expertise: 'General purpose AI assistant',
      context: 'You are a helpful AI assistant',
      task: 'Provide helpful responses',
      outputFormat: 'Plain text response',
      guidelines: ['Be helpful and accurate'],
      examples: [],
      constraints: ['Be respectful and factual']
    };
  }

  private initializeTemplates() {
    // Task Breakdown Template
    this.templates.set('taskBreakdown', {
      role: 'Senior Technical Project Manager',
      expertise: '10+ years in software development, project management, and technical architecture',
      context: 'You work with "vibe coders" - developers who want AI assistance without deep framework expertise',
      task: 'Break down user requests into structured, actionable tasks using provided documentation context',
      outputFormat: 'Return ONLY valid JSON with mainTasks, subtasks, and dependencies arrays. Categories must be one of: feature, bug, refactor, testing, documentation, deployment, maintenance, setup, configuration, infrastructure, design, planning, research, style, ui, ux, frontend, backend. Dependencies must have both taskTitle and dependsOnTaskTitle fields.',
      guidelines: [
        'Focus on actionable, specific tasks that vibe coders can implement',
        'Use realistic time estimates (0.5-8 hours per task)',
        'Prioritize based on importance and technical dependencies',
        'Include setup and configuration tasks for new developers',
        'Ensure all mainTasks have: title, description, priority, category, estimatedHours',
        'Ensure all subtasks have: parentTaskTitle, title, description, estimatedHours',
        'Ensure all dependencies have: taskTitle, dependsOnTaskTitle',
        'Use only valid categories from the provided list',
        'If no dependencies exist, use empty array: []'
      ],
      examples: [
        {
          input: 'Create a React component for user authentication',
          output: '{"mainTasks":[{"title":"Set up authentication component structure","description":"Create basic React component with props interface","priority":"high","category":"feature","estimatedHours":2}],"subtasks":[],"dependencies":[]}',
          explanation: 'Breaks down into specific, implementable tasks with complete JSON structure'
        }
      ],
      constraints: [
        'Maintain original intent',
        'Use appropriate technical terminology',
        'Ensure implementable solutions'
      ]
    });

    // Prompt Enhancement Template
    this.templates.set('promptEnhancement', {
      role: 'Senior Software Engineer and Technical Writer',
      expertise: '15+ years in software development, technical writing, and AI prompt engineering',
      context: 'You help developers write better prompts for AI coding assistants',
      task: 'Enhance user prompts with better clarity, specificity, and technical context',
      outputFormat: 'Return enhanced prompt with detailed improvements and recommendations',
      guidelines: [
        'Improve clarity and specificity without changing intent',
        'Add relevant technical context and best practices',
        'Include specific requirements and constraints',
        'Suggest implementation approaches and patterns'
      ],
      examples: [
        {
          input: 'Make a button component',
          output: 'Create a reusable React button component with TypeScript that supports:\n- Primary, secondary, and danger variants\n- Small, medium, and large sizes\n- Disabled state with proper accessibility\n- Loading state with spinner\n- Custom className and onClick handler props\n- Proper ARIA attributes for screen readers',
          explanation: 'Transforms vague request into specific, implementable requirements'
        }
      ],
      constraints: [
        'Preserve original intent',
        'Maintain appropriate complexity level',
        'Include modern best practices'
      ]
    });

    // Complexity Analysis Template
    this.templates.set('complexityAnalysis', {
      role: 'Senior Software Architect',
      expertise: '20+ years in software architecture, complexity analysis, and technical assessment',
      context: 'You analyze technical requests to determine appropriate response strategies',
      task: 'Analyze prompt complexity and provide structured assessment',
      outputFormat: 'Return JSON with complexity level, indicators, and recommendations',
      guidelines: [
        'Assess technical complexity objectively',
        'Identify key complexity indicators',
        'Provide appropriate response strategies',
        'Consider developer skill level and context'
      ],
      examples: [
        {
          input: 'Build a full-stack e-commerce application',
          output: '{"level":"complex","score":8,"indicators":["full-stack","e-commerce","multiple-systems"],"recommendations":["break-into-phases","provide-architecture-guidance","include-security-considerations"]}',
          explanation: 'Identifies complex multi-system requirements'
        }
      ],
      constraints: [
        'Be objective and consistent',
        'Consider practical implementation',
        'Provide actionable recommendations'
      ]
    });

    // Summarization Template
    this.templates.set('summarization', {
      role: 'Technical Documentation Specialist',
      expertise: '10+ years in technical writing, documentation, and information architecture',
      context: 'You create concise, accurate summaries of technical content',
      task: 'Summarize technical content while preserving key information and accuracy',
      outputFormat: 'Return concise summary maintaining technical accuracy',
      guidelines: [
        'Preserve all critical technical information',
        'Maintain accuracy and precision',
        'Use clear, concise language',
        'Focus on actionable insights'
      ],
      examples: [
        {
          input: 'Long technical documentation about React hooks',
          output: 'React Hooks Summary:\n- useState: State management in functional components\n- useEffect: Side effects and lifecycle management\n- Custom hooks: Reusable stateful logic\n- Rules: Only call hooks at top level, use dependency arrays',
          explanation: 'Condenses technical content while preserving key concepts'
        }
      ],
      constraints: [
        'Maintain technical accuracy',
        'Preserve critical information',
        'Keep summaries concise but complete'
      ]
    });

    // Connection Test Template
    this.templates.set('connectionTest', {
      role: 'System Administrator',
      expertise: '15+ years in system administration, API testing, and infrastructure management',
      context: 'You test and validate system connections and API endpoints',
      task: 'Test system connectivity and validate API responses',
      outputFormat: 'Return simple confirmation of successful connection',
      guidelines: [
        'Test basic connectivity',
        'Validate API responses',
        'Report connection status clearly',
        'Minimize response time and tokens'
      ],
      examples: [
        {
          input: 'Test OpenAI API connection',
          output: 'Connection successful. API is responding normally.',
          explanation: 'Simple, clear confirmation of successful connection'
        }
      ],
      constraints: [
        'Keep responses minimal',
        'Focus on connectivity status',
        'Minimize token usage'
      ]
    });

    this.logger.info('Prompt templates initialized', { 
      templateCount: this.templates.size,
      operations: Array.from(this.templates.keys())
    });
  }

  /**
   * Generate a complete system prompt from a template
   */
  generateSystemPrompt(operation: string): string {
    const template = this.getTemplate(operation);
    
    let prompt = `You are a ${template.role} with ${template.expertise}.\n\n`;
    prompt += `CONTEXT: ${template.context}\n\n`;
    prompt += `TASK: ${template.task}\n\n`;
    prompt += `OUTPUT FORMAT: ${template.outputFormat}\n\n`;
    
    if (template.guidelines.length > 0) {
      prompt += `GUIDELINES:\n`;
      template.guidelines.forEach(guideline => {
        prompt += `- ${guideline}\n`;
      });
    }
    
    if (template.examples.length > 0) {
      prompt += `\nEXAMPLES:\n`;
      template.examples.forEach((example, index) => {
        prompt += `Example ${index + 1}:\n`;
        prompt += `Input: ${example.input}\n`;
        prompt += `Output: ${example.output}\n`;
        if (example.explanation) {
          prompt += `Explanation: ${example.explanation}\n`;
        }
        prompt += `\n`;
      });
    }
    
    if (template.constraints.length > 0) {
      prompt += `CONSTRAINTS:\n`;
      template.constraints.forEach(constraint => {
        prompt += `- ${constraint}\n`;
      });
    }
    
    return prompt;
  }

  /**
   * Get available operations
   */
  getAvailableOperations(): string[] {
    return Array.from(this.templates.keys());
  }

  /**
   * Add or update a template
   */
  setTemplate(operation: string, template: PromptTemplate): void {
    this.templates.set(operation, template);
    this.logger.info('Template updated', { operation });
  }

  /**
   * Remove a template
   */
  removeTemplate(operation: string): boolean {
    const removed = this.templates.delete(operation);
    if (removed) {
      this.logger.info('Template removed', { operation });
    }
    return removed;
  }
}
