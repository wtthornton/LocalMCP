import { Logger } from '../logger/logger.js';
import { PlaywrightService } from '../playwright/playwright.service.js';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import type { UserGuidePage, UserGuideTestingResult } from './user-guide.types.js';

/**
 * User Guide Testing Service
 * 
 * Uses Playwright to test and validate the generated user guide HTML pages,
 * including screenshots, accessibility, and functionality testing.
 */
export class UserGuideTestingService {
  constructor(
    private logger: Logger,
    private playwright: PlaywrightService
  ) {}

  /**
   * Test all user guide pages with Playwright
   */
  async testUserGuidePages(pages: UserGuidePage[]): Promise<UserGuideTestingResult> {
    this.logger.info('Starting user guide testing with Playwright...');
    
    const results: UserGuideTestingResult = {
      success: true,
      pagesTested: 0,
      screenshots: [],
      errors: [],
      accessibilityIssues: [],
      performanceMetrics: []
    };

    try {
      for (const page of pages) {
        await this.testPage(page, results);
      }

      this.logger.info('User guide testing completed', {
        pagesTested: results.pagesTested,
        screenshots: results.screenshots.length,
        errors: results.errors.length
      });

    } catch (error) {
      this.logger.error('User guide testing failed:', error);
      results.success = false;
      results.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return results;
  }

  /**
   * Test a single page with comprehensive validation
   */
  private async testPage(page: UserGuidePage, results: UserGuideTestingResult): Promise<void> {
    this.logger.debug(`Testing page: ${page.id}`);

    try {
      // Take screenshot of the page
      const screenshot = await this.capturePageScreenshot(page);
      if (screenshot) {
        results.screenshots.push(screenshot);
      }

      // Test accessibility
      const accessibilityIssues = await this.testPageAccessibility(page);
      results.accessibilityIssues.push(...accessibilityIssues);

      // Test performance
      const performanceMetrics = await this.testPagePerformance(page);
      results.performanceMetrics.push(performanceMetrics);

      // Test navigation
      await this.testPageNavigation(page);

      // Test responsive design
      await this.testResponsiveDesign(page);

      results.pagesTested++;

    } catch (error) {
      this.logger.error(`Failed to test page ${page.id}:`, error);
      results.errors.push(`Page ${page.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Capture screenshot of the page
   */
  private async capturePageScreenshot(page: UserGuidePage): Promise<string | null> {
    try {
      const screenshotPath = join(process.cwd(), 'docs/user-guide/screenshots', `${page.id}.png`);
      
      // Use Playwright to take screenshot
      await this.playwright.takeScreenshot(page.outputPath, screenshotPath);
      
      this.logger.debug(`Screenshot captured: ${screenshotPath}`);
      return screenshotPath;

    } catch (error) {
      this.logger.error(`Failed to capture screenshot for ${page.id}:`, error);
      return null;
    }
  }

  /**
   * Test page accessibility
   */
  private async testPageAccessibility(page: UserGuidePage): Promise<string[]> {
    const issues: string[] = [];

    try {
      // Use Playwright to test accessibility
      const accessibilityResults = await this.playwright.testAccessibility(page.outputPath);
      
      if (accessibilityResults.violations) {
        for (const violation of accessibilityResults.violations) {
          issues.push(`${page.id}: ${violation.description}`);
        }
      }

    } catch (error) {
      this.logger.error(`Failed to test accessibility for ${page.id}:`, error);
      issues.push(`${page.id}: Accessibility test failed`);
    }

    return issues;
  }

  /**
   * Test page performance
   */
  private async testPagePerformance(page: UserGuidePage): Promise<any> {
    try {
      // Use Playwright to measure performance
      const performanceMetrics = await this.playwright.measurePerformance(page.outputPath);
      
      return {
        pageId: page.id,
        loadTime: performanceMetrics.loadTime,
        renderTime: performanceMetrics.renderTime,
        resourceCount: performanceMetrics.resourceCount
      };

    } catch (error) {
      this.logger.error(`Failed to test performance for ${page.id}:`, error);
      return {
        pageId: page.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test page navigation
   */
  private async testPageNavigation(page: UserGuidePage): Promise<void> {
    try {
      // Use Playwright to test navigation links
      const navigationResults = await this.playwright.testNavigation(page.outputPath);
      
      if (navigationResults.brokenLinks.length > 0) {
        this.logger.warn(`Broken links found on ${page.id}:`, navigationResults.brokenLinks);
      }

    } catch (error) {
      this.logger.error(`Failed to test navigation for ${page.id}:`, error);
    }
  }

  /**
   * Test responsive design
   */
  private async testResponsiveDesign(page: UserGuidePage): Promise<void> {
    try {
      // Test different viewport sizes
      const viewports = [
        { width: 320, height: 568 },   // Mobile
        { width: 768, height: 1024 },  // Tablet
        { width: 1920, height: 1080 }  // Desktop
      ];

      for (const viewport of viewports) {
        await this.playwright.testViewport(page.outputPath, viewport);
      }

    } catch (error) {
      this.logger.error(`Failed to test responsive design for ${page.id}:`, error);
    }
  }

  /**
   * Generate testing report
   */
  async generateTestingReport(results: UserGuideTestingResult): Promise<string> {
    const reportPath = join(process.cwd(), 'docs/user-guide', 'testing-report.html');
    
    const reportHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>User Guide Testing Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .status { padding: 10px; border-radius: 4px; margin: 10px 0; }
        .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .warning { background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { background: #f8f9fa; padding: 15px; border-radius: 4px; text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; color: #007bff; }
        .screenshots { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .screenshot { text-align: center; }
        .screenshot img { max-width: 100%; border: 1px solid #ddd; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>LocalMCP User Guide Testing Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
        </div>

        <div class="status ${results.success ? 'success' : 'error'}">
            <strong>Overall Status:</strong> ${results.success ? 'PASSED' : 'FAILED'}
        </div>

        <div class="metrics">
            <div class="metric">
                <div class="metric-value">${results.pagesTested}</div>
                <div>Pages Tested</div>
            </div>
            <div class="metric">
                <div class="metric-value">${results.screenshots.length}</div>
                <div>Screenshots Captured</div>
            </div>
            <div class="metric">
                <div class="metric-value">${results.errors.length}</div>
                <div>Errors Found</div>
            </div>
            <div class="metric">
                <div class="metric-value">${results.accessibilityIssues.length}</div>
                <div>Accessibility Issues</div>
            </div>
        </div>

        ${results.errors.length > 0 ? `
        <h2>Errors</h2>
        <div class="status error">
            <ul>
                ${results.errors.map(error => `<li>${error}</li>`).join('')}
            </ul>
        </div>
        ` : ''}

        ${results.accessibilityIssues.length > 0 ? `
        <h2>Accessibility Issues</h2>
        <div class="status warning">
            <ul>
                ${results.accessibilityIssues.map(issue => `<li>${issue}</li>`).join('')}
            </ul>
        </div>
        ` : ''}

        ${results.screenshots.length > 0 ? `
        <h2>Screenshots</h2>
        <div class="screenshots">
            ${results.screenshots.map(screenshot => `
                <div class="screenshot">
                    <img src="${screenshot}" alt="Page screenshot">
                    <p>${screenshot.split('/').pop()}</p>
                </div>
            `).join('')}
        </div>
        ` : ''}

        ${results.performanceMetrics.length > 0 ? `
        <h2>Performance Metrics</h2>
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background: #f8f9fa;">
                    <th style="padding: 10px; border: 1px solid #ddd;">Page</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Load Time (ms)</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Render Time (ms)</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Resources</th>
                </tr>
            </thead>
            <tbody>
                ${results.performanceMetrics.map(metric => `
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;">${metric.pageId}</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${metric.loadTime || 'N/A'}</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${metric.renderTime || 'N/A'}</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${metric.resourceCount || 'N/A'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        ` : ''}
    </div>
</body>
</html>`;

    await writeFile(reportPath, reportHTML, 'utf-8');
    this.logger.info(`Testing report generated: ${reportPath}`);
    
    return reportPath;
  }
}
