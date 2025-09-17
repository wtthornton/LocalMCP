import { Logger } from '../../services/logger/logger.js';
import { ConfigService } from '../../config/config.service.js';
import type { PipelineStage, PipelineContext, PipelineError } from '../pipeline-engine.js';
import { readFile, access } from 'fs/promises';
import { join } from 'path';

/**
 * Retrieve.AgentsMD Stage
 * 
 * Retrieves and parses AGENTS.md file from the project root
 * to understand project-specific guidelines and constraints
 */
export class RetrieveAgentsMDStage implements PipelineStage {
  constructor(
    private logger: Logger,
    private config: ConfigService
  ) {}

  get name(): string {
    return 'Retrieve.AgentsMD';
  }

  async execute(context: PipelineContext): Promise<Partial<PipelineContext>> {
    this.logger.debug('Retrieve.AgentsMD stage executing', {
      requestId: context.requestId,
      toolName: context.toolName
    });

    try {
      const agentsMDContent = await this.retrieveAgentsMD(context);
      const parsedGuidelines = this.parseAgentsMD(agentsMDContent);

      this.logger.debug('Retrieve.AgentsMD stage completed', {
        requestId: context.requestId,
        guidelinesFound: parsedGuidelines.length,
        contentLength: agentsMDContent.length
      });

      return {
        data: {
          agentsMD: {
            content: agentsMDContent,
            guidelines: parsedGuidelines,
            exists: agentsMDContent.length > 0
          }
        },
        metadata: {
          tokensUsed: this.estimateTokens(agentsMDContent),
          chunksUsed: 1,
          agentsMDFound: agentsMDContent.length > 0
        }
      };

    } catch (error) {
      this.logger.error('Retrieve.AgentsMD stage failed', {
        requestId: context.requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Return empty result instead of throwing to allow pipeline to continue
      return {
        data: {
          agentsMD: {
            content: '',
            guidelines: [],
            exists: false
          }
        },
        metadata: {
          tokensUsed: 0,
          chunksUsed: 0,
          agentsMDFound: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  canRetry(error: PipelineError): boolean {
    // Retry on file system errors, but not on parsing errors
    return error.error.includes('ENOENT') || error.error.includes('EACCES');
  }

  getBudgetCost(): Partial<PipelineContext['budget']> {
    return {
      tokens: 200, // Estimated tokens for AGENTS.md content
      chunks: 1
    };
  }

  private async retrieveAgentsMD(context: PipelineContext): Promise<string> {
    const possiblePaths = [
      'AGENTS.md',
      'agents.md',
      'Agents.md',
      'docs/AGENTS.md',
      'docs/agents.md',
      '.github/AGENTS.md',
      '.github/agents.md'
    ];

    for (const path of possiblePaths) {
      try {
        await access(path);
        const content = await readFile(path, 'utf-8');
        this.logger.debug('Found AGENTS.md', { path, size: content.length });
        return content;
      } catch (error) {
        // File doesn't exist, try next path
        continue;
      }
    }

    this.logger.warn('AGENTS.md not found in any expected location', {
      requestId: context.requestId,
      searchedPaths: possiblePaths
    });

    return '';
  }

  private parseAgentsMD(content: string): Array<{
    type: 'guideline' | 'constraint' | 'pattern' | 'rule';
    text: string;
    priority: 'high' | 'medium' | 'low';
    category: string;
  }> {
    if (!content) return [];

    const guidelines: Array<{
      type: 'guideline' | 'constraint' | 'pattern' | 'rule';
      text: string;
      priority: 'high' | 'medium' | 'low';
      category: string;
    }> = [];

    const lines = content.split('\n');
    let currentCategory = 'general';
    let currentPriority: 'high' | 'medium' | 'low' = 'medium';

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Detect category headers
      if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
        currentCategory = trimmed.replace(/^#+\s*/, '').toLowerCase();
        continue;
      }

      // Detect priority indicators
      if (trimmed.includes('🚨') || trimmed.includes('CRITICAL') || trimmed.includes('MUST')) {
        currentPriority = 'high';
      } else if (trimmed.includes('⚠️') || trimmed.includes('IMPORTANT') || trimmed.includes('SHOULD')) {
        currentPriority = 'medium';
      } else if (trimmed.includes('💡') || trimmed.includes('SUGGESTED') || trimmed.includes('MAY')) {
        currentPriority = 'low';
      }

      // Detect guidelines (bullet points, numbered lists)
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('1. ') || trimmed.startsWith('• ')) {
        const text = trimmed.replace(/^[-*•]\s*|\d+\.\s*/, '');
        
        let type: 'guideline' | 'constraint' | 'pattern' | 'rule' = 'guideline';
        if (text.toLowerCase().includes('constraint') || text.toLowerCase().includes('limit')) {
          type = 'constraint';
        } else if (text.toLowerCase().includes('pattern') || text.toLowerCase().includes('template')) {
          type = 'pattern';
        } else if (text.toLowerCase().includes('rule') || text.toLowerCase().includes('must not')) {
          type = 'rule';
        }

        guidelines.push({
          type,
          text,
          priority: currentPriority,
          category: currentCategory
        });
      }

      // Detect code blocks with patterns
      if (trimmed.startsWith('```')) {
        const nextLine = lines[lines.indexOf(line) + 1];
        if (nextLine && nextLine.trim()) {
          guidelines.push({
            type: 'pattern',
            text: `Code pattern: ${nextLine.trim()}`,
            priority: currentPriority,
            category: currentCategory
          });
        }
      }
    }

    this.logger.debug('Parsed AGENTS.md guidelines', {
      totalGuidelines: guidelines.length,
      byType: {
        guideline: guidelines.filter(g => g.type === 'guideline').length,
        constraint: guidelines.filter(g => g.type === 'constraint').length,
        pattern: guidelines.filter(g => g.type === 'pattern').length,
        rule: guidelines.filter(g => g.type === 'rule').length
      },
      byPriority: {
        high: guidelines.filter(g => g.priority === 'high').length,
        medium: guidelines.filter(g => g.priority === 'medium').length,
        low: guidelines.filter(g => g.priority === 'low').length
      }
    });

    return guidelines;
  }

  private estimateTokens(content: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(content.length / 4);
  }
}
