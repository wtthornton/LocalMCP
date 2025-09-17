import { Logger } from '../logger/logger.js';
import { UserGuideService } from './user-guide.service.js';
import { UserGuideTestingService } from './user-guide-testing.service.js';
import type { PhaseData, UserGuideGenerationResult } from './user-guide.types.js';

/**
 * User Guide Pipeline Integration Service
 * 
 * Integrates user guide generation and testing with the pipeline system,
 * automatically updating documentation after each phase completion.
 */
export class UserGuidePipelineService {
  private phaseHistory: Map<string, PhaseData> = new Map();

  constructor(
    private logger: Logger,
    private userGuideService: UserGuideService,
    private testingService: UserGuideTestingService
  ) {}

  /**
   * Initialize user guide system
   */
  async initialize(): Promise<UserGuideGenerationResult> {
    this.logger.info('Initializing user guide system...');

    try {
      // Generate initial user guide
      const result = await this.userGuideService.generateUserGuide();
      
      this.logger.info('User guide system initialized successfully', {
        pagesGenerated: result.length
      });

      return {
        success: true,
        pagesGenerated: result.length,
        outputDir: 'docs/user-guide'
      };

    } catch (error) {
      this.logger.error('Failed to initialize user guide system:', error);
      return {
        success: false,
        pagesGenerated: 0,
        outputDir: 'docs/user-guide',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Update user guide after phase completion
   */
  async updateAfterPhase(phaseName: string, phaseData: any): Promise<void> {
    this.logger.info(`Updating user guide after ${phaseName} completion...`);

    try {
      // Store phase data
      const phaseInfo: PhaseData = {
        title: phaseData.title || phaseName,
        description: phaseData.description || `Implementation of ${phaseName}`,
        features: phaseData.features || [],
        status: 'completed',
        completionDate: new Date(),
        screenshots: phaseData.screenshots || [],
        examples: phaseData.examples || []
      };

      this.phaseHistory.set(phaseName, phaseInfo);

      // Update user guide
      await this.userGuideService.updateUserGuide(phaseName, phaseInfo);

      // Test updated user guide
      await this.testUpdatedUserGuide();

      this.logger.info(`User guide updated successfully for ${phaseName}`);

    } catch (error) {
      this.logger.error(`Failed to update user guide for ${phaseName}:`, error);
      throw error;
    }
  }

  /**
   * Get phase completion summary
   */
  getPhaseSummary(): Record<string, PhaseData> {
    const summary: Record<string, PhaseData> = {};
    
    for (const [phaseName, phaseData] of this.phaseHistory.entries()) {
      summary[phaseName] = phaseData;
    }

    return summary;
  }

  /**
   * Generate comprehensive user guide with all phases
   */
  async generateCompleteUserGuide(): Promise<UserGuideGenerationResult> {
    this.logger.info('Generating complete user guide with all phases...');

    try {
      // Get all phase data
      const allPhaseData = this.getPhaseSummary();

      // Generate complete user guide
      const result = await this.userGuideService.generateUserGuide(allPhaseData);

      // Test the complete user guide
      const testingResult = await this.testCompleteUserGuide();

      this.logger.info('Complete user guide generated successfully', {
        pagesGenerated: result.length,
        testingSuccess: testingResult.success
      });

      return {
        success: true,
        pagesGenerated: result.length,
        outputDir: 'docs/user-guide',
        screenshots: testingResult.screenshots
      };

    } catch (error) {
      this.logger.error('Failed to generate complete user guide:', error);
      return {
        success: false,
        pagesGenerated: 0,
        outputDir: 'docs/user-guide',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Test updated user guide
   */
  private async testUpdatedUserGuide(): Promise<void> {
    try {
      // Get current pages (simplified - in reality you'd scan the directory)
      const pages = await this.getCurrentPages();
      
      // Test with Playwright
      const testingResult = await this.testingService.testUserGuidePages(pages);

      // Generate testing report
      await this.testingService.generateTestingReport(testingResult);

      if (!testingResult.success) {
        this.logger.warn('User guide testing found issues:', testingResult.errors);
      }

    } catch (error) {
      this.logger.error('Failed to test updated user guide:', error);
    }
  }

  /**
   * Test complete user guide
   */
  private async testCompleteUserGuide(): Promise<any> {
    try {
      const pages = await this.getCurrentPages();
      return await this.testingService.testUserGuidePages(pages);
    } catch (error) {
      this.logger.error('Failed to test complete user guide:', error);
      return { success: false, errors: [error instanceof Error ? error.message : 'Unknown error'] };
    }
  }

  /**
   * Get current pages (simplified implementation)
   */
  private async getCurrentPages(): Promise<any[]> {
    // In a real implementation, this would scan the output directory
    // and return actual page objects
    return [
      { id: 'index', outputPath: 'docs/user-guide/index.html' },
      { id: 'getting-started', outputPath: 'docs/user-guide/getting-started.html' },
      { id: 'quick-start', outputPath: 'docs/user-guide/quick-start.html' },
      { id: 'tool-reference', outputPath: 'docs/user-guide/tool-reference.html' },
      { id: 'pipeline-guide', outputPath: 'docs/user-guide/pipeline-guide.html' },
      { id: 'phase-0', outputPath: 'docs/user-guide/phase-0.html' },
      { id: 'phase-1', outputPath: 'docs/user-guide/phase-1.html' },
      { id: 'phase-2', outputPath: 'docs/user-guide/phase-2.html' },
      { id: 'phase-3', outputPath: 'docs/user-guide/phase-3.html' },
      { id: 'admin-console', outputPath: 'docs/user-guide/admin-console.html' },
      { id: 'troubleshooting', outputPath: 'docs/user-guide/troubleshooting.html' },
      { id: 'api-reference', outputPath: 'docs/user-guide/api-reference.html' },
      { id: 'examples', outputPath: 'docs/user-guide/examples.html' }
    ];
  }

  /**
   * Validate user guide integrity
   */
  async validateUserGuide(): Promise<boolean> {
    try {
      const pages = await this.getCurrentPages();
      const testingResult = await this.testingService.testUserGuidePages(pages);

      const isValid = testingResult.success && 
                     testingResult.errors.length === 0 &&
                     testingResult.accessibilityIssues.length === 0;

      this.logger.info(`User guide validation ${isValid ? 'PASSED' : 'FAILED'}`, {
        success: testingResult.success,
        errors: testingResult.errors.length,
        accessibilityIssues: testingResult.accessibilityIssues.length
      });

      return isValid;

    } catch (error) {
      this.logger.error('User guide validation failed:', error);
      return false;
    }
  }

  /**
   * Export user guide for distribution
   */
  async exportUserGuide(format: 'html' | 'pdf' | 'zip' = 'html'): Promise<string> {
    this.logger.info(`Exporting user guide in ${format} format...`);

    try {
      // Generate complete user guide first
      await this.generateCompleteUserGuide();

      // Export based on format
      switch (format) {
        case 'html':
          return await this.exportHTML();
        case 'pdf':
          return await this.exportPDF();
        case 'zip':
          return await this.exportZIP();
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

    } catch (error) {
      this.logger.error(`Failed to export user guide in ${format} format:`, error);
      throw error;
    }
  }

  private async exportHTML(): Promise<string> {
    // HTML export is already done by the user guide service
    return 'docs/user-guide';
  }

  private async exportPDF(): Promise<string> {
    // Use Playwright to generate PDF
    const pdfPath = 'docs/user-guide-export.pdf';
    // Implementation would use Playwright's PDF generation
    return pdfPath;
  }

  private async exportZIP(): Promise<string> {
    // Create ZIP archive of the user guide
    const zipPath = 'docs/user-guide-export.zip';
    // Implementation would create ZIP archive
    return zipPath;
  }
}
