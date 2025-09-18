/**
 * Interactive User Guide JavaScript
 * 
 * Phase 6: Interactive features for the comprehensive user guide
 * 
 * Benefits for vibe coders:
 * - Interactive code examples
 * - Real-time feedback
 * - Search functionality
 * - Analytics tracking
 * - Offline capabilities
 */

class InteractiveGuide {
  constructor() {
    this.searchIndex = null;
    this.analytics = new Analytics();
    this.init();
  }

  async init() {
    console.log('🚀 Initializing Interactive Guide...');
    
    // Load search index
    await this.loadSearchIndex();
    
    // Initialize interactive examples
    this.initInteractiveExamples();
    
    // Initialize search functionality
    this.initSearch();
    
    // Initialize feedback system
    this.initFeedback();
    
    // Initialize PWA features
    this.initPWA();
    
    // Track page view
    this.analytics.trackPageView();
    
    console.log('✅ Interactive Guide initialized');
  }

  async loadSearchIndex() {
    try {
      const response = await fetch('search-index.json');
      this.searchIndex = await response.json();
      console.log('📚 Search index loaded');
    } catch (error) {
      console.warn('⚠️  Search index not available:', error);
    }
  }

  initInteractiveExamples() {
    const examples = document.querySelectorAll('.example-card');
    
    examples.forEach(example => {
      const runBtn = example.querySelector('.run-example-btn');
      if (runBtn) {
        runBtn.addEventListener('click', () => this.runExample(example));
      }
    });
  }

  async runExample(exampleCard) {
    const exampleId = exampleCard.dataset.exampleId;
    const runBtn = exampleCard.querySelector('.run-example-btn');
    const expectedOutput = exampleCard.querySelector('.expected-output');
    
    if (!runBtn || !expectedOutput) return;

    // Disable button and show loading
    runBtn.disabled = true;
    runBtn.textContent = 'Running...';
    exampleCard.classList.add('loading');

    try {
      // Simulate code execution
      await this.simulateCodeExecution(exampleCard);
      
      // Show expected output
      expectedOutput.style.display = 'block';
      expectedOutput.scrollIntoView({ behavior: 'smooth' });
      
      // Track example execution
      this.analytics.trackExampleExecution(exampleId);
      
    } catch (error) {
      console.error('Example execution failed:', error);
      this.showError(exampleCard, error.message);
    } finally {
      // Re-enable button
      runBtn.disabled = false;
      runBtn.textContent = 'Run Example';
      exampleCard.classList.remove('loading');
    }
  }

  async simulateCodeExecution(exampleCard) {
    const code = exampleCard.querySelector('code').textContent;
    const language = exampleCard.querySelector('code').className.match(/language-(\w+)/)?.[1];
    
    // Simulate different execution times based on language
    const executionTime = this.getExecutionTime(language);
    await new Promise(resolve => setTimeout(resolve, executionTime));
    
    // Simulate success/failure based on code content
    if (code.includes('error') || code.includes('fail')) {
      throw new Error('Code execution failed: Syntax error detected');
    }
  }

  getExecutionTime(language) {
    const times = {
      'bash': 1000,
      'javascript': 800,
      'typescript': 1200,
      'json': 500,
      'python': 1500,
      'go': 2000
    };
    return times[language] || 1000;
  }

  showError(exampleCard, message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-output';
    errorDiv.innerHTML = `
      <h4>❌ Execution Error</h4>
      <pre><code>${message}</code></pre>
    `;
    
    const explanation = exampleCard.querySelector('.explanation');
    explanation.parentNode.insertBefore(errorDiv, explanation.nextSibling);
    
    // Remove error after 5 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 5000);
  }

  initSearch() {
    const searchInput = document.querySelector('.search-input');
    if (!searchInput) return;

    const searchResults = document.createElement('div');
    searchResults.className = 'search-results';
    searchResults.style.display = 'none';
    
    searchInput.parentNode.appendChild(searchResults);

    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.performSearch(e.target.value, searchResults);
      }, 300);
    });

    // Hide results when clicking outside
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.style.display = 'none';
      }
    });
  }

  performSearch(query, resultsContainer) {
    if (!this.searchIndex || !query.trim()) {
      resultsContainer.style.display = 'none';
      return;
    }

    const results = this.searchIndex.pages.filter(page => 
      page.title.toLowerCase().includes(query.toLowerCase()) ||
      page.content.toLowerCase().includes(query.toLowerCase()) ||
      page.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    ).slice(0, 5);

    if (results.length === 0) {
      resultsContainer.innerHTML = '<div class="search-result"><p>No results found</p></div>';
    } else {
      resultsContainer.innerHTML = results.map(result => `
        <div class="search-result" onclick="window.location.href='${result.id}.html'">
          <h4>${result.title}</h4>
          <p>${this.highlightSearchTerms(result.content, query)}</p>
        </div>
      `).join('');
    }

    resultsContainer.style.display = 'block';
    
    // Track search query
    this.analytics.trackSearch(query);
  }

  highlightSearchTerms(content, query) {
    const terms = query.toLowerCase().split(' ').filter(term => term.length > 2);
    let highlighted = content;
    
    terms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlighted = highlighted.replace(regex, '<mark>$1</mark>');
    });
    
    return highlighted.substring(0, 200) + '...';
  }

  initFeedback() {
    const feedbackBtns = document.querySelectorAll('.feedback-btn');
    
    feedbackBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const rating = parseInt(btn.dataset.rating);
        
        // Remove previous selection
        feedbackBtns.forEach(b => b.classList.remove('selected'));
        
        // Add selection to clicked button
        btn.classList.add('selected');
        
        // Track feedback
        this.analytics.trackFeedback(rating);
        
        // Show thank you message
        this.showThankYou();
      });
    });
  }

  showThankYou() {
    const thankYou = document.createElement('div');
    thankYou.className = 'thank-you-message';
    thankYou.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #238636;
        color: white;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 1000;
      ">
        <p>Thank you for your feedback! 🙏</p>
      </div>
    `;
    
    document.body.appendChild(thankYou);
    
    setTimeout(() => {
      if (thankYou.parentNode) {
        thankYou.parentNode.removeChild(thankYou);
      }
    }, 3000);
  }

  initPWA() {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js')
        .then(registration => {
          console.log('📱 Service Worker registered:', registration);
        })
        .catch(error => {
          console.warn('⚠️  Service Worker registration failed:', error);
        });
    }

    // Add install prompt
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      this.showInstallPrompt(deferredPrompt);
    });

    // Track PWA usage
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.analytics.trackPWAUsage();
    }
  }

  showInstallPrompt(deferredPrompt) {
    const installBtn = document.createElement('button');
    installBtn.textContent = '📱 Install App';
    installBtn.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #58a6ff;
      color: white;
      border: none;
      padding: 1rem;
      border-radius: 8px;
      cursor: pointer;
      z-index: 1000;
    `;
    
    installBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log('PWA install outcome:', outcome);
        deferredPrompt = null;
        installBtn.remove();
      }
    });
    
    document.body.appendChild(installBtn);
  }
}

class Analytics {
  constructor() {
    this.data = {
      pageViews: new Map(),
      searchQueries: [],
      feedback: new Map(),
      exampleExecutions: new Map(),
      pwaUsage: false
    };
  }

  trackPageView() {
    const page = window.location.pathname.split('/').pop() || 'index';
    const count = this.data.pageViews.get(page) || 0;
    this.data.pageViews.set(page, count + 1);
    
    console.log('📊 Page view tracked:', page);
  }

  trackSearch(query) {
    this.data.searchQueries.push({
      query,
      timestamp: new Date().toISOString()
    });
    
    console.log('🔍 Search tracked:', query);
  }

  trackFeedback(rating) {
    const count = this.data.feedback.get(rating) || 0;
    this.data.feedback.set(rating, count + 1);
    
    console.log('👍 Feedback tracked:', rating);
  }

  trackExampleExecution(exampleId) {
    const count = this.data.exampleExecutions.get(exampleId) || 0;
    this.data.exampleExecutions.set(exampleId, count + 1);
    
    console.log('▶️  Example execution tracked:', exampleId);
  }

  trackPWAUsage() {
    this.data.pwaUsage = true;
    console.log('📱 PWA usage tracked');
  }

  getAnalytics() {
    return {
      pageViews: Object.fromEntries(this.data.pageViews),
      searchQueries: this.data.searchQueries,
      feedback: Object.fromEntries(this.data.feedback),
      exampleExecutions: Object.fromEntries(this.data.exampleExecutions),
      pwaUsage: this.data.pwaUsage
    };
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new InteractiveGuide();
});

// Export for global access
window.InteractiveGuide = InteractiveGuide;
window.Analytics = Analytics;
