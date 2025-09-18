/**
 * Documentation Services Index
 * 
 * Phase 6: Comprehensive user guide system
 * 
 * Benefits for vibe coders:
 * - Centralized documentation services
 * - Easy integration with other services
 * - Consistent API across all documentation features
 */

export { default as ComprehensiveUserGuideService } from './comprehensive-user-guide.service';
export { default as Context7ContentGeneratorService } from './context7-content-generator.service';

export type {
  UserGuideConfig,
  GuidePage,
  InteractiveExample,
  UserGuideAnalytics
} from './comprehensive-user-guide.service';

export type {
  ContentGenerationRequest,
  GeneratedContent,
  CodeExample,
  ContentSource
} from './context7-content-generator.service';
