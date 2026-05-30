/* ===================================================================
   UI MANAGER
   Loading states, notifications, modals, and user interface controls
   =================================================================== */

class UIManager {
    static instance = null;

    constructor() {
        if (UIManager.instance) {
            return UIManager.instance;
        }
        
        UIManager.instance = this;
        this.loadingOverlay = null;
        this.toastContainer = null;
        this.init();
    }

    /**
     * Initialize UI Manager
     */
    init() {
        this.createLoadingOverlay();
        this.createToastContainer();
        this.setupGlobalEventListeners();
    }

    /**
     * Create loading overlay
     */
    createLoadingOverlay() {
        this.loadingOverlay = document.getElementById('loadingOverlay');
        
        if (!this.loadingOverlay) {
            this.loadingOverlay = document.createElement('div');
            this.loadingOverlay.id = 'loadingOverlay';
            this.loadingOverlay.className = 'loading-overlay';
            this.loadingOverlay.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p>Loading...</p>
                </div>
            `;
            document.body.appendChild(this.loadingOverlay);
        }
    }

    /**
     * Create toast container
     */
    createToastContainer() {
        this.toastContainer = document.getElementById('toastContainer');
        
        if (!this.toastContainer) {
            this.toastContainer = document.createElement('div');
            this.toastContainer.id = 'toastContainer';
            this.toastContainer.className = 'toast-container';
            document.body.appendChild(this.toastContainer);
        }
    }

    /**
     * Setup global event listeners
     */
    setupGlobalEventListeners() {
        // Escape key and backdrop-click are managed by main.js per-modal.
        // Only handle HTML5 validation errors globally.
        document.addEventListener('invalid', (e) => {
            e.preventDefault();
            const field = e.target;
            UIManager.showFieldError(field, field.validationMessage);
        }, true);
    }

    /**
     * Show loading overlay
     */
    static showLoading(message = 'Loading...') {
        const instance = new UIManager();
        const loadingText = instance.loadingOverlay.querySelector('p');
        if (loadingText) {
            loadingText.textContent = message;
        }
        instance.loadingOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    /**
     * Hide loading overlay
     */
    static hideLoading() {
        const instance = new UIManager();
        instance.loadingOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    /**
     * Show toast notification
     */
    static showToast(message, type = 'info', duration = UI_CONSTANTS.TOAST_DURATION) {
        const instance = new UIManager();
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = instance.getToastIcon(type);
        
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="${icon}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${instance.getToastTitle(type)}</div>
                <p class="toast-message">${message}</p>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        instance.toastContainer.appendChild(toast);
        
        // Auto remove after duration
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, duration);
        
        return toast;
    }

    /**
     * Get toast icon based on type
     */
    getToastIcon(type) {
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    /**
     * Get toast title based on type
     */
    getToastTitle(type) {
        const titles = {
            success: 'Success',
            error: 'Error',
            warning: 'Warning',
            info: 'Information'
        };
        return titles[type] || titles.info;
    }

    /**
     * Show confirmation dialog
     */
    static showConfirmation(message, title = 'Confirm', onConfirm = null, onCancel = null) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal-overlay active confirmation-modal';
            
            modal.innerHTML = `
                <div class="modal-container">
                    <div class="modal-header">
                        <h3 class="modal-title">
                            <i class="fas fa-question-circle"></i>
                            ${title}
                        </h3>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-secondary" id="cancelBtn">
                            <i class="fas fa-times"></i>
                            Cancel
                        </button>
                        <button type="button" class="btn-primary" id="confirmBtn">
                            <i class="fas fa-check"></i>
                            Confirm
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            document.body.style.overflow = 'hidden';
            
            const confirmBtn = modal.querySelector('#confirmBtn');
            const cancelBtn = modal.querySelector('#cancelBtn');
            
            const cleanup = () => {
                modal.remove();
                document.body.style.overflow = '';
            };
            
            confirmBtn.addEventListener('click', () => {
                cleanup();
                if (onConfirm) onConfirm();
                resolve(true);
            });
            
            cancelBtn.addEventListener('click', () => {
                cleanup();
                if (onCancel) onCancel();
                resolve(false);
            });
            
            // Close on outside click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    cleanup();
                    if (onCancel) onCancel();
                    resolve(false);
                }
            });
        });
    }

    /**
     * Show field error
     */
    static showFieldError(field, message) {
        field.classList.add('error');
        
        // Remove existing error
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Add new error
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        
        field.parentNode.appendChild(errorElement);
        
        // Auto remove after field is focused
        field.addEventListener('focus', () => {
            field.classList.remove('error');
            errorElement.remove();
        }, { once: true });
    }

    /**
     * Clear all field errors in a container
     */
    static clearFieldErrors(container = document) {
        const errorFields = container.querySelectorAll('.form-input.error, .form-select.error');
        const errorMessages = container.querySelectorAll('.field-error');
        
        errorFields.forEach(field => field.classList.remove('error'));
        errorMessages.forEach(error => error.remove());
    }

    /**
     * Animate element
     */
    static animateElement(element, animation, duration = UI_CONSTANTS.ANIMATION_DURATION) {
        return new Promise((resolve) => {
            element.style.animation = `${animation} ${duration}ms ease-in-out`;
            
            setTimeout(() => {
                element.style.animation = '';
                resolve();
            }, duration);
        });
    }

    /**
     * Smooth scroll to element
     */
    static scrollToElement(element, offset = 80) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        
        if (element) {
            const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementPosition - offset;
            
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    }

    /**
     * Show progress bar
     */
    static showProgress(progress, message = '') {
        let progressBar = document.getElementById('globalProgressBar');
        
        if (!progressBar) {
            progressBar = document.createElement('div');
            progressBar.id = 'globalProgressBar';
            progressBar.className = 'global-progress-bar';
            progressBar.innerHTML = `
                <div class="progress-bar-container">
                    <div class="progress-bar-fill"></div>
                    <div class="progress-bar-text"></div>
                </div>
            `;
            document.body.appendChild(progressBar);
        }
        
        const fill = progressBar.querySelector('.progress-bar-fill');
        const text = progressBar.querySelector('.progress-bar-text');
        
        fill.style.width = `${Math.min(100, Math.max(0, progress))}%`;
        text.textContent = message;
        
        progressBar.classList.add('active');
        
        if (progress >= 100) {
            setTimeout(() => {
                progressBar.classList.remove('active');
            }, 1000);
        }
    }

    /**
     * Create and show modal
     */
    static createModal(content, title = '', className = '') {
        const modal = document.createElement('div');
        modal.className = `modal-overlay ${className}`;
        
        modal.innerHTML = `
            <div class="modal-container">
                ${title ? `
                    <div class="modal-header">
                        <h3 class="modal-title">${title}</h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove(); document.body.style.overflow = '';">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                ` : ''}
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        // Trigger animation
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
        
        return modal;
    }

    /**
     * Close modal
     */
    static closeModal() {
        const modals = document.querySelectorAll('.modal-overlay.active');
        modals.forEach(modal => {
            modal.classList.remove('active');
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.remove();
                }
            }, 300);
        });
        document.body.style.overflow = '';
    }

    /**
     * Validate form
     */
    static validateForm(form) {
        this.clearFieldErrors(form);
        
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                this.showFieldError(field, 'This field is required');
                isValid = false;
            }
        });
        
        // Email validation
        const emailFields = form.querySelectorAll('input[type="email"]');
        emailFields.forEach(field => {
            if (field.value && !this.isValidEmail(field.value)) {
                this.showFieldError(field, 'Please enter a valid email address');
                isValid = false;
            }
        });
        
        // Phone validation for Singapore
        const phoneFields = form.querySelectorAll('input[type="tel"]');
        phoneFields.forEach(field => {
            if (field.value && !this.isValidSingaporePhone(field.value)) {
                this.showFieldError(field, 'Please enter a valid 8-digit Singapore phone number');
                isValid = false;
            }
        });
        
        return isValid;
    }

    /**
     * Validate email
     */
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate Singapore phone number
     */
    static isValidSingaporePhone(phone) {
        const phoneRegex = /^[89]\d{7}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    /**
     * Format currency for Singapore
     */
    static formatCurrency(amount, currency = 'SGD') {
        return new Intl.NumberFormat('en-SG', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }

    /**
     * Format date for Singapore
     */
    static formatDate(date, options = {}) {
        const defaultOptions = {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            timeZone: 'Asia/Singapore'
        };
        
        return new Intl.DateTimeFormat('en-SG', { ...defaultOptions, ...options }).format(new Date(date));
    }

    /**
     * Copy text to clipboard
     */
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Copied to clipboard', 'success');
            return true;
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            this.showToast('Failed to copy to clipboard', 'error');
            return false;
        }
    }

    /**
     * Download data as file
     */
    static downloadFile(data, filename, mimeType = 'text/plain') {
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        this.showToast(`Downloaded ${filename}`, 'success');
    }

    /**
     * Generate PDF report (placeholder)
     */
    static generatePDFReport(data) {
        // This would integrate with a PDF library like jsPDF
        this.showToast('PDF generation feature coming soon', 'info');
    }

    /**
     * Share content (if Web Share API is available)
     */
    static async shareContent(title, text, url = window.location.href) {
        if (navigator.share) {
            try {
                await navigator.share({ title, text, url });
                this.showToast('Content shared successfully', 'success');
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Error sharing:', error);
                    this.showToast('Failed to share content', 'error');
                }
            }
        } else {
            // Fallback to copying URL
            await this.copyToClipboard(url);
        }
    }

    /**
     * Initialize accessibility features
     */
    static initAccessibility() {
        // Skip link for keyboard navigation (create once)
        if (!document.querySelector('.skip-link')) {
            const skipLink = document.createElement('a');
            skipLink.href = '#calculator';
            skipLink.className = 'skip-link';
            skipLink.textContent = 'Skip to main content';
            document.body.insertBefore(skipLink, document.body.firstChild);
        }

        // Focus management for modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                const modal = document.querySelector('.modal-overlay.active');
                if (modal) {
                    this.trapFocus(modal, e);
                }
            }
        });

        // Announce dynamic content changes to screen readers
        const announcer = document.createElement('div');
        announcer.id = 'aria-announcer';
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        announcer.style.cssText = 'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';
        document.body.appendChild(announcer);
    }

    /**
     * Announce message to screen readers
     */
    static announceToScreenReader(message) {
        const announcer = document.getElementById('aria-announcer');
        if (announcer) {
            announcer.textContent = message;
        }
    }

    /**
     * Trap focus within element (for modals)
     */
    static trapFocus(element, event) {
        const focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
        }
    }
}

// Initialize UI Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    UIManager.initAccessibility();
    
    // Add CSS for additional UI components
    const additionalStyles = `
        <style>
            .field-error {
                display: flex;
                align-items: center;
                gap: var(--spacing-2);
                color: var(--color-error);
                font-size: var(--font-size-sm);
                margin-top: var(--spacing-1);
            }
            
            .form-input.error,
            .form-select.error {
                border-color: var(--color-error);
                box-shadow: 0 0 0 3px rgba(229, 62, 62, 0.1);
            }
            
            .global-progress-bar {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: var(--color-gray-200);
                z-index: var(--z-modal);
                opacity: 0;
                visibility: hidden;
                transition: all var(--transition-normal);
            }
            
            .global-progress-bar.active {
                opacity: 1;
                visibility: visible;
            }
            
            .progress-bar-fill {
                height: 100%;
                background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
                transition: width 0.3s ease;
                border-radius: 0 2px 2px 0;
            }
            
            .skip-link {
                position: absolute;
                top: -40px;
                left: 6px;
                background: var(--color-primary);
                color: white;
                padding: 8px;
                text-decoration: none;
                border-radius: 4px;
                z-index: 1000;
            }
            
            .skip-link:focus {
                top: 6px;
            }
            
            .confirmation-modal .modal-footer {
                display: flex;
                gap: var(--spacing-3);
                justify-content: flex-end;
                padding: var(--spacing-6);
                border-top: 1px solid var(--color-gray-200);
            }
            
            .toast-close {
                background: none;
                border: none;
                color: var(--color-gray-500);
                cursor: pointer;
                padding: var(--spacing-1);
                border-radius: var(--radius-sm);
                transition: all var(--transition-fast);
            }
            
            .toast-close:hover {
                background: var(--color-gray-200);
                color: var(--color-gray-700);
            }
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', additionalStyles);
});

// Export UIManager for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
}