/* ===================================================================
   LEGAL FEE CALCULATOR
   Standalone fee estimation module integrated with main DLLC site
   =================================================================== */

class LegalFeeCalculator {
    constructor() {
        this.vouchers = {
            WELCOME15: { type: 'percentage', value: 0.15, name: '15% Legal Discount' },
            LAWYERVIP: { type: 'percentage', value: 0.30, name: 'VIP Client Rate' },
            PROP4SALE: { type: 'fixed', value: 200, name: 'High Value Discount' },
            X9K4L_MP72Q: { type: 'percentage', value: 0.15, name: 'Flash Sale', code: 'X9K4L-MP72Q' },
            QZ12K_9PLM6: { type: 'percentage', value: 0.20, name: 'Premium Client Offer', code: 'QZ12K-9PLM6' },
            P4M2K_R9LZ8: { type: 'percentage', value: 0.25, name: 'Exclusive Rate', code: 'P4M2K-R9LZ8' },
            M3Q9L_K5P8X: { type: 'fixed', value: 200, name: 'Platinum Discount', code: 'M3Q9L-K5P8X' },
            N6B8V_K3M9L: { type: 'fixed', value: 250, name: 'Diamond Tier', code: 'N6B8V-K3M9L' }
        };

        this.voucherLookup = this.buildVoucherLookup();
    }

    buildVoucherLookup() {
        const lookup = {};
        Object.keys(this.vouchers).forEach((key) => {
            const voucher = this.vouchers[key];
            lookup[key] = voucher;
            if (voucher.code) {
                lookup[voucher.code] = voucher;
            }
        });
        return lookup;
    }

    init() {
        this.cacheElements();
        if (!this.form) {
            return;
        }

        this.setupEventListeners();
        this.reset();
    }

    cacheElements() {
        this.form = document.getElementById('feeEstimatorForm');
        this.resultPanel = document.getElementById('feeResultPanel');

        this.nameInput = document.getElementById('feeName');
        this.emailInput = document.getElementById('feeEmail');
        this.phoneInput = document.getElementById('feePhone');

        this.purposeSelect = document.getElementById('feePurpose');
        this.propertyTypeSelect = document.getElementById('feePropertyType');
        this.paymentTypeOptions = document.getElementById('feePaymentTypeOptions');
        this.paymentTypeSelect = document.getElementById('feePaymentType');

        this.ownershipSelect = document.getElementById('feeOwnership');
        this.singleOwnerOptions = document.getElementById('feeSingleOwnerOptions');
        this.singleOwnerTypeSelect = document.getElementById('feeSingleOwnerType');
        this.companyNameField = document.getElementById('feeCompanyNameField');
        this.companyNameInput = document.getElementById('feeCompanyName');

        this.jointOwnerOptions = document.getElementById('feeJointOwnerOptions');
        this.jointOwnerTypeSelect = document.getElementById('feeJointOwnerType');

        this.bankSelect = document.getElementById('feeBank');
        this.customBankField = document.getElementById('feeCustomBankField');
        this.customBankInput = document.getElementById('feeCustomBankName');

        this.transactionValueInput = document.getElementById('feeTransactionValue');

        this.voucherInput = document.getElementById('feeVoucherCode');
        this.voucherButton = document.getElementById('feeApplyVoucher');
        this.voucherMessage = document.getElementById('feeVoucherMessage');
        this.voucherPreview = document.getElementById('feeVoucherPreview');
        this.validVoucherInput = document.getElementById('feeValidVoucher');

        this.backButton = document.getElementById('feeBackToForm');
        this.contactButton = document.getElementById('feeContactLegalTeamButton');

        this.summary = {
            finalFee: document.getElementById('feeSummaryFinalFee'),
            discount: document.getElementById('feeSummaryDiscount'),
            name: document.getElementById('feeSummaryName'),
            email: document.getElementById('feeSummaryEmail'),
            phone: document.getElementById('feeSummaryPhone'),
            purpose: document.getElementById('feeSummaryPurpose'),
            propertyType: document.getElementById('feeSummaryPropertyType'),
            ownership: document.getElementById('feeSummaryOwnership'),
            paymentType: document.getElementById('feeSummaryPaymentType'),
            bank: document.getElementById('feeSummaryBank'),
            transactionValue: document.getElementById('feeSummaryTransactionValue'),
            dateTime: document.getElementById('feeSummaryDateTime')
        };
    }

    setupEventListeners() {
        this.ownershipSelect.addEventListener('change', () => this.handleOwnershipChange());
        this.singleOwnerTypeSelect.addEventListener('change', () => this.handleSingleOwnerTypeChange());
        this.bankSelect.addEventListener('change', () => this.handleBankChange());
        this.propertyTypeSelect.addEventListener('change', () => this.handlePropertyTypeChange());
        this.voucherButton.addEventListener('click', () => this.applyVoucher());

        this.form.addEventListener('submit', (event) => {
            event.preventDefault();
            this.handleSubmit();
        });

        if (this.backButton) {
            this.backButton.addEventListener('click', () => this.showForm());
        }

        if (this.contactButton) {
            this.contactButton.addEventListener('click', () => this.contactLegalTeam());
        }
    }

    handleOwnershipChange() {
        const ownership = this.ownershipSelect.value;

        this.toggleHidden(this.singleOwnerOptions, ownership !== 'Single');
        this.toggleHidden(this.jointOwnerOptions, ownership !== 'Joint');

        this.singleOwnerTypeSelect.required = ownership === 'Single';
        this.jointOwnerTypeSelect.required = ownership === 'Joint';

        if (ownership !== 'Single') {
            this.singleOwnerTypeSelect.value = '';
            this.toggleHidden(this.companyNameField, true);
            this.companyNameInput.required = false;
            this.companyNameInput.value = '';
        }

        if (ownership !== 'Joint') {
            this.jointOwnerTypeSelect.value = '';
        }
    }

    handleSingleOwnerTypeChange() {
        const isCompany = this.singleOwnerTypeSelect.value === 'Company';
        this.toggleHidden(this.companyNameField, !isCompany);
        this.companyNameInput.required = isCompany;

        if (!isCompany) {
            this.companyNameInput.value = '';
        }
    }

    handleBankChange() {
        const isOtherBank = this.bankSelect.value === 'Other';
        this.toggleHidden(this.customBankField, !isOtherBank);
        this.customBankInput.required = isOtherBank;

        if (!isOtherBank) {
            this.customBankInput.value = '';
        }
    }

    handlePropertyTypeChange() {
        const propertyType = this.propertyTypeSelect.value;
        const options = ['<option value="">Select payment method</option>'];

        if (propertyType === 'HDB' || propertyType === 'Private') {
            options.push('<option value="Cash">Cash</option>');
            options.push('<option value="Loan">Loan</option>');
            options.push('<option value="CPF">CPF</option>');
        } else if (propertyType === 'Commercial') {
            options.push('<option value="CPF">CPF</option>');
        }

        this.paymentTypeSelect.innerHTML = options.join('');
        this.toggleHidden(this.paymentTypeOptions, !propertyType);
    }

    applyVoucher() {
        const rawCode = (this.voucherInput.value || '').trim().toUpperCase();
        const voucher = this.voucherLookup[rawCode];

        if (!rawCode) {
            this.setVoucherStatus('Enter a voucher code to apply.', 'warning');
            this.validVoucherInput.value = '';
            this.toggleHidden(this.voucherPreview, true);
            return;
        }

        if (!voucher) {
            this.setVoucherStatus('Invalid voucher code.', 'error');
            this.validVoucherInput.value = '';
            this.toggleHidden(this.voucherPreview, true);
            return;
        }

        this.validVoucherInput.value = voucher.code || rawCode;
        const discountValue = voucher.type === 'percentage'
            ? `${Math.round(voucher.value * 100)}%`
            : this.formatCurrency(voucher.value);

        this.setVoucherStatus(`${voucher.name} applied successfully.`, 'success');
        this.voucherPreview.textContent = `Discount: ${discountValue}`;
        this.toggleHidden(this.voucherPreview, false);
    }

    setVoucherStatus(message, type) {
        this.voucherMessage.textContent = message;
        this.voucherMessage.classList.remove('success', 'error', 'warning');
        if (type) {
            this.voucherMessage.classList.add(type);
        }
    }

    collectFormData() {
        return {
            name: this.nameInput.value.trim(),
            email: this.emailInput.value.trim(),
            phone: this.phoneInput.value.trim(),
            purpose: this.purposeSelect.value,
            propertyType: this.propertyTypeSelect.value,
            paymentType: this.paymentTypeSelect.value,
            ownership: this.ownershipSelect.value,
            singleOwnerType: this.singleOwnerTypeSelect.value,
            companyName: this.companyNameInput.value.trim(),
            jointOwnerType: this.jointOwnerTypeSelect.value,
            bank: this.bankSelect.value,
            customBankName: this.customBankInput.value.trim(),
            transactionValue: Number(this.transactionValueInput.value),
            voucherCode: (this.validVoucherInput.value || '').trim().toUpperCase()
        };
    }

    validateData(data) {
        const required = [
            ['name', 'full name'],
            ['email', 'email address'],
            ['phone', 'phone number'],
            ['purpose', 'transaction type'],
            ['propertyType', 'property type'],
            ['paymentType', 'payment method'],
            ['ownership', 'ownership type'],
            ['bank', 'bank'],
            ['transactionValue', 'transaction value']
        ];

        for (const [field, label] of required) {
            if (!data[field]) {
                throw new Error(`Please fill out ${label}.`);
            }
        }

        if (!/^[0-9]{8}$/.test(data.phone)) {
            throw new Error('Please enter a valid 8-digit Singapore phone number.');
        }

        if (!this.isValidEmail(data.email)) {
            throw new Error('Please enter a valid email address.');
        }

        if (!Number.isFinite(data.transactionValue) || data.transactionValue <= 0) {
            throw new Error('Please enter a valid transaction value greater than 0.');
        }

        if (data.ownership === 'Single' && !data.singleOwnerType) {
            throw new Error('Please select owner type for single ownership.');
        }

        if (data.singleOwnerType === 'Company' && !data.companyName) {
            throw new Error('Please enter company name.');
        }

        if (data.ownership === 'Joint' && !data.jointOwnerType) {
            throw new Error('Please select joint owner type.');
        }

        if (data.bank === 'Other' && !data.customBankName) {
            throw new Error('Please enter bank name.');
        }
    }

    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    calculateLegalFees(data) {
        const BASE_FEES = {
            HDB: 300,
            Private: 600,
            Commercial: 1000
        };

        const PURPOSE_RATES = {
            Buy: {
                HDB: 0.008,
                Private: 0.012,
                Commercial: 0.015
            },
            Sell: {
                HDB: 0.005,
                Private: 0.007,
                Commercial: 0.01
            }
        };

        const OWNERSHIP_FEES = {
            Joint: {
                'Husband & Wife': 200,
                'Two Individuals': 300
            },
            Single: {
                Company: 400,
                Individual: 0
            }
        };

        let baseFee = BASE_FEES[data.propertyType];

        if (data.purpose === 'Mortgage') {
            baseFee *= 0.8;
        } else {
            baseFee += data.transactionValue * PURPOSE_RATES[data.purpose][data.propertyType];
        }

        if (data.ownership === 'Joint') {
            baseFee += OWNERSHIP_FEES.Joint[data.jointOwnerType] || 0;
        } else {
            baseFee += OWNERSHIP_FEES.Single[data.singleOwnerType] || 0;
        }

        const gstAmount = baseFee * 0.09;
        return {
            baseFee,
            gstAmount,
            totalWithGst: baseFee + gstAmount
        };
    }

    applyDiscount(totalWithGst, voucherCode) {
        const voucher = this.voucherLookup[voucherCode];
        if (!voucher) {
            return { discount: 0, finalFee: totalWithGst, voucherName: '' };
        }

        const discount = voucher.type === 'percentage'
            ? totalWithGst * voucher.value
            : voucher.value;

        const finalFee = Math.max(0, totalWithGst - discount);
        return {
            discount,
            finalFee,
            voucherName: voucher.name
        };
    }

    handleSubmit() {
        try {
            const data = this.collectFormData();
            this.validateData(data);

            const feeBreakdown = this.calculateLegalFees(data);
            const discountResult = this.applyDiscount(feeBreakdown.totalWithGst, data.voucherCode);
            const ownershipSummary = this.buildOwnershipSummary(data);

            const results = {
                ...data,
                ownershipSummary,
                finalFee: discountResult.finalFee,
                discount: discountResult.discount,
                voucherName: discountResult.voucherName,
                transactionValueLabel: this.formatCurrency(data.transactionValue),
                estimatedAt: new Intl.DateTimeFormat('en-SG', {
                    timeZone: 'Asia/Singapore',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                }).format(new Date())
            };

            this.renderResults(results);
            this.showResults();
            UIManager.showToast('Legal fee estimate generated successfully.', 'success');
        } catch (error) {
            UIManager.showToast(error.message || 'Unable to calculate legal fee.', 'error');
        }
    }

    buildOwnershipSummary(data) {
        if (data.ownership === 'Single') {
            if (data.singleOwnerType === 'Company' && data.companyName) {
                return `Single (Company: ${data.companyName})`;
            }
            return `Single (${data.singleOwnerType || 'Individual'})`;
        }

        if (data.ownership === 'Joint') {
            return `Joint (${data.jointOwnerType || 'Not specified'})`;
        }

        return data.ownership;
    }

    renderResults(result) {
        this.summary.finalFee.textContent = this.formatCurrency(result.finalFee);
        this.summary.discount.textContent = this.formatCurrency(result.discount);
        this.summary.name.textContent = result.name;
        this.summary.email.textContent = result.email;
        this.summary.phone.textContent = `+65 ${result.phone}`;
        this.summary.purpose.textContent = result.purpose;
        this.summary.propertyType.textContent = result.propertyType;
        this.summary.ownership.textContent = result.ownershipSummary;
        this.summary.paymentType.textContent = result.paymentType;
        this.summary.bank.textContent = result.bank === 'Other' ? result.customBankName : result.bank;
        this.summary.transactionValue.textContent = result.transactionValueLabel;
        this.summary.dateTime.textContent = result.estimatedAt;

        if (this.contactButton) {
            this.contactButton.disabled = false;
            this.contactButton.innerHTML = '<i class="fas fa-paper-plane"></i>Contact Legal Team';
        }
    }

    showResults() {
        this.toggleHidden(this.form, true);
        this.toggleHidden(this.resultPanel, false);
    }

    showForm() {
        this.toggleHidden(this.resultPanel, true);
        this.toggleHidden(this.form, false);
    }

    contactLegalTeam() {
        const subject = encodeURIComponent('Legal Fee Estimation Consultation Request');
        const body = encodeURIComponent('Hello DLLC Team,\n\nI would like to discuss my legal fee estimation in detail. Please contact me for next steps.\n\nThank you.');
        window.open(`mailto:${CONFIG.APP.EMAIL}?subject=${subject}&body=${body}`, '_blank');

        if (this.contactButton) {
            this.contactButton.disabled = true;
            this.contactButton.innerHTML = '<i class="fas fa-check"></i>Request Sent';
        }

        UIManager.showToast('Your consultation request is ready to send by email.', 'info');
    }

    toggleHidden(element, shouldHide) {
        if (!element) return;
        element.classList.toggle('is-hidden', shouldHide);
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-SG', {
            style: 'currency',
            currency: 'SGD'
        }).format(amount || 0);
    }

    reset() {
        if (!this.form) {
            return;
        }

        this.form.reset();
        this.validVoucherInput.value = '';
        this.voucherMessage.textContent = '';
        this.toggleHidden(this.voucherPreview, true);

        this.toggleHidden(this.paymentTypeOptions, true);
        this.toggleHidden(this.singleOwnerOptions, true);
        this.toggleHidden(this.jointOwnerOptions, true);
        this.toggleHidden(this.companyNameField, true);
        this.toggleHidden(this.customBankField, true);

        this.singleOwnerTypeSelect.required = false;
        this.jointOwnerTypeSelect.required = false;
        this.companyNameInput.required = false;
        this.customBankInput.required = false;

        this.showForm();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.legalFeeCalculator = new LegalFeeCalculator();
    window.legalFeeCalculator.init();
});
