/* ===================================================================
   CONFIGURATION FILE
   API Keys, Constants, and Global Settings
   =================================================================== */

// API Configuration
const CONFIG = {
    // OpenRouter API Configuration (routes to DeepSeek)
    API: {
        OPENROUTER_KEY: '', // Add your OpenRouter key before running in production
        OPENROUTER_URL: 'https://openrouter.ai/api/v1/chat/completions',
        MODEL: 'deepseek/deepseek-chat',
        FALLBACK_MODELS: ['google/gemini-3.1-flash-lite', '~openai/gpt-mini-latest', 'openrouter/auto'],
        MAX_TOKENS: 2000,
        TEMPERATURE: 0.7,
        REQUEST_TIMEOUT_MS: 45000
    },

    OCR: {
        ENABLED: true,
        LANGUAGE: 'eng',
        TIMEOUT_MS: 40000
    },

    // Application Settings
    APP: {
        NAME: 'Singapore Legal Coverage Calculator',
        VERSION: '2.0.0',
        DEVELOPER: 'Eshwar Potnuru',
        EMAIL: 'eshwarpotnuru35@gmail.com',
        PHONE: '+65 80585329'
    },

    // File Upload Settings
    FILES: {
        MAX_SIZE: 10 * 1024 * 1024, // 10MB
        ACCEPTED_TYPES: ['.pdf', '.docx', '.txt', '.jpg', '.jpeg', '.png'],
        MAX_FILES: 10
    },

    // Legal Calculation Constants
    LEGAL: {
        // Base legal fee percentages
        REPRESENTATION_FEES: {
            'full-service': 0.15,           // 15% of claim
            'consultation-only': 500,       // Fixed rate
            'document-review': 800,         // Fixed rate
            'court-representation': 0.20    // 20% of claim
        },

        // Injury severity multipliers
        SEVERITY_MULTIPLIERS: {
            'minor': 1.0,
            'moderate': 1.3,
            'severe': 1.6,
            'critical': 2.0
        },

        // Accident type multipliers
        ACCIDENT_MULTIPLIERS: {
            'motor-vehicle': 1.2,
            'workplace': 1.4,
            'public-area': 1.1,
            'medical-negligence': 1.8,
            'product-liability': 1.5
        },

        // Urgency multipliers
        URGENCY_MULTIPLIERS: {
            'standard': 1.0,
            'urgent': 1.3,
            'emergency': 1.6
        },

        // GST rate for Singapore
        GST_RATE: 0.09, // 9%

        // Minimum and maximum recovery rates
        MIN_RECOVERY_RATE: 30,
        MAX_RECOVERY_RATE: 95
    }
};

// Injury Types Database
const INJURY_TYPES = {
    'head-injury': {
        name: 'Head Injury',
        severity: 'severe',
        baseRecovery: 75,
        description: 'Traumatic brain injuries, concussions, skull fractures',
        legalCategory: 'Personal Injury - Neurological',
        icon: 'fas fa-head-side-brain',
        keywords: ['head', 'brain', 'concussion', 'skull', 'neurological']
    },
    'spinal-injury': {
        name: 'Spinal Injury',
        severity: 'critical',
        baseRecovery: 85,
        description: 'Spinal cord injuries, herniated discs, back injuries',
        legalCategory: 'Personal Injury - Spinal',
        icon: 'fas fa-spine',
        keywords: ['spine', 'spinal', 'back', 'disc', 'vertebrae']
    },
    'broken-bones': {
        name: 'Broken Bones',
        severity: 'moderate',
        baseRecovery: 70,
        description: 'Fractures, dislocations, bone injuries',
        legalCategory: 'Personal Injury - Orthopedic',
        icon: 'fas fa-bone',
        keywords: ['fracture', 'break', 'bone', 'dislocation', 'orthopedic']
    },
    'soft-tissue': {
        name: 'Soft Tissue',
        severity: 'minor',
        baseRecovery: 60,
        description: 'Sprains, strains, muscle injuries, whiplash',
        legalCategory: 'Personal Injury - Soft Tissue',
        icon: 'fas fa-band-aid',
        keywords: ['sprain', 'strain', 'muscle', 'whiplash', 'tissue']
    },
    'burns': {
        name: 'Burns',
        severity: 'severe',
        baseRecovery: 80,
        description: 'Thermal burns, chemical burns, electrical burns',
        legalCategory: 'Personal Injury - Burns',
        icon: 'fas fa-fire-alt',
        keywords: ['burn', 'thermal', 'chemical', 'electrical', 'skin']
    },
    'lacerations': {
        name: 'Cuts & Lacerations',
        severity: 'minor',
        baseRecovery: 55,
        description: 'Deep cuts, lacerations requiring stitches',
        legalCategory: 'Personal Injury - Lacerations',
        icon: 'fas fa-cut',
        keywords: ['cut', 'laceration', 'wound', 'stitch', 'scar']
    },
    'internal-injuries': {
        name: 'Internal Injuries',
        severity: 'critical',
        baseRecovery: 90,
        description: 'Internal bleeding, organ damage',
        legalCategory: 'Personal Injury - Internal',
        icon: 'fas fa-heartbeat',
        keywords: ['internal', 'organ', 'bleeding', 'abdomen', 'chest']
    },
    'psychological': {
        name: 'Psychological Trauma',
        severity: 'moderate',
        baseRecovery: 65,
        description: 'PTSD, anxiety, depression from accident',
        legalCategory: 'Personal Injury - Psychological',
        icon: 'fas fa-brain',
        keywords: ['ptsd', 'anxiety', 'depression', 'trauma', 'psychological']
    }
};

// Singapore Legal System Constants
const SINGAPORE_LEGAL = {
    LIMITATION_PERIODS: {
        'personal-injury': 3, // 3 years for personal injury claims
        'property-damage': 6, // 6 years for property damage
        'contract': 6 // 6 years for contract claims
    },

    COURT_JURISDICTIONS: {
        MAGISTRATE: 60000,    // Up to S$60,000
        DISTRICT: 250000,     // Up to S$250,000
        HIGH_COURT: Infinity  // Above S$250,000
    },

    TYPICAL_SETTLEMENTS: {
        'minor-injury': { min: 1000, max: 15000 },
        'moderate-injury': { min: 15000, max: 50000 },
        'severe-injury': { min: 50000, max: 200000 },
        'critical-injury': { min: 200000, max: 1000000 }
    }
};

// Error Messages
const ERROR_MESSAGES = {
    FILE_TOO_LARGE: 'File size exceeds 10MB limit',
    INVALID_FILE_TYPE: 'File type not supported',
    TOO_MANY_FILES: 'Maximum 10 files allowed',
    NETWORK_ERROR: 'Network connection error. Please try again.',
    API_ERROR: 'AI service temporarily unavailable',
    VALIDATION_ERROR: 'Please fill in all required fields',
    CALCULATION_ERROR: 'Error calculating legal coverage'
};

// Success Messages
const SUCCESS_MESSAGES = {
    FILE_UPLOADED: 'File uploaded successfully',
    ANALYSIS_COMPLETE: 'AI analysis completed',
    FORM_SUBMITTED: 'Assessment completed successfully',
    EMAIL_SENT: 'Message sent successfully'
};

// UI Constants
const UI_CONSTANTS = {
    ANIMATION_DURATION: 300,
    TOAST_DURATION: 5000,
    LOADING_MIN_TIME: 1500,
    TYPING_SPEED: 50,
    MAX_CHAT_HISTORY: 20
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CONFIG,
        INJURY_TYPES,
        SINGAPORE_LEGAL,
        ERROR_MESSAGES,
        SUCCESS_MESSAGES,
        UI_CONSTANTS
    };
}