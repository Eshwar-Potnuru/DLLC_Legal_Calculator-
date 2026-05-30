/* ===================================================================
   LEGAL COVERAGE CALCULATOR
   Core calculation logic for Singapore legal system
   =================================================================== */

class LegalCalculator {
    constructor() {
        this.formData = {};
        this.aiAnalysisData = {};
        this.currentStep = 1;
        this.totalSteps = 4;
    }

    /**
     * Initialize the calculator form
     */
    init() {
        this.setupEventListeners();
        this.populateInjuryTypes();
        this.setupFormValidation();
    }

    /**
     * Setup event listeners for the form
     */
    setupEventListeners() {
        // Form submission
        const form = document.getElementById('legalCalculatorForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Step navigation
        const nextBtn = document.getElementById('nextBtn');
        const prevBtn = document.getElementById('prevBtn');
        const submitBtn = document.getElementById('submitBtn');

        if (nextBtn) nextBtn.addEventListener('click', () => this.nextStep());
        if (prevBtn) prevBtn.addEventListener('click', () => this.previousStep());
        if (submitBtn) {
            submitBtn.addEventListener('click', (e) => this.handleFormSubmit(e));
        }

        // Real-time validation
        this.setupRealTimeValidation();
    }

    /**
     * Setup form-level validation rules
     */
    setupFormValidation() {
        // Keep this method for compatibility with init() and to centralize setup.
        this.setupRealTimeValidation();
    }

    /**
     * Populate injury types grid
     */
    populateInjuryTypes() {
        const injuryGrid = document.getElementById('injuryGrid');
        if (!injuryGrid) return;

        injuryGrid.innerHTML = '';

        Object.entries(INJURY_TYPES).forEach(([key, injury]) => {
            const injuryCard = document.createElement('div');
            injuryCard.className = 'injury-card';
            injuryCard.dataset.injury = key;
            
            injuryCard.innerHTML = `
                <div class="injury-icon">
                    <i class="${injury.icon}"></i>
                </div>
                <h5>${injury.name}</h5>
                <p>${injury.description}</p>
                <div class="injury-meta">
                    <span class="injury-severity ${injury.severity}">${injury.severity}</span>
                    <span class="recovery-rate">${injury.baseRecovery}% recovery</span>
                </div>
            `;

            injuryCard.addEventListener('click', () => this.selectInjury(key, injuryCard));
            injuryGrid.appendChild(injuryCard);
        });
    }

    /**
     * Handle injury selection
     */
    selectInjury(injuryKey, cardElement) {
        // Remove previous selection
        document.querySelectorAll('.injury-card').forEach(card => {
            card.classList.remove('selected');
        });

        // Select current injury
        cardElement.classList.add('selected');
        document.getElementById('selectedInjury').value = injuryKey;

        // Update form data
        this.formData.selectedInjury = injuryKey;
        this.formData.injuryDetails = INJURY_TYPES[injuryKey];

        // Show success feedback
        UIManager.showToast('Injury type selected successfully', 'success');
    }

    /**
     * Setup real-time form validation
     */
    setupRealTimeValidation() {
        const inputs = document.querySelectorAll('.form-input, .form-select');
        
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    }

    /**
     * Validate individual field
     */
    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.id;
        let isValid = true;
        let errorMessage = '';

        // Reset field state
        this.clearFieldError(field);

        // Validation rules
        switch (fieldName) {
            case 'fullName':
                if (value.length < 2) {
                    isValid = false;
                    errorMessage = 'Name must be at least 2 characters';
                }
                break;

            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid email address';
                }
                break;

            case 'phone':
                const phoneRegex = /^[0-9]{8}$/;
                if (!phoneRegex.test(value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid 8-digit Singapore phone number';
                }
                break;

            case 'nric':
                const nricRegex = /^[STFGstfg][0-9]{7}[A-Za-z]$/;
                if (!nricRegex.test(value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid NRIC/FIN number (e.g., S1234567A)';
                }
                break;

            case 'accidentDate':
                const accidentDate = new Date(value);
                const today = new Date();
                const threeYearsAgo = new Date(today.getFullYear() - 3, today.getMonth(), today.getDate());
                
                if (accidentDate > today) {
                    isValid = false;
                    errorMessage = 'Accident date cannot be in the future';
                } else if (accidentDate < threeYearsAgo) {
                    isValid = false;
                    errorMessage = 'Claims must be filed within 3 years of the accident';
                }
                break;

            case 'claimAmount':
                const amount = parseFloat(value);
                if (amount < 1000) {
                    isValid = false;
                    errorMessage = 'Claim amount must be at least S$1,000';
                } else if (amount > 10000000) {
                    isValid = false;
                    errorMessage = 'Claim amount cannot exceed S$10,000,000';
                }
                break;
        }

        if (!isValid) {
            this.showFieldError(field, errorMessage);
        }

        return isValid;
    }

    /**
     * Show field error
     */
    showFieldError(field, message) {
        field.classList.add('error');
        
        // Remove existing error message
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }

        // Add new error message
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        field.parentNode.appendChild(errorElement);
    }

    /**
     * Clear field error
     */
    clearFieldError(field) {
        field.classList.remove('error');
        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }

    /**
     * Navigate to next step
     */
    nextStep() {
        if (!this.validateCurrentStep()) {
            UIManager.showToast('Please complete all required fields', 'error');
            return;
        }

        this.collectCurrentStepData();

        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.updateStepDisplay();
            this.updateProgressIndicator();
        }
    }

    /**
     * Navigate to previous step
     */
    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepDisplay();
            this.updateProgressIndicator();
        }
    }

    /**
     * Validate current step
     */
    validateCurrentStep() {
        const currentStepElement = document.querySelector(`.form-step[data-step="${this.currentStep}"]`);
        const requiredFields = currentStepElement.querySelectorAll('[required]');
        
        let isValid = true;

        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        // Special validation for step 2 (injury selection)
        if (this.currentStep === 2) {
            const selectedInjury = document.getElementById('selectedInjury').value;
            if (!selectedInjury) {
                UIManager.showToast('Please select an injury type', 'error');
                isValid = false;
            }
        }

        return isValid;
    }

    /**
     * Collect data from current step
     */
    collectCurrentStepData() {
        const currentStepElement = document.querySelector(`.form-step[data-step="${this.currentStep}"]`);
        const inputs = currentStepElement.querySelectorAll('input, select, textarea');

        inputs.forEach(input => {
            if (input.type === 'checkbox' || input.type === 'radio') {
                if (input.checked) {
                    this.formData[input.name || input.id] = input.value;
                }
            } else {
                this.formData[input.id] = input.value;
            }
        });
    }

    /**
     * Update step display
     */
    updateStepDisplay() {
        // Hide all steps
        document.querySelectorAll('.form-step').forEach(step => {
            step.classList.remove('active');
        });

        // Show current step
        const currentStepElement = document.querySelector(`.form-step[data-step="${this.currentStep}"]`);
        if (currentStepElement) {
            currentStepElement.classList.add('active');
        }

        // Update navigation buttons
        this.updateNavigationButtons();
    }

    /**
     * Update navigation buttons
     */
    updateNavigationButtons() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const submitBtn = document.getElementById('submitBtn');

        // Previous button
        if (prevBtn) {
            prevBtn.style.display = this.currentStep > 1 ? 'block' : 'none';
        }

        // Next/Submit buttons
        if (this.currentStep === this.totalSteps) {
            if (nextBtn) nextBtn.style.display = 'none';
            if (submitBtn) submitBtn.style.display = 'block';
        } else {
            if (nextBtn) nextBtn.style.display = 'block';
            if (submitBtn) submitBtn.style.display = 'none';
        }
    }

    /**
     * Update progress indicator
     */
    updateProgressIndicator() {
        document.querySelectorAll('.progress-step').forEach((step, index) => {
            const stepNumber = index + 1;
            
            if (stepNumber < this.currentStep) {
                step.classList.add('completed');
                step.classList.remove('active');
            } else if (stepNumber === this.currentStep) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else {
                step.classList.remove('active', 'completed');
            }
        });
    }

    /**
     * Calculate legal coverage
     */
    async calculateCoverage() {
        try {
            // Show loading
            UIManager.showLoading('Calculating your legal coverage...');

            // Collect final form data
            this.collectCurrentStepData();

            // Perform calculations
            const results = this.performCalculations();

            // Include AI analysis if available
            if (this.aiAnalysisData && Object.keys(this.aiAnalysisData).length > 0) {
                results.aiAnalysis = this.aiAnalysisData;
            }

            // Display results
            this.displayResults(results);

            // Hide loading
            UIManager.hideLoading();

            // Move to results step
            this.currentStep = 4;
            this.updateStepDisplay();
            this.updateProgressIndicator();

        } catch (error) {
            console.error('Calculation error:', error);
            UIManager.hideLoading();
            UIManager.showToast('Error calculating coverage. Please try again.', 'error');
        }
    }

    /**
     * Perform legal coverage calculations
     */
    performCalculations() {
        const {
            claimAmount,
            selectedInjury,
            faultPercentage,
            accidentType,
            legalRepresentation = 'full-service',
            urgencyLevel = 'standard'
        } = this.formData;

        const injury = INJURY_TYPES[selectedInjury];
        
        // Base legal fee calculation
        let baseFee = 0;
        const repFee = CONFIG.LEGAL.REPRESENTATION_FEES[legalRepresentation];
        
        if (typeof repFee === 'number' && repFee < 1) {
            // Percentage-based fee
            baseFee = parseFloat(claimAmount) * repFee;
        } else {
            // Fixed fee
            baseFee = repFee;
        }

        // Apply multipliers
        baseFee *= CONFIG.LEGAL.SEVERITY_MULTIPLIERS[injury.severity];
        baseFee *= CONFIG.LEGAL.ACCIDENT_MULTIPLIERS[accidentType] || 1.0;
        
        const urgencyMultiplier = CONFIG.LEGAL.URGENCY_MULTIPLIERS[urgencyLevel];
        const urgencyFee = baseFee * (urgencyMultiplier - 1);
        baseFee *= urgencyMultiplier;

        // Calculate success probability
        let successProbability = 95 - parseInt(faultPercentage);
        successProbability = Math.max(30, Math.min(95, successProbability));

        // Calculate recovery rate
        let recoveryRate = injury.baseRecovery;
        
        if (faultPercentage == 0) {
            recoveryRate += 10;
        } else if (faultPercentage >= 75) {
            recoveryRate -= 20;
        } else if (faultPercentage >= 50) {
            recoveryRate -= 10;
        }
        
        recoveryRate = Math.max(CONFIG.LEGAL.MIN_RECOVERY_RATE, 
                              Math.min(CONFIG.LEGAL.MAX_RECOVERY_RATE, recoveryRate));

        // Calculate expected recovery
        const expectedRecovery = (parseFloat(claimAmount) * recoveryRate / 100) * (successProbability / 100);

        // GST calculation
        const gstAmount = baseFee * CONFIG.LEGAL.GST_RATE;
        const finalFee = baseFee + gstAmount;

        return {
            baseFee: Math.round(baseFee * 100) / 100,
            urgencyFee: Math.round(urgencyFee * 100) / 100,
            gstAmount: Math.round(gstAmount * 100) / 100,
            finalFee: Math.round(finalFee * 100) / 100,
            expectedRecovery: Math.round(expectedRecovery * 100) / 100,
            successProbability: Math.round(successProbability),
            recoveryRate: Math.round(recoveryRate),
            claimAmount: parseFloat(claimAmount),
            injury: injury,
            formData: this.formData,
            calculationDate: new Date().toLocaleString('en-SG')
        };
    }

    /**
     * Display calculation results
     */
    displayResults(results) {
        const resultsContainer = document.getElementById('resultsContainer');
        if (!resultsContainer) return;

        const formatCurrency = (amount) => {
            return new Intl.NumberFormat('en-SG', {
                style: 'currency',
                currency: 'SGD'
            }).format(amount);
        };

        resultsContainer.innerHTML = `
            <div class="results-summary">
                <div class="result-card primary">
                    <div class="result-header">
                        <i class="fas fa-calculator"></i>
                        <h4>Legal Coverage Estimate</h4>
                    </div>
                    <div class="result-amount">
                        ${formatCurrency(results.finalFee)}
                    </div>
                    <div class="result-details">
                        <small>Including 9% GST</small>
                    </div>
                </div>

                <div class="result-card success">
                    <div class="result-header">
                        <i class="fas fa-trophy"></i>
                        <h4>Expected Recovery</h4>
                    </div>
                    <div class="result-amount">
                        ${formatCurrency(results.expectedRecovery)}
                    </div>
                    <div class="result-details">
                        <small>${results.recoveryRate}% recovery rate</small>
                    </div>
                </div>

                <div class="result-card info">
                    <div class="result-header">
                        <i class="fas fa-chart-line"></i>
                        <h4>Success Probability</h4>
                    </div>
                    <div class="result-amount">
                        ${results.successProbability}%
                    </div>
                    <div class="result-details">
                        <small>Based on case analysis</small>
                    </div>
                </div>
            </div>

            <div class="results-breakdown">
                <h4>Cost Breakdown</h4>
                <div class="breakdown-items">
                    <div class="breakdown-item">
                        <span>Base Legal Fee</span>
                        <span>${formatCurrency(results.baseFee - results.urgencyFee)}</span>
                    </div>
                    ${results.urgencyFee > 0 ? `
                    <div class="breakdown-item">
                        <span>Urgency Surcharge</span>
                        <span>${formatCurrency(results.urgencyFee)}</span>
                    </div>
                    ` : ''}
                    <div class="breakdown-item">
                        <span>GST (9%)</span>
                        <span>${formatCurrency(results.gstAmount)}</span>
                    </div>
                    <div class="breakdown-item total">
                        <span><strong>Total Legal Fee</strong></span>
                        <span><strong>${formatCurrency(results.finalFee)}</strong></span>
                    </div>
                </div>
            </div>

            <div class="case-summary">
                <h4>Case Summary</h4>
                <div class="summary-grid">
                    <div class="summary-item">
                        <label>Client Name:</label>
                        <span>${results.formData.fullName}</span>
                    </div>
                    <div class="summary-item">
                        <label>Injury Type:</label>
                        <span>${results.injury.name}</span>
                    </div>
                    <div class="summary-item">
                        <label>Claim Amount:</label>
                        <span>${formatCurrency(results.claimAmount)}</span>
                    </div>
                    <div class="summary-item">
                        <label>Fault Percentage:</label>
                        <span>${results.formData.faultPercentage}%</span>
                    </div>
                </div>
            </div>

            ${results.aiAnalysis ? this.generateAISummary(results.aiAnalysis) : ''}

            <div class="next-steps">
                <h4>Next Steps</h4>
                <div class="steps-list">
                    <div class="step-item">
                        <i class="fas fa-phone"></i>
                        <div>
                            <strong>Contact Our Team</strong>
                            <p>Schedule a consultation to discuss your case in detail</p>
                        </div>
                    </div>
                    <div class="step-item">
                        <i class="fas fa-file-alt"></i>
                        <div>
                            <strong>Gather Documentation</strong>
                            <p>Collect all relevant medical records and incident reports</p>
                        </div>
                    </div>
                    <div class="step-item">
                        <i class="fas fa-gavel"></i>
                        <div>
                            <strong>Legal Proceedings</strong>
                            <p>Begin formal legal proceedings with professional representation</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="action-buttons">
                <button type="button" class="btn-primary" onclick="contactLegalTeam()">
                    <i class="fas fa-phone"></i>
                    Contact Legal Team
                </button>
                <button type="button" class="btn-secondary" onclick="downloadReport()">
                    <i class="fas fa-download"></i>
                    Download Report
                </button>
                <button type="button" class="btn-secondary" onclick="restartCalculator()">
                    <i class="fas fa-redo"></i>
                    New Assessment
                </button>
            </div>
        `;
    }

    /**
     * Generate AI analysis summary
     */
    generateAISummary(aiAnalysis) {
        return `
            <div class="ai-summary">
                <h4><i class="fas fa-robot"></i> AI Analysis Summary</h4>
                <div class="ai-insights">
                    <div class="insight-item">
                        <label>Documents Analyzed:</label>
                        <span>${aiAnalysis.documentsCount || 0}</span>
                    </div>
                    <div class="insight-item">
                        <label>AI Confidence:</label>
                        <span class="confidence-badge ${aiAnalysis.confidence || 'medium'}">${(aiAnalysis.confidence || 'medium').toUpperCase()}</span>
                    </div>
                    ${aiAnalysis.keyFindings ? `
                    <div class="insight-item full-width">
                        <label>Key Findings:</label>
                        <p>${aiAnalysis.keyFindings}</p>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Handle form submission
     */
    handleFormSubmit(e) {
        e.preventDefault();
        
        if (this.currentStep === this.totalSteps) {
            this.calculateCoverage();
        } else {
            this.nextStep();
        }
    }

    /**
     * Reset calculator
     */
    reset() {
        this.formData = {};
        this.aiAnalysisData = {};
        this.currentStep = 1;
        
        // Reset form
        const form = document.getElementById('legalCalculatorForm');
        if (form) {
            form.reset();
        }

        // Reset injury selection
        document.querySelectorAll('.injury-card').forEach(card => {
            card.classList.remove('selected');
        });

        // Reset step display
        this.updateStepDisplay();
        this.updateProgressIndicator();

        // Clear results
        const resultsContainer = document.getElementById('resultsContainer');
        if (resultsContainer) {
            resultsContainer.innerHTML = '';
        }
    }
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.legalCalculator = new LegalCalculator();
    window.legalCalculator.init();
});

// Global functions for button clicks
window.restartCalculator = function() {
    window.legalCalculator.reset();
    UIManager.showToast('Calculator reset successfully', 'success');
};

window.contactLegalTeam = function() {
    window.open(`mailto:${CONFIG.APP.EMAIL}?subject=Legal Coverage Consultation&body=Hello, I would like to schedule a consultation regarding my legal case.`, '_blank');
};

window.downloadReport = function() {
    UIManager.showToast('Report download feature coming soon', 'info');
};

window.nextStep = function() {
    window.legalCalculator.nextStep();
};

window.previousStep = function() {
    window.legalCalculator.previousStep();
};