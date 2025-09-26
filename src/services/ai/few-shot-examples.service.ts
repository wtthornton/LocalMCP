/**
 * Few-Shot Examples Service
 * 
 * Manages few-shot examples for different operations
 * Provides contextual examples to improve AI response quality
 * 
 * Benefits for vibe coders:
 * - Better AI responses through examples
 * - Consistent output formats
 * - Reduced need for prompt iteration
 * - Learning from successful patterns
 */

export interface FewShotExample {
  input: string;
  output: string;
  explanation?: string;
}

export class FewShotExamplesService {
  private examples: Map<string, FewShotExample[]> = new Map();

  constructor() {
    this.initializeExamples();
  }

  getExamples(operation: string): FewShotExample[] {
    return this.examples.get(operation) || [];
  }

  private initializeExamples() {
    // Task Breakdown Examples
    this.examples.set('taskBreakdown', [
      {
        input: 'Build a simple todo app with React',
        output: `{
          "mainTasks": [
            {
              "title": "Set up React project structure",
              "description": "Create new React app with TypeScript and install dependencies",
              "priority": "high",
              "category": "setup",
              "estimatedHours": 1
            },
            {
              "title": "Create Todo component",
              "description": "Build main Todo component with state management",
              "priority": "high", 
              "category": "feature",
              "estimatedHours": 3
            },
            {
              "title": "Add todo functionality",
              "description": "Implement add, edit, delete, and toggle complete functionality",
              "priority": "high",
              "category": "feature", 
              "estimatedHours": 4
            },
            {
              "title": "Style the application",
              "description": "Add CSS styling and responsive design",
              "priority": "medium",
              "category": "feature",
              "estimatedHours": 2
            }
          ],
          "subtasks": [
            {
              "parentTaskTitle": "Set up React project structure",
              "title": "Initialize React app",
              "description": "Run create-react-app with TypeScript template",
              "estimatedHours": 0.5
            },
            {
              "parentTaskTitle": "Set up React project structure", 
              "title": "Install additional dependencies",
              "description": "Install any required packages for state management",
              "estimatedHours": 0.5
            }
          ],
          "dependencies": [
            {
              "taskTitle": "Create Todo component",
              "dependsOnTaskTitle": "Set up React project structure"
            },
            {
              "taskTitle": "Add todo functionality",
              "dependsOnTaskTitle": "Create Todo component"
            }
          ]
        }`,
        explanation: 'Breaks down a simple React app into logical, implementable tasks with clear dependencies'
      },
      {
        input: 'Create a REST API with Node.js and Express',
        output: `{
          "mainTasks": [
            {
              "title": "Set up Node.js project",
              "description": "Initialize project with package.json and install Express",
              "priority": "high",
              "category": "setup",
              "estimatedHours": 1
            },
            {
              "title": "Create basic Express server",
              "description": "Set up Express app with basic middleware and routing",
              "priority": "high",
              "category": "feature",
              "estimatedHours": 2
            },
            {
              "title": "Implement CRUD endpoints",
              "description": "Create GET, POST, PUT, DELETE endpoints for main resource",
              "priority": "high",
              "category": "feature",
              "estimatedHours": 4
            },
            {
              "title": "Add error handling",
              "description": "Implement proper error handling and validation",
              "priority": "medium",
              "category": "feature",
              "estimatedHours": 2
            }
          ],
          "subtasks": [],
          "dependencies": [
            {
              "taskTitle": "Create basic Express server",
              "dependsOnTaskTitle": "Set up Node.js project"
            },
            {
              "taskTitle": "Implement CRUD endpoints",
              "dependsOnTaskTitle": "Create basic Express server"
            }
          ]
        }`,
        explanation: 'Structured approach to building a REST API with proper task sequencing'
      }
    ]);

    // Prompt Enhancement Examples
    this.examples.set('promptEnhancement', [
      {
        input: 'Make a button component',
        output: 'Create a reusable React button component with TypeScript that supports:\n- Primary, secondary, and danger variants\n- Small, medium, and large sizes\n- Disabled state with proper accessibility\n- Loading state with spinner\n- Custom className and onClick handler props\n- Proper ARIA attributes for screen readers\n- Storybook stories for documentation\n- Unit tests with React Testing Library',
        explanation: 'Transforms vague request into specific, implementable requirements with modern best practices'
      },
      {
        input: 'Fix this error',
        output: 'Debug and fix the TypeScript error: "Property \'data\' does not exist on type \'unknown\'" in my API response handler. Please provide:\n- Root cause analysis of the type error\n- Type-safe solution with proper TypeScript interfaces\n- Error handling for API failures\n- Unit tests to prevent regression\n- Best practices for API response typing',
        explanation: 'Adds context and specific requirements to make debugging more effective'
      }
    ]);

    // Complexity Analysis Examples
    this.examples.set('complexityAnalysis', [
      {
        input: 'Create a login form',
        output: '{"level":"simple","score":3,"indicators":["single-component","basic-validation","standard-pattern"],"recommendations":["provide-component-template","include-basic-validation","add-accessibility-features"]}',
        explanation: 'Simple component with standard patterns'
      },
      {
        input: 'Build a real-time chat application with WebSockets',
        output: '{"level":"complex","score":8,"indicators":["real-time","websockets","state-management","multiple-components"],"recommendations":["break-into-phases","provide-architecture-guidance","include-error-handling","consider-scalability"]}',
        explanation: 'Complex multi-system application requiring careful planning'
      }
    ]);

    // Summarization Examples
    this.examples.set('summarization', [
      {
        input: 'Long documentation about React hooks with detailed examples',
        output: 'React Hooks Summary:\n- useState: State management in functional components\n- useEffect: Side effects and lifecycle management\n- Custom hooks: Reusable stateful logic\n- Rules: Only call hooks at top level, use dependency arrays\n- Best practices: Extract custom hooks, avoid infinite loops',
        explanation: 'Condenses technical content while preserving key concepts and best practices'
      }
    ]);

    // Connection Test Examples
    this.examples.set('connectionTest', [
      {
        input: 'Test OpenAI API connection',
        output: 'Connection successful. API is responding normally.',
        explanation: 'Simple, clear confirmation of successful connection'
      }
    ]);
  }

  /**
   * Add examples for an operation
   */
  addExamples(operation: string, examples: FewShotExample[]): void {
    const existing = this.examples.get(operation) || [];
    this.examples.set(operation, [...existing, ...examples]);
  }

  /**
   * Get all available operations
   */
  getAvailableOperations(): string[] {
    return Array.from(this.examples.keys());
  }

  /**
   * Clear examples for an operation
   */
  clearExamples(operation: string): void {
    this.examples.delete(operation);
  }

  /**
   * Get example count for an operation
   */
  getExampleCount(operation: string): number {
    return this.examples.get(operation)?.length || 0;
  }
}
