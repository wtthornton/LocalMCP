/**
 * Search Functionality for User Guide
 * 
 * Phase 6: Advanced search with Context7 integration
 * 
 * Benefits for vibe coders:
 * - Instant search results
 * - Context-aware suggestions
 * - Search analytics
 * - Offline search capability
 */

class SearchEngine {
  constructor() {
    this.searchIndex = null;
    this.searchHistory = [];
    this.searchCache = new Map();
    this.init();
  }

  async init() {
    console.log('🔍 Initializing Search Engine...');
    
    // Load search index
    await this.loadSearchIndex();
    
    // Initialize search UI
    this.initSearchUI();
    
    // Initialize search analytics
    this.initSearchAnalytics();
    
    console.log('✅ Search Engine initialized');
  }

  async loadSearchIndex() {
    try {
      const response = await fetch('search-index.json');
      this.searchIndex = await response.json();
      console.log('📚 Search index loaded:', this.searchIndex.pages.length, 'pages');
    } catch (error) {
      console.warn('⚠️  Search index not available:', error);
      // Create fallback index
      this.createFallbackIndex();
    }
  }

  createFallbackIndex() {
    // Create a basic search index from page content
    this.searchIndex = {
      pages: Array.from(document.querySelectorAll('.guide-card')).map(card => ({
        id: card.querySelector('a')?.href.split('/').pop() || 'unknown',
        title: card.querySelector('h3')?.textContent || 'Untitled',
        content: card.textContent || '',
        tags: Array.from(card.querySelectorAll('.tag')).map(tag => tag.textContent),
        difficulty: card.dataset.difficulty || 'beginner'
      }))
    };
  }

  initSearchUI() {
    // Create search container
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    searchContainer.innerHTML = `
      <div class="search-input-container">
        <input type="text" class="search-input" placeholder="Search the guide..." autocomplete="off">
        <button class="search-clear" style="display: none;">✕</button>
      </div>
      <div class="search-results"></div>
      <div class="search-suggestions"></div>
    `;

    // Insert search container
    const content = document.querySelector('.content');
    if (content) {
      content.insertBefore(searchContainer, content.firstChild);
    }

    // Initialize search functionality
    this.initSearchInput();
    this.initSearchSuggestions();
  }

  initSearchInput() {
    const searchInput = document.querySelector('.search-input');
    const searchResults = document.querySelector('.search-results');
    const searchClear = document.querySelector('.search-clear');

    let searchTimeout;
    let currentQuery = '';

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      currentQuery = query;

      // Clear previous timeout
      clearTimeout(searchTimeout);

      if (query.length === 0) {
        this.hideSearchResults();
        searchClear.style.display = 'none';
        return;
      }

      // Show clear button
      searchClear.style.display = 'block';

      // Debounce search
      searchTimeout = setTimeout(() => {
        this.performSearch(query, searchResults);
      }, 300);
    });

    // Clear search
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      searchClear.style.display = 'none';
      this.hideSearchResults();
    });

    // Handle keyboard navigation
    searchInput.addEventListener('keydown', (e) => {
      this.handleSearchKeyboard(e, searchResults);
    });

    // Focus management
    searchInput.addEventListener('focus', () => {
      if (currentQuery) {
        this.showSearchResults(searchResults);
      }
    });
  }

  initSearchSuggestions() {
    const suggestions = [
      'getting started',
      'quick start',
      'tool reference',
      'pipeline guide',
      'admin console',
      'troubleshooting',
      'deployment',
      'customization',
      'API reference',
      'advanced features'
    ];

    const searchInput = document.querySelector('.search-input');
    const suggestionsContainer = document.querySelector('.search-suggestions');

    searchInput.addEventListener('focus', () => {
      if (searchInput.value.length === 0) {
        this.showSuggestions(suggestions, suggestionsContainer);
      }
    });

    searchInput.addEventListener('blur', () => {
      // Delay hiding to allow clicking on suggestions
      setTimeout(() => {
        this.hideSuggestions(suggestionsContainer);
      }, 200);
    });
  }

  showSuggestions(suggestions, container) {
    container.innerHTML = suggestions.map(suggestion => `
      <div class="suggestion-item" data-suggestion="${suggestion}">
        ${suggestion}
      </div>
    `).join('');

    container.style.display = 'block';

    // Add click handlers
    container.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        const searchInput = document.querySelector('.search-input');
        searchInput.value = item.dataset.suggestion;
        searchInput.focus();
        this.performSearch(item.dataset.suggestion, document.querySelector('.search-results'));
        this.hideSuggestions(container);
      });
    });
  }

  hideSuggestions(container) {
    container.style.display = 'none';
  }

  async performSearch(query, resultsContainer) {
    if (!this.searchIndex) {
      this.showNoResults(resultsContainer, 'Search index not available');
      return;
    }

    // Check cache first
    if (this.searchCache.has(query)) {
      this.displayResults(this.searchCache.get(query), resultsContainer);
      return;
    }

    // Perform search
    const results = this.searchPages(query);
    
    // Cache results
    this.searchCache.set(query, results);
    
    // Display results
    this.displayResults(results, resultsContainer);
    
    // Track search
    this.trackSearch(query, results.length);
  }

  searchPages(query) {
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    
    return this.searchIndex.pages
      .map(page => {
        const score = this.calculateRelevanceScore(page, searchTerms);
        return { ...page, score };
      })
      .filter(page => page.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  calculateRelevanceScore(page, searchTerms) {
    let score = 0;
    const title = page.title.toLowerCase();
    const content = page.content.toLowerCase();
    const tags = page.tags.map(tag => tag.toLowerCase());

    searchTerms.forEach(term => {
      // Title matches (highest weight)
      if (title.includes(term)) {
        score += 10;
      }

      // Tag matches (high weight)
      if (tags.some(tag => tag.includes(term))) {
        score += 8;
      }

      // Content matches (medium weight)
      const contentMatches = (content.match(new RegExp(term, 'g')) || []).length;
      score += contentMatches * 2;

      // Exact phrase matches (bonus)
      if (content.includes(term)) {
        score += 5;
      }
    });

    return score;
  }

  displayResults(results, container) {
    if (results.length === 0) {
      this.showNoResults(container, 'No results found');
      return;
    }

    container.innerHTML = results.map(result => `
      <div class="search-result" data-page="${result.id}">
        <h4>${this.highlightSearchTerms(result.title, this.getLastQuery())}</h4>
        <p>${this.highlightSearchTerms(this.truncateContent(result.content), this.getLastQuery())}</p>
        <div class="search-meta">
          <span class="difficulty difficulty-${result.difficulty}">${result.difficulty}</span>
          ${result.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
      </div>
    `).join('');

    // Add click handlers
    container.querySelectorAll('.search-result').forEach(result => {
      result.addEventListener('click', () => {
        const pageId = result.dataset.page;
        window.location.href = `${pageId}.html`;
      });
    });

    this.showSearchResults(container);
  }

  showNoResults(container, message) {
    container.innerHTML = `
      <div class="no-results">
        <p>${message}</p>
        <div class="search-tips">
          <h4>Search Tips:</h4>
          <ul>
            <li>Try different keywords</li>
            <li>Check spelling</li>
            <li>Use more general terms</li>
            <li>Browse the guide sections</li>
          </ul>
        </div>
      </div>
    `;
    this.showSearchResults(container);
  }

  highlightSearchTerms(text, query) {
    if (!query) return text;
    
    const terms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    let highlighted = text;
    
    terms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlighted = highlighted.replace(regex, '<mark>$1</mark>');
    });
    
    return highlighted;
  }

  truncateContent(content, maxLength = 200) {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }

  showSearchResults(container) {
    container.style.display = 'block';
    container.classList.add('active');
  }

  hideSearchResults() {
    const container = document.querySelector('.search-results');
    if (container) {
      container.style.display = 'none';
      container.classList.remove('active');
    }
  }

  handleSearchKeyboard(e, resultsContainer) {
    const results = resultsContainer.querySelectorAll('.search-result');
    const activeResult = resultsContainer.querySelector('.search-result.active');
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.navigateResults(results, activeResult, 'down');
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.navigateResults(results, activeResult, 'up');
        break;
      case 'Enter':
        e.preventDefault();
        if (activeResult) {
          activeResult.click();
        }
        break;
      case 'Escape':
        this.hideSearchResults();
        break;
    }
  }

  navigateResults(results, activeResult, direction) {
    const currentIndex = activeResult ? Array.from(results).indexOf(activeResult) : -1;
    let newIndex;
    
    if (direction === 'down') {
      newIndex = currentIndex < results.length - 1 ? currentIndex + 1 : 0;
    } else {
      newIndex = currentIndex > 0 ? currentIndex - 1 : results.length - 1;
    }
    
    // Remove active class from current result
    if (activeResult) {
      activeResult.classList.remove('active');
    }
    
    // Add active class to new result
    if (results[newIndex]) {
      results[newIndex].classList.add('active');
      results[newIndex].scrollIntoView({ block: 'nearest' });
    }
  }

  initSearchAnalytics() {
    // Track search performance
    this.searchMetrics = {
      totalSearches: 0,
      successfulSearches: 0,
      averageResults: 0,
      popularQueries: new Map()
    };
  }

  trackSearch(query, resultCount) {
    this.searchMetrics.totalSearches++;
    this.searchMetrics.successfulSearches += resultCount > 0 ? 1 : 0;
    
    // Update average results
    const totalResults = this.searchMetrics.averageResults * (this.searchMetrics.totalSearches - 1) + resultCount;
    this.searchMetrics.averageResults = totalResults / this.searchMetrics.totalSearches;
    
    // Track popular queries
    const count = this.searchMetrics.popularQueries.get(query) || 0;
    this.searchMetrics.popularQueries.set(query, count + 1);
    
    // Add to search history
    this.searchHistory.push({
      query,
      resultCount,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 50 searches
    if (this.searchHistory.length > 50) {
      this.searchHistory = this.searchHistory.slice(-50);
    }
  }

  getLastQuery() {
    return this.searchHistory.length > 0 ? 
      this.searchHistory[this.searchHistory.length - 1].query : '';
  }

  getSearchMetrics() {
    return {
      ...this.searchMetrics,
      popularQueries: Object.fromEntries(this.searchMetrics.popularQueries),
      searchHistory: this.searchHistory
    };
  }
}

// Initialize search when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new SearchEngine();
});

// Export for global access
window.SearchEngine = SearchEngine;
