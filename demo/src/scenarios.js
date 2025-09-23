/**
 * Demo Scenarios
 * 
 * This module defines the 3 real code generation scenarios for the demo:
 * 1. React Component - Button component with TypeScript + Tailwind
 * 2. API Endpoint - User registration with JWT auth
 * 3. Full Stack App - Todo app with React + Node.js
 */

class DemoScenarios {
  constructor() {
    this.scenarios = {
      'react-component': this.getReactComponentScenario(),
      'api-endpoint': this.getAPIEndpointScenario(),
      'full-stack-app': this.getFullStackAppScenario()
    };
  }

  /**
   * Get all available scenarios
   * @returns {Object} All scenarios
   */
  getAllScenarios() {
    return this.scenarios;
  }

  /**
   * Get a specific scenario by name
   * @param {string} scenarioName - Name of the scenario
   * @returns {Object} Scenario configuration
   */
  getScenario(scenarioName) {
    const scenario = this.scenarios[scenarioName];
    if (!scenario) {
      throw new Error(`Unknown scenario: ${scenarioName}`);
    }
    return scenario;
  }

  /**
   * Get scenario names
   * @returns {Array} Array of scenario names
   */
  getScenarioNames() {
    return Object.keys(this.scenarios);
  }

  /**
   * React Component Scenario
   * @returns {Object} React component scenario configuration
   */
  getReactComponentScenario() {
    return {
      name: 'react-component',
      title: 'React Component Generation',
      description: 'Generate a reusable Button component with TypeScript, Tailwind CSS, tests, and Storybook stories',
      type: 'component',
      complexity: 'medium',
      estimatedTime: '2-3 minutes',
      
      // Context requirements for LocalMCP
      contextRequirements: [
        'Project styling patterns and design system',
        'Component structure conventions',
        'TypeScript interface patterns',
        'Testing patterns and conventions',
        'Storybook documentation patterns',
        'Accessibility best practices',
        'Performance optimization patterns'
      ],
      
      // Expected files to be generated
      expectedFiles: {
        cursor: [
          'Button.tsx',
          'Button.css',
          'index.ts'
        ],
        localmcp: [
          'Button.tsx',
          'button-variants.ts',
          'Button.stories.tsx',
          'Button.test.tsx',
          'index.ts'
        ]
      },
      
      // Success criteria
      successCriteria: {
        minFiles: 3,
        maxFiles: 8,
        mustHaveTypes: true,
        mustHaveTests: true,
        mustHaveStories: false, // Optional for cursor-only
        mustHaveVariants: false, // Optional for cursor-only
        minLinesOfCode: 50,
        maxLinesOfCode: 300
      },
      
      // Context utilization expectations
      contextExpectations: {
        projectPatterns: 8, // Number of project patterns to use
        dependencies: 5, // Number of dependencies to reference
        conventions: 10, // Number of conventions to follow
        frameworks: 3, // Number of frameworks to utilize
        tools: 4, // Number of tools to integrate
        codeExamples: 3, // Number of code examples to reference
        similarComponents: 2, // Number of similar components to analyze
        projectStructure: 5, // Number of project structure elements to use
        qualityStandards: 8, // Quality standards to follow
        accessibility: 5 // Accessibility features to include
      },
      
      // Pipeline stage requirements
      pipelineRequirements: {
        'Retrieve.AgentsMD': true, // Get component patterns
        'Detect.RepoFacts': true, // Detect project structure
        'Retrieve.Context7': true, // Get React/TypeScript docs
        'Retrieve.RAG': true, // Get project-specific examples
        'Read.Snippet': true, // Analyze existing components
        'Reason.Plan': true, // Create implementation plan
        'Edit': false, // Code generation (simulated)
        'Validate': false, // Code validation (simulated)
        'Gate': false, // Quality gates (simulated)
        'Document': false, // Documentation (simulated)
        'Learn': false // Learning (simulated)
      },
      
      // Demo-specific configuration
      demoConfig: {
        showContextUtilization: true,
        showPipelineStages: true,
        showQualityComparison: true,
        showFileStructure: true,
        highlightDifferences: true
      }
    };
  }

  /**
   * API Endpoint Scenario
   * @returns {Object} API endpoint scenario configuration
   */
  getAPIEndpointScenario() {
    return {
      name: 'api-endpoint',
      title: 'API Endpoint Generation',
      description: 'Generate a user registration API endpoint with validation, authentication, error handling, and comprehensive testing',
      type: 'api',
      complexity: 'high',
      estimatedTime: '3-4 minutes',
      
      // Context requirements for LocalMCP
      contextRequirements: [
        'Project architecture patterns and conventions',
        'API design patterns and REST principles',
        'Validation schema patterns (Zod)',
        'Authentication and authorization patterns',
        'Error handling and logging patterns',
        'Database integration patterns',
        'Security best practices',
        'Testing patterns for APIs',
        'Documentation patterns (OpenAPI/Swagger)',
        'Performance optimization patterns'
      ],
      
      // Expected files to be generated
      expectedFiles: {
        cursor: [
          'user-registration.ts',
          'types.ts'
        ],
        localmcp: [
          'user-registration.controller.ts',
          'user-registration.routes.ts',
          'user-registration.types.ts',
          'user-registration.test.ts',
          'validation.schemas.ts',
          'middleware/auth.ts',
          'middleware/validation.ts',
          'errors/custom-errors.ts'
        ]
      },
      
      // Success criteria
      successCriteria: {
        minFiles: 2,
        maxFiles: 10,
        mustHaveTypes: true,
        mustHaveTests: true,
        mustHaveValidation: false, // Optional for cursor-only
        mustHaveAuth: false, // Optional for cursor-only
        mustHaveErrorHandling: false, // Optional for cursor-only
        minLinesOfCode: 100,
        maxLinesOfCode: 500
      },
      
      // Context utilization expectations
      contextExpectations: {
        projectPatterns: 12, // More patterns for API
        dependencies: 8, // More dependencies for API
        conventions: 15, // More conventions for API
        frameworks: 4, // Express, Zod, JWT, etc.
        tools: 6, // Testing, validation, auth tools
        codeExamples: 5, // More examples for API
        similarComponents: 3, // Similar API endpoints
        projectStructure: 8, // More structure elements
        qualityStandards: 10, // Higher quality standards
        accessibility: 2 // Less accessibility for API
      },
      
      // Pipeline stage requirements
      pipelineRequirements: {
        'Retrieve.AgentsMD': true, // Get API patterns
        'Detect.RepoFacts': true, // Detect project structure
        'Retrieve.Context7': true, // Get framework docs
        'Retrieve.RAG': true, // Get API examples
        'Read.Snippet': true, // Analyze existing APIs
        'Reason.Plan': true, // Create implementation plan
        'Edit': false, // Code generation (simulated)
        'Validate': false, // Code validation (simulated)
        'Gate': false, // Quality gates (simulated)
        'Document': false, // Documentation (simulated)
        'Learn': false // Learning (simulated)
      },
      
      // Demo-specific configuration
      demoConfig: {
        showContextUtilization: true,
        showPipelineStages: true,
        showQualityComparison: true,
        showFileStructure: true,
        highlightDifferences: true,
        showSecurityFeatures: true,
        showValidationFeatures: true
      }
    };
  }

  /**
   * Full Stack App Scenario
   * @returns {Object} Full stack app scenario configuration
   */
  getFullStackAppScenario() {
    return {
      name: 'full-stack-app',
      title: 'Full Stack Application Generation',
      description: 'Generate a complete todo application with React frontend, Node.js backend, database integration, and full project structure',
      type: 'application',
      complexity: 'high',
      estimatedTime: '4-5 minutes',
      
      // Context requirements for LocalMCP
      contextRequirements: [
        'Complete project architecture and structure',
        'Frontend-backend integration patterns',
        'Database schema and ORM patterns',
        'API design and RESTful principles',
        'State management patterns',
        'Authentication and session management',
        'Error handling and logging',
        'Testing strategies (unit, integration, e2e)',
        'Deployment and DevOps patterns',
        'Performance optimization',
        'Security best practices',
        'Code organization and modularity'
      ],
      
      // Expected files to be generated
      expectedFiles: {
        cursor: [
          'package.json',
          'server.js',
          'client/index.html',
          'client/app.js'
        ],
        localmcp: [
          'package.json',
          'src/server/index.ts',
          'src/server/routes/todos.ts',
          'src/server/controllers/todo.controller.ts',
          'src/server/services/todo.service.ts',
          'src/server/models/todo.model.ts',
          'src/server/middleware/auth.ts',
          'src/server/middleware/validation.ts',
          'src/server/utils/logger.ts',
          'src/server/config/database.ts',
          'client/src/App.tsx',
          'client/src/components/TodoList.tsx',
          'client/src/components/TodoItem.tsx',
          'client/src/hooks/useTodos.ts',
          'client/src/services/api.ts',
          'client/src/types/todo.ts',
          'client/package.json',
          'client/src/index.tsx',
          'docker-compose.yml',
          'README.md'
        ]
      },
      
      // Success criteria
      successCriteria: {
        minFiles: 4,
        maxFiles: 20,
        mustHaveTypes: true,
        mustHaveTests: true,
        mustHaveDatabase: false, // Optional for cursor-only
        mustHaveAuth: false, // Optional for cursor-only
        mustHaveDocker: false, // Optional for cursor-only
        minLinesOfCode: 200,
        maxLinesOfCode: 1000
      },
      
      // Context utilization expectations
      contextExpectations: {
        projectPatterns: 20, // Most patterns for full-stack
        dependencies: 15, // Most dependencies for full-stack
        conventions: 25, // Most conventions for full-stack
        frameworks: 6, // React, Node.js, Express, etc.
        tools: 10, // Most tools for full-stack
        codeExamples: 8, // Most examples for full-stack
        similarComponents: 5, // Most similar components
        projectStructure: 15, // Most structure elements
        qualityStandards: 15, // Highest quality standards
        accessibility: 8 // Good accessibility for full-stack
      },
      
      // Pipeline stage requirements
      pipelineRequirements: {
        'Retrieve.AgentsMD': true, // Get full-stack patterns
        'Detect.RepoFacts': true, // Detect complete project structure
        'Retrieve.Context7': true, // Get all framework docs
        'Retrieve.RAG': true, // Get full-stack examples
        'Read.Snippet': true, // Analyze existing full-stack code
        'Reason.Plan': true, // Create comprehensive plan
        'Edit': false, // Code generation (simulated)
        'Validate': false, // Code validation (simulated)
        'Gate': false, // Quality gates (simulated)
        'Document': false, // Documentation (simulated)
        'Learn': false // Learning (simulated)
      },
      
      // Demo-specific configuration
      demoConfig: {
        showContextUtilization: true,
        showPipelineStages: true,
        showQualityComparison: true,
        showFileStructure: true,
        highlightDifferences: true,
        showArchitecture: true,
        showIntegration: true,
        showDeployment: true
      }
    };
  }

  /**
   * Get scenario by complexity level
   * @param {string} complexity - 'low', 'medium', or 'high'
   * @returns {Array} Array of scenarios with specified complexity
   */
  getScenariosByComplexity(complexity) {
    return Object.values(this.scenarios).filter(scenario => scenario.complexity === complexity);
  }

  /**
   * Get scenario by type
   * @param {string} type - 'component', 'api', or 'application'
   * @returns {Array} Array of scenarios with specified type
   */
  getScenariosByType(type) {
    return Object.values(this.scenarios).filter(scenario => scenario.type === type);
  }

  /**
   * Validate scenario configuration
   * @param {Object} scenario - Scenario to validate
   * @returns {Object} Validation result
   */
  validateScenario(scenario) {
    const errors = [];
    const warnings = [];

    // Required fields
    const requiredFields = ['name', 'title', 'description', 'type', 'complexity'];
    for (const field of requiredFields) {
      if (!scenario[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate type
    const validTypes = ['component', 'api', 'application'];
    if (scenario.type && !validTypes.includes(scenario.type)) {
      errors.push(`Invalid type: ${scenario.type}. Must be one of: ${validTypes.join(', ')}`);
    }

    // Validate complexity
    const validComplexities = ['low', 'medium', 'high'];
    if (scenario.complexity && !validComplexities.includes(scenario.complexity)) {
      errors.push(`Invalid complexity: ${scenario.complexity}. Must be one of: ${validComplexities.join(', ')}`);
    }

    // Validate expected files
    if (scenario.expectedFiles) {
      if (!scenario.expectedFiles.cursor || !Array.isArray(scenario.expectedFiles.cursor)) {
        errors.push('expectedFiles.cursor must be an array');
      }
      if (!scenario.expectedFiles.localmcp || !Array.isArray(scenario.expectedFiles.localmcp)) {
        errors.push('expectedFiles.localmcp must be an array');
      }
    }

    // Validate success criteria
    if (scenario.successCriteria) {
      if (scenario.successCriteria.minFiles && scenario.successCriteria.maxFiles) {
        if (scenario.successCriteria.minFiles > scenario.successCriteria.maxFiles) {
          errors.push('minFiles cannot be greater than maxFiles');
        }
      }
    }

    // Validate context expectations
    if (scenario.contextExpectations) {
      for (const [key, value] of Object.entries(scenario.contextExpectations)) {
        if (typeof value !== 'number' || value < 0) {
          warnings.push(`contextExpectations.${key} should be a non-negative number`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get scenario summary for display
   * @param {string} scenarioName - Name of the scenario
   * @returns {Object} Scenario summary
   */
  getScenarioSummary(scenarioName) {
    const scenario = this.getScenario(scenarioName);
    
    return {
      name: scenario.name,
      title: scenario.title,
      description: scenario.description,
      type: scenario.type,
      complexity: scenario.complexity,
      estimatedTime: scenario.estimatedTime,
      expectedFiles: {
        cursor: scenario.expectedFiles.cursor.length,
        localmcp: scenario.expectedFiles.localmcp.length
      },
      contextRequirements: scenario.contextRequirements.length,
      pipelineStages: Object.values(scenario.pipelineRequirements).filter(Boolean).length
    };
  }

  /**
   * Get all scenario summaries
   * @returns {Array} Array of scenario summaries
   */
  getAllScenarioSummaries() {
    return this.getScenarioNames().map(name => this.getScenarioSummary(name));
  }

  /**
   * Check if scenario exists
   * @param {string} scenarioName - Name of the scenario
   * @returns {boolean} True if scenario exists
   */
  hasScenario(scenarioName) {
    return scenarioName in this.scenarios;
  }

  /**
   * Get scenario statistics
   * @returns {Object} Scenario statistics
   */
  getScenarioStats() {
    const scenarios = Object.values(this.scenarios);
    
    return {
      total: scenarios.length,
      byType: {
        component: scenarios.filter(s => s.type === 'component').length,
        api: scenarios.filter(s => s.type === 'api').length,
        application: scenarios.filter(s => s.type === 'application').length
      },
      byComplexity: {
        low: scenarios.filter(s => s.complexity === 'low').length,
        medium: scenarios.filter(s => s.complexity === 'medium').length,
        high: scenarios.filter(s => s.complexity === 'high').length
      },
      averageFiles: {
        cursor: Math.round(scenarios.reduce((sum, s) => sum + s.expectedFiles.cursor.length, 0) / scenarios.length),
        localmcp: Math.round(scenarios.reduce((sum, s) => sum + s.expectedFiles.localmcp.length, 0) / scenarios.length)
      },
      averageContextRequirements: Math.round(scenarios.reduce((sum, s) => sum + s.contextRequirements.length, 0) / scenarios.length)
    };
  }
}

export { DemoScenarios };
