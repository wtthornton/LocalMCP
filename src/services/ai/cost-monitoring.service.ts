/**
 * Cost Monitoring Service
 * 
 * Tracks OpenAI API costs and usage to prevent budget overruns
 * Provides cost analytics and budget management
 * 
 * Benefits for vibe coders:
 * - Automatic cost tracking and alerts
 * - Budget protection to prevent surprises
 * - Cost analytics for optimization
 * - Simple daily/monthly limits
 */

import { Logger } from '../logger/logger.js';

export interface CostData {
  timestamp: Date;
  operation: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  success: boolean;
}

export interface CostLimits {
  dailyLimit: number;
  monthlyLimit: number;
  perRequestLimit: number;
}

export interface CostSummary {
  totalCost: number;
  dailyCost: number;
  monthlyCost: number;
  requestCount: number;
  averageCostPerRequest: number;
  costByModel: Record<string, number>;
  costByOperation: Record<string, number>;
  remainingDailyBudget: number;
  remainingMonthlyBudget: number;
}

export class CostMonitoringService {
  private costData: CostData[] = [];
  private limits: CostLimits;
  private logger: Logger;

  constructor(limits?: Partial<CostLimits>, logger?: Logger) {
    this.logger = logger || new Logger('CostMonitoringService');
    this.limits = {
      dailyLimit: 5.0,      // $5 daily limit
      monthlyLimit: 50.0,   // $50 monthly limit
      perRequestLimit: 1.0, // $1 per request limit
      ...limits
    };
  }

  /**
   * Check if a request can be made within budget
   */
  canMakeRequest(estimatedCost: number, operation: string = 'unknown'): boolean {
    const dailyCost = this.getDailyCost();
    const monthlyCost = this.getMonthlyCost();

    // Check daily limit
    if (dailyCost + estimatedCost > this.limits.dailyLimit) {
      this.logger.warn('Daily cost limit would be exceeded', {
        currentDailyCost: dailyCost,
        estimatedCost,
        dailyLimit: this.limits.dailyLimit,
        operation
      });
      return false;
    }

    // Check monthly limit
    if (monthlyCost + estimatedCost > this.limits.monthlyLimit) {
      this.logger.warn('Monthly cost limit would be exceeded', {
        currentMonthlyCost: monthlyCost,
        estimatedCost,
        monthlyLimit: this.limits.monthlyLimit,
        operation
      });
      return false;
    }

    // Check per-request limit
    if (estimatedCost > this.limits.perRequestLimit) {
      this.logger.warn('Per-request cost limit would be exceeded', {
        estimatedCost,
        perRequestLimit: this.limits.perRequestLimit,
        operation
      });
      return false;
    }

    return true;
  }

  /**
   * Track actual cost after request completion
   */
  trackCost(costData: Omit<CostData, 'timestamp'>): void {
    const data: CostData = {
      ...costData,
      timestamp: new Date()
    };

    this.costData.push(data);

    this.logger.debug('Cost tracked', {
      operation: data.operation,
      model: data.model,
      cost: data.cost,
      totalTokens: data.totalTokens
    });

    // Check if we're approaching limits
    this.checkApproachingLimits();
  }

  /**
   * Get current daily cost
   */
  getDailyCost(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.costData
      .filter(data => data.timestamp >= today)
      .reduce((sum, data) => sum + data.cost, 0);
  }

  /**
   * Get current monthly cost
   */
  getMonthlyCost(): number {
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    
    return this.costData
      .filter(data => data.timestamp >= firstDayOfMonth)
      .reduce((sum, data) => sum + data.cost, 0);
  }

  /**
   * Get remaining daily budget
   */
  getRemainingDailyBudget(): number {
    return Math.max(0, this.limits.dailyLimit - this.getDailyCost());
  }

  /**
   * Get remaining monthly budget
   */
  getRemainingMonthlyBudget(): number {
    return Math.max(0, this.limits.monthlyLimit - this.getMonthlyCost());
  }

  /**
   * Get comprehensive cost summary
   */
  getCostSummary(): CostSummary {
    const totalCost = this.costData.reduce((sum, data) => sum + data.cost, 0);
    const dailyCost = this.getDailyCost();
    const monthlyCost = this.getMonthlyCost();
    const requestCount = this.costData.length;
    const averageCostPerRequest = requestCount > 0 ? totalCost / requestCount : 0;

    // Cost by model
    const costByModel: Record<string, number> = {};
    this.costData.forEach(data => {
      costByModel[data.model] = (costByModel[data.model] || 0) + data.cost;
    });

    // Cost by operation
    const costByOperation: Record<string, number> = {};
    this.costData.forEach(data => {
      costByOperation[data.operation] = (costByOperation[data.operation] || 0) + data.cost;
    });

    return {
      totalCost,
      dailyCost,
      monthlyCost,
      requestCount,
      averageCostPerRequest,
      costByModel,
      costByOperation,
      remainingDailyBudget: this.getRemainingDailyBudget(),
      remainingMonthlyBudget: this.getRemainingMonthlyBudget()
    };
  }

  /**
   * Get cost data for a specific time range
   */
  getCostData(startDate?: Date, endDate?: Date): CostData[] {
    if (!startDate && !endDate) {
      return [...this.costData];
    }

    return this.costData.filter(data => {
      if (startDate && data.timestamp < startDate) return false;
      if (endDate && data.timestamp > endDate) return false;
      return true;
    });
  }

  /**
   * Check if we're approaching cost limits
   */
  private checkApproachingLimits(): void {
    const dailyCost = this.getDailyCost();
    const monthlyCost = this.getMonthlyCost();
    const dailyPercentage = (dailyCost / this.limits.dailyLimit) * 100;
    const monthlyPercentage = (monthlyCost / this.limits.monthlyLimit) * 100;

    // Warn at 80% of limits
    if (dailyPercentage >= 80) {
      this.logger.warn('Approaching daily cost limit', {
        dailyCost,
        dailyLimit: this.limits.dailyLimit,
        percentage: dailyPercentage.toFixed(1) + '%'
      });
    }

    if (monthlyPercentage >= 80) {
      this.logger.warn('Approaching monthly cost limit', {
        monthlyCost,
        monthlyLimit: this.limits.monthlyLimit,
        percentage: monthlyPercentage.toFixed(1) + '%'
      });
    }
  }

  /**
   * Update cost limits
   */
  updateLimits(newLimits: Partial<CostLimits>): void {
    this.limits = { ...this.limits, ...newLimits };
    this.logger.info('Cost limits updated', this.limits);
  }

  /**
   * Reset cost data (useful for testing or monthly resets)
   */
  resetCostData(): void {
    this.costData = [];
    this.logger.info('Cost data reset');
  }

  /**
   * Get cost efficiency metrics
   */
  getEfficiencyMetrics(): {
    averageTokensPerDollar: number;
    mostExpensiveOperation: string;
    mostExpensiveModel: string;
    costTrend: 'increasing' | 'decreasing' | 'stable';
  } {
    const summary = this.getCostSummary();
    const averageTokensPerDollar = summary.totalCost > 0 
      ? this.costData.reduce((sum, data) => sum + data.totalTokens, 0) / summary.totalCost 
      : 0;

    const mostExpensiveOperation = Object.entries(summary.costByOperation)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'unknown';

    const mostExpensiveModel = Object.entries(summary.costByModel)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'unknown';

    // Simple trend analysis (last 10 requests vs previous 10)
    const recentCosts = this.costData.slice(-10).map(d => d.cost);
    const previousCosts = this.costData.slice(-20, -10).map(d => d.cost);
    
    const recentAvg = recentCosts.length > 0 ? recentCosts.reduce((a, b) => a + b) / recentCosts.length : 0;
    const previousAvg = previousCosts.length > 0 ? previousCosts.reduce((a, b) => a + b) / previousCosts.length : 0;
    
    let costTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (recentAvg > previousAvg * 1.1) costTrend = 'increasing';
    else if (recentAvg < previousAvg * 0.9) costTrend = 'decreasing';

    return {
      averageTokensPerDollar,
      mostExpensiveOperation,
      mostExpensiveModel,
      costTrend
    };
  }
}
