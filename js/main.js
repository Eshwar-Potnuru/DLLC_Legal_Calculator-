/* ===================================================================
   MAIN APPLICATION FILE
   Application initialization, global functions, and event coordination
   =================================================================== */

// Application state
const App = {
    isCalculatorOpen: false,
    activeCalculator: null,
    currentUser: null,
    sessionData: {},
    version: CONFIG.APP.VERSION
};

/**
 * Initialize the application
 */
function initApp() {
    console.log(`${CONFIG.APP.NAME} v${CONFIG.APP.VERSION} - Initializing...`);
    
    // Initialize core components
    initializeComponents();
    
    // Setup global event listeners
    setupGlobalEvents();
    
    // Setup contact form
    setupContactForm();
    
    // Initialize scroll effects
    initScrollEffects();
    
    // Initialize animations
    initAnimations();
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts();
    
    // Mark app as ready
    document.body.classList.add('app-ready');
    
    console.log('Application initialized successfully');
}

/**
 * Initialize core components
 */
function initializeComponents() {
    // Calculator is initialized in calculator.js
    // Legal fee calculator is initialized in legal-fee-calculator.js
    // UI Manager is initialized in ui-manager.js

    // Setup calculator modals
    setupCalculatorSelectorModal();
    setupCalculatorModal();
    setupFeeCalculatorModal();
}

/**
 * Setup calculator selector modal
 */
function setupCalculatorSelectorModal() {
    const modal = document.getElementById('calculatorSelectorModal');
    if (!modal) return;

    modal.style.display = 'none';

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeCalculatorSelector();
        }
    });
}

/**
 * Setup calculator modal
 */
function setupCalculatorModal() {
    const modal = document.getElementById('calculatorModal');
    if (!modal) return;

    // Initialize as hidden
    modal.style.display = 'none';
    
    // Add custom close handlers
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeCalculator();
        }
    });
}

/**
 * Setup legal fee calculator modal
 */
function setupFeeCalculatorModal() {
    const modal = document.getElementById('feeCalculatorModal');
    if (!modal) return;

    modal.style.display = 'none';

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeFeeCalculator();
        }
    });
}

/**
 * Open modal helper
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);

    document.body.style.overflow = 'hidden';
    App.isCalculatorOpen = true;
}

/**
 * Close modal helper
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.remove('active');
    setTimeout(() => {
        modal.style.display = 'none';
        if (!document.querySelector('.modal-overlay.active')) {
            document.body.style.overflow = '';
            App.isCalculatorOpen = false;
            App.activeCalculator = null;
        }
    }, 300);
}

/**
 * Open calculator selector modal
 */
function openCalculator() {
    openModal('calculatorSelectorModal');
    App.activeCalculator = 'selector';

    const modal = document.getElementById('calculatorSelectorModal');
    const firstInput = modal ? modal.querySelector('button.btn-primary, button.btn-secondary') : null;
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 300);
    }

    trackEvent('calculator_selector_opened');
}

/**
 * Close calculator selector modal
 */
function closeCalculatorSelector() {
    closeModal('calculatorSelectorModal');
    trackEvent('calculator_selector_closed');
}

/**
 * Open accident legal coverage calculator modal
 */
function openCoverageCalculator() {
    closeCalculatorSelector();
    openModal('calculatorModal');
    App.activeCalculator = 'coverage';

    const modal = document.getElementById('calculatorModal');
    const firstInput = modal ? modal.querySelector('.form-input') : null;
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 300);
    }

    trackEvent('coverage_calculator_opened');
}

/**
 * Open legal fee calculator modal
 */
function openFeeCalculator() {
    closeCalculatorSelector();
    openModal('feeCalculatorModal');
    App.activeCalculator = 'fee';

    if (window.legalFeeCalculator && typeof window.legalFeeCalculator.reset === 'function') {
        window.legalFeeCalculator.reset();
    }

    const modal = document.getElementById('feeCalculatorModal');
    const firstInput = modal ? modal.querySelector('#feeName') : null;
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 300);
    }

    trackEvent('fee_calculator_opened');
}

/**
 * Close coverage calculator modal
 */
function closeCalculator() {
    closeModal('calculatorModal');
    trackEvent('coverage_calculator_closed');
}

/**
 * Close legal fee calculator modal
 */
function closeFeeCalculator() {
    closeModal('feeCalculatorModal');
    trackEvent('fee_calculator_closed');
}

/**
 * Setup global event listeners
 */
function setupGlobalEvents() {
    setupCalculatorsDropdown();

    setupMobileNavigation();

    // Smooth scrolling for anchor links
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href^="#"]');
        if (link) {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const target = document.getElementById(targetId);
            if (target) {
                UIManager.scrollToElement(target);
            }
        }
    });

    // Handle navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                scrollToSection(href.substring(1));
            }
        });
    });

    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            handleWindowResize();
        }, 250);
    });

    // Handle scroll events
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            handleScroll();
        }, 10);
    });
}

/**
 * Setup calculators dropdown in header navigation
 */
function setupCalculatorsDropdown() {
    const dropdown = document.getElementById('calculatorsDropdown');
    const toggle = document.getElementById('calculatorsDropdownToggle');
    const menu = document.getElementById('calculatorsDropdownMenu');

    if (!dropdown || !toggle || !menu) {
        return;
    }

    const setOpen = (isOpen) => {
        dropdown.classList.toggle('open', isOpen);
        toggle.setAttribute('aria-expanded', String(isOpen));
    };

    toggle.addEventListener('click', (event) => {
        event.preventDefault();
        setOpen(!dropdown.classList.contains('open'));
    });

    menu.addEventListener('click', () => {
        setOpen(false);
    });

    document.addEventListener('click', (event) => {
        if (!dropdown.contains(event.target)) {
            setOpen(false);
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            setOpen(false);
        }
    });
}

/**
 * Setup contact form
 */
function setupContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!UIManager.validateForm(contactForm)) {
            return;
        }

        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData.entries());
        
        try {
            UIManager.showLoading('Sending message...');
            
            // Simulate API call (replace with actual endpoint)
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            UIManager.hideLoading();
            UIManager.showToast('Message sent successfully! We\'ll get back to you soon.', 'success');
            contactForm.reset();
            
            // Track analytics
            trackEvent('contact_form_submitted');
            
        } catch (error) {
            UIManager.hideLoading();
            UIManager.showToast('Failed to send message. Please try again.', 'error');
            console.error('Contact form error:', error);
        }
    });
}

/**
 * Initialize scroll effects
 */
function initScrollEffects() {
    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.feature-card, .hero-card, .contact-form').forEach(el => {
        observer.observe(el);
    });
}

/**
 * Setup keyboard shortcuts
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K to open calculator
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            if (!App.isCalculatorOpen) {
                openCalculator();
            }
        }
        
        // Escape to close modals
        if (e.key === 'Escape') {
            if (document.getElementById('aiChatModal')?.classList.contains('active')) {
                closeAIChat();
            } else if (document.getElementById('feeCalculatorModal')?.classList.contains('active')) {
                closeFeeCalculator();
            } else if (document.getElementById('calculatorModal')?.classList.contains('active')) {
                closeCalculator();
            } else if (document.getElementById('calculatorSelectorModal')?.classList.contains('active')) {
                closeCalculatorSelector();
            }
        }
    });
}

/**
 * Handle window resize
 */
function handleWindowResize() {
    // Update mobile navigation if needed
    updateMobileNavigation();
    
    // Adjust modal positioning
    if (App.isCalculatorOpen) {
        adjustModalPosition();
    }
}

/**
 * Handle scroll events
 */
function handleScroll() {
    // Update header style on scroll
    updateHeaderOnScroll();
    
    // Update active navigation item
    updateActiveNavigation();
}

/**
 * Update header style on scroll
 */
function updateHeaderOnScroll() {
    const header = document.querySelector('.header');
    if (!header) return;

    if (window.scrollY > 100) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
}

/**
 * Update active navigation item
 */
function updateActiveNavigation() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let currentSection = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.offsetHeight;
        
        if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
            currentSection = section.id;
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSection}`) {
            link.classList.add('active');
        }
    });
}

/**
 * Setup mobile navigation toggle and interactions
 */
function setupMobileNavigation() {
    const headerContent = document.querySelector('.header-content');
    const toggle = document.getElementById('mobileNavToggle');
    const nav = document.getElementById('primaryNavigation');

    if (!headerContent || !toggle || !nav) {
        return;
    }

    const setOpen = (isOpen) => {
        headerContent.classList.toggle('mobile-nav-open', isOpen);
        toggle.setAttribute('aria-expanded', String(isOpen));
    };

    toggle.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        setOpen(!headerContent.classList.contains('mobile-nav-open'));
    });

    nav.addEventListener('click', (event) => {
        if (window.innerWidth > 767.98) {
            return;
        }

        const target = event.target.closest('.nav-link, .nav-dropdown-item');
        if (!target) {
            return;
        }

        const isDropdownToggle = target.classList.contains('nav-dropdown-toggle');
        if (isDropdownToggle) {
            // Keep the mobile menu open while users interact with dropdown toggles.
            return;
        }

        if (target.classList.contains('nav-dropdown-item') || target.classList.contains('nav-link')) {
            setOpen(false);
        }
    });

    document.addEventListener('click', (event) => {
        if (window.innerWidth > 767.98) {
            return;
        }

        if (!headerContent.contains(event.target)) {
            setOpen(false);
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            setOpen(false);
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 767.98) {
            setOpen(false);
        }
    });
}

/**
 * Update mobile navigation
 */
function updateMobileNavigation() {
    const headerContent = document.querySelector('.header-content');
    const toggle = document.getElementById('mobileNavToggle');
    if (!headerContent) return;

    // Reset mobile menu state when leaving mobile viewport.
    if (window.innerWidth > 767.98) {
        headerContent.classList.remove('mobile-nav-open');
        if (toggle) {
            toggle.setAttribute('aria-expanded', 'false');
        }
    }
}

/**
 * Adjust modal position
 */
function adjustModalPosition() {
    const modals = ['calculatorSelectorModal', 'calculatorModal', 'feeCalculatorModal'];

    modals.forEach((modalId) => {
        const modal = document.getElementById(modalId);
        if (!modal || modal.style.display === 'none') {
            return;
        }

        const modalContainer = modal.querySelector('.modal-container');
        if (modalContainer) {
            const maxHeight = window.innerHeight - 40;
            modalContainer.style.maxHeight = `${maxHeight}px`;
        }
    });
}

/**
 * Scroll to section
 */
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        UIManager.scrollToElement(section);
        trackEvent('section_viewed', { section: sectionId });
    }
}

/**
 * Track analytics events (placeholder)
 */
function trackEvent(eventName, properties = {}) {
    // Implement analytics tracking here
    console.log('Event tracked:', eventName, properties);
    
    // Example: Google Analytics
    // if (typeof gtag !== 'undefined') {
    //     gtag('event', eventName, properties);
    // }
}

/**
 * Handle errors globally
 */
function handleGlobalError(error, context = '') {
    console.error('Application Error:', error, context);
    
    // Show user-friendly error message
    UIManager.showToast('An unexpected error occurred. Please refresh the page and try again.', 'error');
    
    // Track error for debugging
    trackEvent('error', {
        message: error.message,
        context: context,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
    });
}

/**
 * Setup global error handling
 */
function setupErrorHandling() {
    // Handle uncaught errors
    window.addEventListener('error', (e) => {
        handleGlobalError(e.error, 'uncaught_error');
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (e) => {
        handleGlobalError(e.reason, 'unhandled_rejection');
        e.preventDefault();
    });
}

/**
 * Initialize service worker (if available)
 */
function initServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then((registration) => {
                    console.log('SW registered: ', registration);
                })
                .catch((registrationError) => {
                    console.log('SW registration failed: ', registrationError);
                });
        });
    }
}

/**
 * Handle app updates
 */
function handleAppUpdate() {
    // Check for app updates
    const currentVersion = localStorage.getItem('app_version');
    
    if (currentVersion && currentVersion !== CONFIG.APP.VERSION) {
        UIManager.showToast(
            `App updated to version ${CONFIG.APP.VERSION}. New features available!`, 
            'info', 
            8000
        );
    }
    
    localStorage.setItem('app_version', CONFIG.APP.VERSION);
}

/**
 * Preload critical resources
 */
function preloadResources() {
    // Fonts are already loaded via stylesheet links in index.html.
    // Keeping this as a no-op prevents duplicate preload warnings.
    return;
}

/**
 * Initialize performance monitoring
 */
function initPerformanceMonitoring() {
    // Monitor Core Web Vitals
    if ('PerformanceObserver' in window) {
        // Monitor Largest Contentful Paint
        new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                trackEvent('performance_lcp', { value: entry.startTime });
            }
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // Monitor First Input Delay
        new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                trackEvent('performance_fid', { value: entry.processingStart - entry.startTime });
            }
        }).observe({ entryTypes: ['first-input'] });
    }
}

/**
 * Main application initialization
 */
document.addEventListener('DOMContentLoaded', function() {
    // Setup error handling first
    setupErrorHandling();
    
    // Initialize core application
    initApp();
    
    // Handle app updates
    handleAppUpdate();
    
    // Preload resources
    preloadResources();

    // Initialize service worker
    initServiceWorker();

    // Initialize performance monitoring
    initPerformanceMonitoring();

    // Add loading complete class
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 100);
});

/**
 * Open AI Chat Modal - Global function
 */
function openAIChat() {
    console.log('Opening AI Chat...');
    const modal = document.getElementById('aiChatModal');
    if (!modal) return;

    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.classList.add('ai-chat-open');
    document.documentElement.classList.add('ai-chat-open');

    // Close on backdrop click (only wire once)
    if (!modal._backdropWired) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeAIChat();
        });
        modal._backdropWired = true;
    }

    // Focus chat input if available
    const chatInput = modal.querySelector('#aiChatInput');
    if (chatInput) {
        setTimeout(() => chatInput.focus(), 300);
    }
}

/**
 * Close AI Chat Modal - Global function  
 */
function closeAIChat() {
    console.log('Closing AI Chat...');
    const modal = document.getElementById('aiChatModal');
    if (!modal) return;

    modal.classList.remove('active');
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        document.documentElement.style.overflow = '';
        document.body.classList.remove('ai-chat-open');
        document.documentElement.classList.remove('ai-chat-open');
    }, 300);
}

// Global functions for button clicks and external access
window.openCalculator = openCalculator;
window.closeCalculator = closeCalculator;
window.openCoverageCalculator = openCoverageCalculator;
window.openFeeCalculator = openFeeCalculator;
window.closeFeeCalculator = closeFeeCalculator;
window.closeCalculatorSelector = closeCalculatorSelector;
window.scrollToSection = scrollToSection;
window.openAIChat = openAIChat;
window.closeAIChat = closeAIChat;

// Expose App object globally for debugging
window.App = App;

// Add additional CSS for animations and effects
const additionalStyles = `
<style>
    .header.scrolled {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        box-shadow: var(--shadow-sm);
    }
    
    .nav-link.active {
        color: var(--color-primary);
        font-weight: var(--font-weight-semibold);
    }
    
    .feature-card,
    .hero-card,
    .contact-form {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s ease-out;
    }
    
    .feature-card.animate-in,
    .hero-card.animate-in,
    .contact-form.animate-in {
        opacity: 1;
        transform: translateY(0);
    }
    
    .app-ready .hero-title {
        animation: fadeInUp 0.8s ease-out;
    }
    
    .app-ready .hero-description {
        animation: fadeInUp 0.8s ease-out 0.2s both;
    }
    
    .app-ready .hero-actions {
        animation: fadeInUp 0.8s ease-out 0.4s both;
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .loading-overlay {
        backdrop-filter: blur(8px);
    }
    
    .modal-overlay {
        backdrop-filter: blur(4px);
    }
    
    body.loaded .spinner {
        animation-duration: 1s;
    }
    
    /* Accessibility improvements */
    @media (prefers-reduced-motion: reduce) {
        .feature-card,
        .hero-card,
        .contact-form {
            transition: none;
            animation: none;
        }
        
        .app-ready .hero-title,
        .app-ready .hero-description,
        .app-ready .hero-actions {
            animation: none;
        }
    }
    
    /* Focus indicators */
    button:focus-visible,
    a:focus-visible,
    input:focus-visible,
    select:focus-visible,
    textarea:focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
    }
    
    /* High contrast mode improvements */
    @media (prefers-contrast: high) {
        .hero-card,
        .feature-card,
        .modal-container {
            border: 2px solid var(--color-gray-800);
        }
    }
</style>
`;

document.head.insertAdjacentHTML('beforeend', additionalStyles);

/**
 * Initialize animations and scroll effects
 */
function initAnimations() {
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Observe elements with fade-in animation
    const animatedElements = document.querySelectorAll('.fade-in-on-scroll');
    animatedElements.forEach(el => observer.observe(el));

    // Add stagger animation to multiple elements
    const staggerElements = document.querySelectorAll('.stagger-children > *');
    staggerElements.forEach((el, index) => {
        el.style.animationDelay = `${index * 0.1}s`;
    });

    // Parallax effect for hero elements
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('.parallax-element');
        
        parallaxElements.forEach(element => {
            const rate = scrolled * -0.5;
            element.style.transform = `translate3d(0, ${rate}px, 0)`;
        });
    });

    // Button hover effects with animation
    const buttons = document.querySelectorAll('.btn, .btn-primary, .btn-secondary');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Note: form submit button animations are handled by each calculator module.

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Progress bar animation
    const progressBars = document.querySelectorAll('.step-progress');
    progressBars.forEach(bar => {
        const progress = bar.getAttribute('data-progress') || '0';
        bar.style.setProperty('--progress-width', progress + '%');
    });
}