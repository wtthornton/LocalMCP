/**
 * Analytics for User Guide
 * 
 * Phase 6: Comprehensive analytics and user behavior tracking
 * 
 * Benefits for vibe coders:
 * - Usage insights
 * - Performance monitoring
 * - User feedback tracking
 * - Content optimization data
 */

class GuideAnalytics {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.events = [];
    this.metrics = {
      pageViews: new Map(),
      searchQueries: [],
      feedback: new Map(),
      exampleExecutions: new Map(),
      timeOnPage: new Map(),
      scrollDepth: new Map(),
      clickEvents: [],
      errors: []
    };
    
    this.init();
  }

  init() {
    console.log('📊 Initializing Guide Analytics...');
    
    // Track page load
    this.trackPageLoad();
    
    // Track user interactions
    this.trackUserInteractions();
    
    // Track performance metrics
    this.trackPerformance();
    
    // Track errors
    this.trackErrors();
    
    // Periodic data transmission
    this.setupPeriodicTransmission();
    
    console.log('✅ Guide Analytics initialized');
  }

  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  trackPageLoad() {
    const pageData = {
      url: window.location.href,
      title: document.title,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      referrer: document.referrer
    };

    this.trackEvent('page_load', pageData);
    
    // Track page view
    const page = this.getCurrentPage();
    const count = this.metrics.pageViews.get(page) || 0;
    this.metrics.pageViews.set(page, count + 1);
  }

  trackUserInteractions() {
    // Track clicks
    document.addEventListener('click', (e) => {
      this.trackClick(e);
    });

    // Track scroll depth
    this.trackScrollDepth();

    // Track time on page
    this.trackTimeOnPage();

    // Track form interactions
    this.trackFormInteractions();

    // Track search interactions
    this.trackSearchInteractions();
  }

  trackClick(event) {
    const clickData = {
      element: event.target.tagName,
      className: event.target.className,
      id: event.target.id,
      text: event.target.textContent?.substring(0, 100),
      timestamp: new Date().toISOString(),
      page: this.getCurrentPage()
    };

    this.metrics.clickEvents.push(clickData);
    this.trackEvent('click', clickData);
  }

  trackScrollDepth() {
    let maxScrollDepth = 0;
    let scrollCheckpoints = [25, 50, 75, 90, 100];
    let reachedCheckpoints = new Set();

    const updateScrollDepth = () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);

      if (scrollPercent > maxScrollDepth) {
        maxScrollDepth = scrollPercent;
      }

      // Track checkpoint milestones
      scrollCheckpoints.forEach(checkpoint => {
        if (scrollPercent >= checkpoint && !reachedCheckpoints.has(checkpoint)) {
          reachedCheckpoints.add(checkpoint);
          this.trackEvent('scroll_checkpoint', {
            checkpoint,
            timestamp: new Date().toISOString(),
            page: this.getCurrentPage()
          });
        }
      });
    };

    // Throttle scroll events
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      scrollTimeout = setTimeout(updateScrollDepth, 100);
    });

    // Track final scroll depth on page unload
    window.addEventListener('beforeunload', () => {
      this.metrics.scrollDepth.set(this.getCurrentPage(), maxScrollDepth);
    });
  }

  trackTimeOnPage() {
    const startTime = Date.now();
    const page = this.getCurrentPage();

    // Track time on page when leaving
    window.addEventListener('beforeunload', () => {
      const timeOnPage = Date.now() - startTime;
      this.metrics.timeOnPage.set(page, timeOnPage);
      this.trackEvent('time_on_page', {
        page,
        timeOnPage,
        timestamp: new Date().toISOString()
      });
    });

    // Track time milestones
    const timeCheckpoints = [30, 60, 120, 300]; // seconds
    timeCheckpoints.forEach(checkpoint => {
      setTimeout(() => {
        this.trackEvent('time_milestone', {
          page,
          milestone: checkpoint,
          timestamp: new Date().toISOString()
        });
      }, checkpoint * 1000);
    });
  }

  trackFormInteractions() {
    // Track feedback form interactions
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('feedback-btn')) {
        const rating = parseInt(e.target.dataset.rating);
        this.trackFeedback(rating);
      }
    });

    // Track search form interactions
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.trackSearchQuery(e.target.value);
      });
    }
  }

  trackSearchInteractions() {
    // Track search events
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('search-result')) {
        this.trackEvent('search_result_click', {
          resultId: e.target.dataset.page,
          timestamp: new Date().toISOString()
        });
      }
    });
  }

  trackPerformance() {
    // Track Core Web Vitals
    this.trackCoreWebVitals();

    // Track resource loading
    this.trackResourceLoading();

    // Track custom performance metrics
    this.trackCustomMetrics();
  }

  trackCoreWebVitals() {
    // Largest Contentful Paint (LCP)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.trackEvent('lcp', {
        value: lastEntry.startTime,
        timestamp: new Date().toISOString()
      });
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay (FID)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach(entry => {
        this.trackEvent('fid', {
          value: entry.processingStart - entry.startTime,
          timestamp: new Date().toISOString()
        });
      });
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach(entry => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      this.trackEvent('cls', {
        value: clsValue,
        timestamp: new Date().toISOString()
      });
    }).observe({ entryTypes: ['layout-shift'] });
  }

  trackResourceLoading() {
    const resources = performance.getEntriesByType('resource');
    resources.forEach(resource => {
      this.trackEvent('resource_load', {
        name: resource.name,
        duration: resource.duration,
        size: resource.transferSize,
        type: resource.initiatorType,
        timestamp: new Date().toISOString()
      });
    });
  }

  trackCustomMetrics() {
    // Track page load time
    window.addEventListener('load', () => {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      this.trackEvent('page_load_time', {
        value: loadTime,
        timestamp: new Date().toISOString()
      });
    });

    // Track DOM content loaded time
    document.addEventListener('DOMContentLoaded', () => {
      const domContentLoadedTime = performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart;
      this.trackEvent('dom_content_loaded_time', {
        value: domContentLoadedTime,
        timestamp: new Date().toISOString()
      });
    });
  }

  trackErrors() {
    // Track JavaScript errors
    window.addEventListener('error', (e) => {
      this.trackEvent('javascript_error', {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
        timestamp: new Date().toISOString()
      });
      this.metrics.errors.push({
        type: 'javascript_error',
        message: e.message,
        timestamp: new Date().toISOString()
      });
    });

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (e) => {
      this.trackEvent('unhandled_promise_rejection', {
        reason: e.reason,
        timestamp: new Date().toISOString()
      });
      this.metrics.errors.push({
        type: 'unhandled_promise_rejection',
        reason: e.reason,
        timestamp: new Date().toISOString()
      });
    });
  }

  trackEvent(eventType, eventData) {
    const event = {
      type: eventType,
      data: eventData,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      page: this.getCurrentPage()
    };

    this.events.push(event);
    
    // Send event immediately for critical events
    if (['javascript_error', 'unhandled_promise_rejection'].includes(eventType)) {
      this.sendEvent(event);
    }
  }

  trackFeedback(rating) {
    const count = this.metrics.feedback.get(rating) || 0;
    this.metrics.feedback.set(rating, count + 1);
    
    this.trackEvent('feedback', {
      rating,
      timestamp: new Date().toISOString()
    });
  }

  trackSearchQuery(query) {
    if (query.length > 2) {
      this.metrics.searchQueries.push({
        query,
        timestamp: new Date().toISOString()
      });
    }
  }

  trackExampleExecution(exampleId) {
    const count = this.metrics.exampleExecutions.get(exampleId) || 0;
    this.metrics.exampleExecutions.set(exampleId, count + 1);
    
    this.trackEvent('example_execution', {
      exampleId,
      timestamp: new Date().toISOString()
    });
  }

  setupPeriodicTransmission() {
    // Send analytics data every 30 seconds
    setInterval(() => {
      this.sendAnalyticsData();
    }, 30000);

    // Send data on page unload
    window.addEventListener('beforeunload', () => {
      this.sendAnalyticsData();
    });
  }

  async sendEvent(event) {
    try {
      // In a real implementation, this would send to an analytics service
      console.log('📊 Analytics Event:', event);
      
      // For now, just store locally
      this.storeEventLocally(event);
    } catch (error) {
      console.warn('⚠️  Failed to send analytics event:', error);
    }
  }

  async sendAnalyticsData() {
    if (this.events.length === 0) return;

    try {
      const analyticsData = {
        sessionId: this.sessionId,
        sessionDuration: Date.now() - this.startTime,
        events: this.events,
        metrics: {
          pageViews: Object.fromEntries(this.metrics.pageViews),
          feedback: Object.fromEntries(this.metrics.feedback),
          exampleExecutions: Object.fromEntries(this.metrics.exampleExecutions),
          timeOnPage: Object.fromEntries(this.metrics.timeOnPage),
          scrollDepth: Object.fromEntries(this.metrics.scrollDepth),
          searchQueries: this.metrics.searchQueries,
          clickEvents: this.metrics.clickEvents,
          errors: this.metrics.errors
        },
        timestamp: new Date().toISOString()
      };

      // In a real implementation, this would send to an analytics service
      console.log('📊 Sending Analytics Data:', analyticsData);
      
      // Store locally for now
      this.storeAnalyticsLocally(analyticsData);
      
      // Clear sent events
      this.events = [];
    } catch (error) {
      console.warn('⚠️  Failed to send analytics data:', error);
    }
  }

  storeEventLocally(event) {
    try {
      const stored = JSON.parse(localStorage.getItem('guide_analytics_events') || '[]');
      stored.push(event);
      localStorage.setItem('guide_analytics_events', JSON.stringify(stored.slice(-1000))); // Keep last 1000 events
    } catch (error) {
      console.warn('⚠️  Failed to store event locally:', error);
    }
  }

  storeAnalyticsLocally(data) {
    try {
      const stored = JSON.parse(localStorage.getItem('guide_analytics_sessions') || '[]');
      stored.push(data);
      localStorage.setItem('guide_analytics_sessions', JSON.stringify(stored.slice(-100))); // Keep last 100 sessions
    } catch (error) {
      console.warn('⚠️  Failed to store analytics locally:', error);
    }
  }

  getCurrentPage() {
    const path = window.location.pathname;
    return path.split('/').pop() || 'index';
  }

  getAnalyticsSummary() {
    return {
      sessionId: this.sessionId,
      sessionDuration: Date.now() - this.startTime,
      totalEvents: this.events.length,
      pageViews: Object.fromEntries(this.metrics.pageViews),
      feedback: Object.fromEntries(this.metrics.feedback),
      exampleExecutions: Object.fromEntries(this.metrics.exampleExecutions),
      searchQueries: this.metrics.searchQueries.length,
      errors: this.metrics.errors.length
    };
  }

  exportAnalytics() {
    const data = {
      sessionId: this.sessionId,
      sessionDuration: Date.now() - this.startTime,
      events: this.events,
      metrics: {
        pageViews: Object.fromEntries(this.metrics.pageViews),
        feedback: Object.fromEntries(this.metrics.feedback),
        exampleExecutions: Object.fromEntries(this.metrics.exampleExecutions),
        timeOnPage: Object.fromEntries(this.metrics.timeOnPage),
        scrollDepth: Object.fromEntries(this.metrics.scrollDepth),
        searchQueries: this.metrics.searchQueries,
        clickEvents: this.metrics.clickEvents,
        errors: this.metrics.errors
      },
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guide-analytics-${this.sessionId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// Initialize analytics when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.guideAnalytics = new GuideAnalytics();
});

// Export for global access
window.GuideAnalytics = GuideAnalytics;
