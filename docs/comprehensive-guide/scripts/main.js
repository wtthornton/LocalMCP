/**
 * Main User Guide JavaScript
 * 
 * Phase 6: Core functionality for the comprehensive user guide
 * 
 * Benefits for vibe coders:
 * - Smooth navigation
 * - Responsive design
 * - Performance optimization
 * - Accessibility features
 */

class MainGuide {
  constructor() {
    this.currentPage = this.getCurrentPage();
    this.init();
  }

  init() {
    console.log('🚀 Initializing Main Guide...');
    
    // Initialize navigation
    this.initNavigation();
    
    // Initialize responsive design
    this.initResponsive();
    
    // Initialize performance optimizations
    this.initPerformance();
    
    // Initialize accessibility features
    this.initAccessibility();
    
    // Initialize theme switching
    this.initTheme();
    
    console.log('✅ Main Guide initialized');
  }

  initNavigation() {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });

    // Active page highlighting
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-menu a');
    
    navLinks.forEach(link => {
      if (link.getAttribute('href') === currentPath.split('/').pop()) {
        link.classList.add('active');
      }
    });

    // Mobile menu toggle
    this.initMobileMenu();
  }

  initMobileMenu() {
    const mobileMenuBtn = document.createElement('button');
    mobileMenuBtn.className = 'mobile-menu-btn';
    mobileMenuBtn.innerHTML = '☰';
    mobileMenuBtn.style.cssText = `
      display: none;
      background: none;
      border: none;
      color: #e6edf3;
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0.5rem;
    `;

    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.insertBefore(mobileMenuBtn, sidebar.firstChild);
      
      mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
      });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
        sidebar.classList.remove('mobile-open');
      }
    });
  }

  initResponsive() {
    // Add responsive styles
    const style = document.createElement('style');
    style.textContent = `
      @media (max-width: 768px) {
        .mobile-menu-btn {
          display: block !important;
        }
        
        .sidebar {
          position: fixed;
          left: -250px;
          transition: left 0.3s ease;
          z-index: 1000;
        }
        
        .sidebar.mobile-open {
          left: 0;
        }
        
        .content {
          margin-left: 0;
          padding: 1rem;
        }
        
        .hero-stats {
          flex-direction: column;
          gap: 1rem;
        }
        
        .guide-grid {
          grid-template-columns: 1fr;
        }
        
        .features-grid {
          grid-template-columns: 1fr;
        }
      }
    `;
    document.head.appendChild(style);
  }

  initPerformance() {
    // Lazy load images
    this.lazyLoadImages();
    
    // Preload critical resources
    this.preloadCriticalResources();
    
    // Optimize scroll performance
    this.optimizeScroll();
  }

  lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  }

  preloadCriticalResources() {
    const criticalPages = ['getting-started.html', 'quick-start.html', 'tool-reference.html'];
    
    criticalPages.forEach(page => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = page;
      document.head.appendChild(link);
    });
  }

  optimizeScroll() {
    let ticking = false;
    
    const updateScrollPosition = () => {
      // Add scroll-based animations or effects here
      ticking = false;
    };
    
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollPosition);
        ticking = true;
      }
    });
  }

  initAccessibility() {
    // Skip to content link
    this.addSkipToContent();
    
    // Keyboard navigation
    this.initKeyboardNavigation();
    
    // ARIA labels and roles
    this.enhanceARIA();
    
    // Focus management
    this.initFocusManagement();
  }

  addSkipToContent() {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #58a6ff;
      color: white;
      padding: 8px;
      text-decoration: none;
      border-radius: 4px;
      z-index: 1000;
    `;
    
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });
    
    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  initKeyboardNavigation() {
    // Tab navigation enhancement
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    });
    
    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });
  }

  enhanceARIA() {
    // Add ARIA labels to interactive elements
    const buttons = document.querySelectorAll('button:not([aria-label])');
    buttons.forEach(button => {
      if (!button.textContent.trim()) {
        button.setAttribute('aria-label', 'Button');
      }
    });
    
    // Add role attributes
    const main = document.querySelector('main');
    if (main) {
      main.setAttribute('role', 'main');
      main.id = 'main-content';
    }
  }

  initFocusManagement() {
    // Trap focus in modals (if any)
    this.initFocusTrap();
    
    // Focus restoration
    this.initFocusRestoration();
  }

  initFocusTrap() {
    // Implementation for focus trapping in modals
    // This would be used if modals are added in the future
  }

  initFocusRestoration() {
    // Restore focus when navigating back
    window.addEventListener('pageshow', (e) => {
      if (e.persisted) {
        // Page was loaded from cache, restore focus
        const lastFocused = sessionStorage.getItem('lastFocused');
        if (lastFocused) {
          const element = document.querySelector(lastFocused);
          if (element) {
            element.focus();
          }
        }
      }
    });
    
    // Save focus when navigating away
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.id) {
          sessionStorage.setItem('lastFocused', `#${activeElement.id}`);
        }
      }
    });
  }

  initTheme() {
    // Theme switching functionality
    const themeToggle = document.createElement('button');
    themeToggle.className = 'theme-toggle';
    themeToggle.innerHTML = '🌙';
    themeToggle.title = 'Toggle theme';
    themeToggle.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #161b22;
      border: 1px solid #30363d;
      color: #e6edf3;
      padding: 0.5rem;
      border-radius: 50%;
      cursor: pointer;
      z-index: 1000;
    `;
    
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    this.applyTheme(savedTheme);
    
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      this.applyTheme(newTheme);
      localStorage.setItem('theme', newTheme);
    });
    
    document.body.appendChild(themeToggle);
  }

  applyTheme(theme) {
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(`${theme}-theme`);
    
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
      themeToggle.innerHTML = theme === 'dark' ? '☀️' : '🌙';
    }
  }

  getCurrentPage() {
    const path = window.location.pathname;
    return path.split('/').pop() || 'index';
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new MainGuide();
});

// Export for global access
window.MainGuide = MainGuide;
