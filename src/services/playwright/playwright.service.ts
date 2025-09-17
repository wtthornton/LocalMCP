import { Logger } from '../logger/logger.js';
import { ConfigService } from '../../config/config.service.js';

export interface ScreenshotOptions {
  fullPage?: boolean;
  quality?: number;
  format?: 'png' | 'jpeg';
  timeout?: number;
}

export interface UIAction {
  type: 'click' | 'type' | 'hover' | 'select' | 'scroll';
  selector?: string;
  text?: string;
  value?: string;
  options?: Record<string, any>;
}

export interface UIResult {
  success: boolean;
  screenshot?: string; // base64 encoded
  error?: string;
  metadata?: {
    url: string;
    title: string;
    viewport: { width: number; height: number };
    timestamp: string;
  };
}

/**
 * PlaywrightService - UI testing and screenshot capabilities
 * 
 * Provides UI testing, screenshot capture, and web interaction capabilities
 * for LocalMCP tools. Integrates with Playwright MCP server for:
 * - Screenshot capture (full page or viewport)
 * - UI element interaction (click, type, hover)
 * - Web page validation and testing
 * - Visual regression testing
 * 
 * This service acts as a bridge to the Playwright MCP server running
 * as a sidecar container.
 */
export class PlaywrightService {
  private baseUrl: string;
  private enabled: boolean;
  private timeout: number;

  constructor(
    private logger: Logger,
    private config: ConfigService
  ) {
    const playwrightConfig = this.config.getNested('playwright', 'mcp');
    this.enabled = playwrightConfig.enabled;
    this.baseUrl = playwrightConfig.baseUrl;
    this.timeout = playwrightConfig.timeout || 30000;

    if (this.enabled) {
      this.logger.info('Playwright service initialized', {
        baseUrl: this.baseUrl,
        timeout: this.timeout
      });
    } else {
      this.logger.info('Playwright service disabled');
    }
  }

  async takeScreenshot(
    url: string,
    options: ScreenshotOptions = {}
  ): Promise<UIResult> {
    if (!this.enabled) {
      return {
        success: false,
        error: 'Playwright service is disabled'
      };
    }

    try {
      this.logger.info(`Taking screenshot of: ${url}`, options);

      const response = await fetch(`${this.baseUrl}/screenshot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url,
          fullPage: options.fullPage || false,
          quality: options.quality || 90,
          format: options.format || 'png',
          timeout: options.timeout || this.timeout
        })
      });

      if (!response.ok) {
        throw new Error(`Playwright API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        screenshot: result.screenshot,
        metadata: {
          url: result.url || url,
          title: result.title || '',
          viewport: result.viewport || { width: 1920, height: 1080 },
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      this.logger.error('Failed to take screenshot:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async performUIAction(
    url: string,
    actions: UIAction[],
    options: ScreenshotOptions = {}
  ): Promise<UIResult> {
    if (!this.enabled) {
      return {
        success: false,
        error: 'Playwright service is disabled'
      };
    }

    try {
      this.logger.info(`Performing UI actions on: ${url}`, { actionCount: actions.length });

      const response = await fetch(`${this.baseUrl}/interact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url,
          actions,
          screenshot: options,
          timeout: this.timeout
        })
      });

      if (!response.ok) {
        throw new Error(`Playwright API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        screenshot: result.screenshot,
        metadata: {
          url: result.url || url,
          title: result.title || '',
          viewport: result.viewport || { width: 1920, height: 1080 },
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      this.logger.error('Failed to perform UI actions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async validatePage(
    url: string,
    checks: {
      title?: string;
      elements?: string[];
      text?: string[];
      screenshots?: boolean;
    }
  ): Promise<UIResult & { validation: any }> {
    if (!this.enabled) {
      return {
        success: false,
        error: 'Playwright service is disabled',
        validation: { passed: false, errors: ['Service disabled'] }
      };
    }

    try {
      this.logger.info(`Validating page: ${url}`, checks);

      const response = await fetch(`${this.baseUrl}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url,
          checks,
          timeout: this.timeout
        })
      });

      if (!response.ok) {
        throw new Error(`Playwright API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        screenshot: result.screenshot,
        metadata: {
          url: result.url || url,
          title: result.title || '',
          viewport: result.viewport || { width: 1920, height: 1080 },
          timestamp: new Date().toISOString()
        },
        validation: result.validation || { passed: false, errors: [] }
      };
    } catch (error) {
      this.logger.error('Failed to validate page:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        validation: { passed: false, errors: [error instanceof Error ? error.message : 'Unknown error'] }
      };
    }
  }

  async getPageInfo(url: string): Promise<{
    success: boolean;
    info?: {
      title: string;
      url: string;
      viewport: { width: number; height: number };
      elements: { tag: string; count: number }[];
      links: string[];
      images: string[];
    };
    error?: string;
  }> {
    if (!this.enabled) {
      return {
        success: false,
        error: 'Playwright service is disabled'
      };
    }

    try {
      this.logger.info(`Getting page info for: ${url}`);

      const response = await fetch(`${this.baseUrl}/page-info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url,
          timeout: this.timeout
        })
      });

      if (!response.ok) {
        throw new Error(`Playwright API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        info: result.info
      };
    } catch (error) {
      this.logger.error('Failed to get page info:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async healthCheck(): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      return response.ok;
    } catch (error) {
      this.logger.warn('Playwright health check failed:', error);
      return false;
    }
  }
}
