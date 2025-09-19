import { Logger } from '../services/logger/logger.js';
import { ConfigService } from '../config/config.service.js';
import { ContextPipeline } from '../context/context-pipeline.js';

export interface EnhanceRequest {
  prompt: string;
  context?: {
    file?: string;
    framework?: string;
    style?: string;
  };
}

export interface EnhanceResponse {
  enhanced_prompt: string;
  context_used: {
    repo_facts: string[];
    code_snippets: string[];
    framework_docs: string[];
    project_docs: string[];
  };
}

export class EnhanceTool {
  private logger: Logger;
  private config: ConfigService;
  private contextPipeline: ContextPipeline;

  constructor() {
    this.logger = new Logger('EnhanceTool');
    this.config = new ConfigService();
    this.contextPipeline = new ContextPipeline();
  }

  async enhance(request: EnhanceRequest): Promise<EnhanceResponse> {
    try {
      this.logger.info('Enhancing prompt with project context', { prompt: request.prompt });

      // Gather all context using the simple pipeline
      const context = await this.contextPipeline.gatherContext(
        request.prompt,
        request.context?.framework,
        request.context?.file
      );

      // Enhance the prompt with all context
      const enhancedPrompt = this.buildEnhancedPrompt(
        request.prompt,
        context.repoFacts,
        context.frameworkDocs,
        context.projectDocs,
        context.codeSnippets
      );

      return {
        enhanced_prompt: enhancedPrompt,
        context_used: {
          repo_facts: context.repoFacts,
          code_snippets: context.codeSnippets,
          framework_docs: context.frameworkDocs,
          project_docs: context.projectDocs
        }
      };

    } catch (error) {
      this.logger.error('Failed to enhance prompt', { error: (error as Error).message });
      throw new Error(`Prompt enhancement failed: ${(error as Error).message}`);
    }
  }


  private buildEnhancedPrompt(
    originalPrompt: string,
    repoFacts: string[],
    frameworkDocs: string[],
    projectDocs: string[],
    codeSnippets: string[]
  ): string {
    let enhanced = originalPrompt;
    
    // Skip repo_facts for now to avoid information overload
    
    if (frameworkDocs.length > 0) {
      enhanced += `\n\nFramework Documentation: ${frameworkDocs.join(' ')}`;
    }
    
    if (projectDocs.length > 0) {
      enhanced += `\n\nProject-specific Requirements: ${projectDocs.join(' ')}`;
    }
    
    if (codeSnippets.length > 0) {
      enhanced += `\n\nExisting Code Patterns:\n${codeSnippets.join('\n')}`;
    }
    
    if (frameworkDocs.length > 0 || projectDocs.length > 0 || codeSnippets.length > 0) {
      enhanced += `\n\nMake your response consistent with the project's existing patterns and best practices.`;
    }
    
    return enhanced;
  }
}
