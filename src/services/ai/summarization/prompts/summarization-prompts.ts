/**
 * AI Summarization Prompts
 * 
 * Defines optimized prompts for different types of context summarization
 * to achieve maximum token reduction while preserving essential information.
 */

export const SUMMARIZATION_PROMPTS = {
  repoFacts: `
You are an expert software architect tasked with summarizing project facts for efficient caching.

Summarize these project facts into 4-5 concise categories:
- PROJECT: name and description
- TECH_STACK: frameworks, languages, and tools
- ARCHITECTURE: patterns, structure, and design
- QUALITY: testing, CI/CD, and best practices

Requirements:
- Preserve key technical details while eliminating redundancy
- Target: 200-300 words max
- Use clear, actionable language
- Maintain technical accuracy
- Focus on integration patterns and best practices

Project Facts:
{content}

Return only the summarized categories, no additional commentary.`,

  context7Docs: `
You are an expert developer tasked with consolidating framework documentation for efficient caching.

Consolidate these framework documentation snippets into a single, concise guidance paragraph that focuses on:
- Integration patterns between frameworks
- Key best practices and conventions
- Essential technical details
- Common usage patterns

Requirements:
- Preserve essential technical details while reducing redundancy
- Target: 200-300 words max
- Use clear, actionable language
- Focus on practical implementation guidance
- Maintain framework-specific accuracy

Framework Documentation:
{content}

Return only the consolidated guidance, no additional commentary.`,

  codeSnippets: `
You are an expert code reviewer tasked with extracting key patterns from code snippets.

Extract the key patterns and concepts from these code snippets, focusing on:
- Architectural patterns and design principles
- Common practices and conventions
- Reusable concepts and abstractions
- Integration patterns

Requirements:
- Focus on patterns rather than specific implementation details
- Target: 100-200 words max
- Use clear, actionable language
- Identify reusable concepts
- Maintain technical accuracy

Code Snippets:
{content}

Return only the pattern summary, no additional commentary.`
};

export const QUALITY_VALIDATION_PROMPTS = {
  informationRetention: `
Analyze if the summarized content retains the essential information from the original.

Original Content:
{original}

Summarized Content:
{summarized}

Rate the information retention on a scale of 0-100, considering:
- Key technical details preserved
- Important context maintained
- Critical information not lost
- Accuracy of preserved information

Return only a number between 0-100.`,

  technicalAccuracy: `
Analyze the technical accuracy of the summarized content.

Summarized Content:
{summarized}

Rate the technical accuracy on a scale of 0-100, considering:
- Correct technical terminology
- Accurate framework references
- Proper architectural concepts
- Valid implementation patterns

Return only a number between 0-100.`,

  conciseness: `
Analyze the conciseness of the summarized content compared to the original.

Original Token Count: {originalTokens}
Summarized Token Count: {summarizedTokens}

Rate the conciseness on a scale of 0-100, considering:
- Appropriate reduction in length
- No unnecessary verbosity
- Clear and direct language
- Efficient information density

Return only a number between 0-100.`,

  relevance: `
Analyze the relevance of the summarized content to the given context.

Context:
- Frameworks: {frameworks}
- Project Type: {projectType}

Summarized Content:
{summarized}

Rate the relevance on a scale of 0-100, considering:
- Alignment with project context
- Applicability to detected frameworks
- Practical value for developers
- Context-specific guidance

Return only a number between 0-100.`
};

export const AB_TESTING_PROMPTS = {
  qualityComparison: `
Compare the quality of two enhanced prompts to determine which provides better guidance.

Original Enhanced Prompt (using full context):
{originalPrompt}

Summarized Enhanced Prompt (using summarized context):
{summarizedPrompt}

Rate each on a scale of 0-100 considering:
- Technical accuracy
- Practical applicability
- Clarity and actionability
- Completeness of guidance

Return JSON format:
{
  "originalScore": number,
  "summarizedScore": number,
  "recommendation": "original" | "summarized" | "needs_improvement",
  "reasoning": "brief explanation"
}`,

  userSatisfaction: `
Evaluate which enhanced prompt would be more satisfying for a developer to receive.

Original Enhanced Prompt (using full context):
{originalPrompt}

Summarized Enhanced Prompt (using summarized context):
{summarizedPrompt}

Rate each on a scale of 0-100 considering:
- Immediate usefulness
- Actionability
- Clarity of next steps
- Professional quality

Return JSON format:
{
  "originalSatisfaction": number,
  "summarizedSatisfaction": number,
  "preferred": "original" | "summarized",
  "reasoning": "brief explanation"
}`
};

export interface SummarizationPromptConfig {
  maxTokens: number;
  temperature: number;
  model: string;
  qualityThreshold: number;
  retryAttempts: number;
  timeout: number;
}

export const DEFAULT_SUMMARIZATION_CONFIG: SummarizationPromptConfig = {
  maxTokens: 1000,
  temperature: 0.3,
  model: 'gpt-4o-mini',
  qualityThreshold: 0.8,
  retryAttempts: 3,
  timeout: 30000
};

export function formatPrompt(template: string, variables: Record<string, any>): string {
  let formatted = template;
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{${key}}`;
    formatted = formatted.replace(new RegExp(placeholder, 'g'), String(value));
  }
  return formatted;
}
