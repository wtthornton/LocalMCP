/**
 * Template-Based Enhancement Tool
 * Provides context-specific templates instead of hardcoded examples
 * Improves quality scores through targeted, relevant content
 */

import { Logger } from '../services/logger/logger.js';

export interface PromptTemplate {
  id: string;
  framework: string;
  complexity: 'simple' | 'medium' | 'complex';
  content: string[];
}

export interface QualityNeeds {
  needsHTMLDocs: boolean;
  needsReactPatterns: boolean;
  needsStateManagement: boolean;
}

export class TemplateBasedEnhancer {
  private logger: Logger;

  // Basic template collection
  private readonly TEMPLATES: PromptTemplate[] = [
    {
      id: 'html-simple',
      framework: 'html',
      complexity: 'simple',
      content: [
        '// HTML Element Creation',
        '<button type="button" class="btn">Click me</button>',
        '// Add event listener: button.addEventListener("click", handler)'
      ]
    },
    {
      id: 'html-medium',
      framework: 'html',
      complexity: 'medium',
      content: [
        '// Interactive HTML Component',
        '<div class="component">',
        '  <input type="text" placeholder="Search..." id="search">',
        '  <button onclick="handleSearch()">Search</button>',
        '</div>',
        '// Add JavaScript: document.getElementById("search").addEventListener("input", handler)'
      ]
    },
    {
      id: 'react-simple',
      framework: 'react',
      complexity: 'simple',
      content: [
        '// React Functional Component',
        'const Component = () => {',
        '  return <div>Hello World</div>;',
        '};'
      ]
    },
    {
      id: 'react-medium',
      framework: 'react',
      complexity: 'medium',
      content: [
        '// React Component with State',
        'const Component = () => {',
        '  const [state, setState] = useState(initialValue);',
        '  const handleChange = (e) => setState(e.target.value);',
        '  return <input value={state} onChange={handleChange} />;',
        '};'
      ]
    },
    {
      id: 'typescript-simple',
      framework: 'typescript',
      complexity: 'simple',
      content: [
        '// TypeScript Type Safety',
        'interface User {',
        '  id: number;',
        '  name: string;',
        '}',
        'const user: User = { id: 1, name: "John" };'
      ]
    },
    {
      id: 'typescript-complex',
      framework: 'typescript',
      complexity: 'complex',
      content: [
        '// TypeScript Error Handling',
        'interface ApiResponse<T> {',
        '  data: T;',
        '  error?: string;',
        '}',
        'function handleApiResponse<T>(response: unknown): ApiResponse<T> {',
        '  if (typeof response === "object" && response !== null) {',
        '    return response as ApiResponse<T>;',
        '  }',
        '  throw new Error("Invalid API response");',
        '}'
      ]
    },
    {
      id: 'nextjs-complex',
      framework: 'nextjs',
      complexity: 'complex',
      content: [
        '// Next.js Full-Stack Pattern',
        '// pages/api/users.ts',
        'export default function handler(req: NextApiRequest, res: NextApiResponse) {',
        '  if (req.method === "GET") {',
        '    res.status(200).json({ users: [] });',
        '  } else {',
        '    res.setHeader("Allow", ["GET"]);',
        '    res.status(405).end(`Method ${req.method} Not Allowed`);',
        '  }',
        '}'
      ]
    }
  ];

  // Quality-specific templates
  private readonly QUALITY_TEMPLATES = {
    'html-docs': [
      '// HTML Documentation & Best Practices',
      '// Use semantic HTML elements for better accessibility',
      '// Add proper ARIA attributes',
      '// Example: <button aria-label="Close dialog" type="button">×</button>',
      '// Use proper form labels: <label for="input-id">Label</label>'
    ],
    'react-patterns': [
      '// React Best Practices',
      '// Use functional components with hooks',
      '// Implement proper prop types with TypeScript',
      '// Example: const Component = ({ title }: { title: string }) => { ... }',
      '// Use useCallback for event handlers to prevent re-renders'
    ],
    'state-management': [
      '// State Management Patterns',
      '// Use useState for local component state',
      '// Use useReducer for complex state logic',
      '// Example: const [state, dispatch] = useReducer(reducer, initialState)',
      '// Use Context API for global state sharing'
    ],
    'search-logic': [
      '// Search Implementation Patterns',
      '// Implement debounced search to avoid excessive API calls',
      '// Example: const debouncedSearch = useCallback(debounce(searchFunction, 300), []);',
      '// Use controlled components for search inputs',
      '// Implement proper loading and error states'
    ],
    'architecture': [
      '// Architecture Best Practices',
      '// Separate concerns: components, hooks, services',
      '// Use custom hooks for reusable logic',
      '// Implement proper error boundaries',
      '// Follow single responsibility principle'
    ]
  };

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Select template based on framework and complexity
   */
  selectTemplate(framework: string, complexity: string): PromptTemplate | null {
    const template = this.TEMPLATES.find(t => 
      t.framework === framework && t.complexity === complexity
    );
    
    this.logger.debug('Template selected', { framework, complexity, templateId: template?.id });
    return template || null;
  }

  /**
   * Get fallback template when no specific template found
   */
  getFallbackTemplate(complexity: string): PromptTemplate {
    return {
      id: 'generic-fallback',
      framework: 'generic',
      complexity: complexity as any,
      content: [
        '// Generic coding pattern',
        '// Implement based on your specific needs',
        '// Add proper error handling',
        '// Follow best practices for your framework'
      ]
    };
  }

  /**
   * Select template based on quality needs analysis
   */
  selectTemplateByQuality(prompt: string, framework: string): string[] {
    const qualityNeeds = this.analyzeQualityNeeds(prompt);
    
    this.logger.debug('Quality needs analysis', { prompt: prompt.substring(0, 50), qualityNeeds, framework });
    
    // Return quality-specific templates based on needs
    if (qualityNeeds.needsHTMLDocs && framework === 'html') {
      return this.QUALITY_TEMPLATES['html-docs'];
    }
    if (qualityNeeds.needsReactPatterns && framework === 'react') {
      return this.QUALITY_TEMPLATES['react-patterns'];
    }
    if (qualityNeeds.needsStateManagement) {
      return this.QUALITY_TEMPLATES['state-management'];
    }
    if (prompt.toLowerCase().includes('search') || prompt.toLowerCase().includes('filter')) {
      return this.QUALITY_TEMPLATES['search-logic'];
    }
    if (prompt.toLowerCase().includes('architecture') || prompt.toLowerCase().includes('structure')) {
      return this.QUALITY_TEMPLATES['architecture'];
    }
    
    // Fallback to basic template
    const template = this.selectTemplate(framework, 'medium');
    return template ? template.content : this.getFallbackTemplate('medium').content;
  }

  /**
   * Get template-based code snippets
   */
  async getTemplateBasedSnippets(framework: string, complexity: string, prompt: string): Promise<string[]> {
    try {
      // First try quality-based selection
      const qualitySnippets = this.selectTemplateByQuality(prompt, framework);
      if (qualitySnippets.length > 0) {
        this.logger.debug('Using quality-based templates', { framework, complexity });
        return qualitySnippets;
      }

      // Fallback to basic template selection
      const template = this.selectTemplate(framework, complexity);
      if (template) {
        this.logger.debug('Using basic template', { templateId: template.id });
        return template.content;
      }

      // Final fallback
      this.logger.debug('Using fallback template', { framework, complexity });
      return this.getFallbackTemplate(complexity).content;
    } catch (error) {
      this.logger.warn('Template selection failed, using fallback', { error });
      return this.getFallbackTemplate(complexity).content;
    }
  }

  /**
   * Analyze prompt to determine quality needs
   */
  private analyzeQualityNeeds(prompt: string): QualityNeeds {
    const lower = prompt.toLowerCase();
    
    return {
      needsHTMLDocs: lower.includes('html') || lower.includes('button') || lower.includes('element') || lower.includes('form'),
      needsReactPatterns: lower.includes('react') || lower.includes('component') || lower.includes('jsx'),
      needsStateManagement: lower.includes('state') || lower.includes('search') || lower.includes('filter') || lower.includes('list')
    };
  }
}
