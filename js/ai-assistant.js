/**
 * Professional AI Assistant System
 * Features: Document Upload, AI Analysis, Context-Aware Chat, Animations
 * Integration: DeepSeek API via OpenRouter
 */

class AIAssistant {
    constructor() {
        const configuredFallback = CONFIG?.API?.FALLBACK_MODELS;

        this.apiConfig = {
            key: CONFIG?.API?.OPENROUTER_KEY || '',
            url: CONFIG?.API?.OPENROUTER_URL || '',
            model: CONFIG?.API?.MODEL || 'deepseek/deepseek-chat',
            fallbackModels: Array.isArray(configuredFallback) ? configuredFallback : ['openrouter/auto'],
            temperature: CONFIG?.API?.TEMPERATURE ?? 0.7,
            maxTokens: CONFIG?.API?.MAX_TOKENS ?? 1800,
            requestTimeoutMs: CONFIG?.API?.REQUEST_TIMEOUT_MS ?? 45000
        };

        this.ocrConfig = {
            enabled: CONFIG?.OCR?.ENABLED ?? true,
            language: CONFIG?.OCR?.LANGUAGE || 'eng',
            timeoutMs: CONFIG?.OCR?.TIMEOUT_MS ?? 40000
        };

        this.fileConfig = {
            maxSize: CONFIG?.FILES?.MAX_SIZE ?? 10 * 1024 * 1024,
            acceptedTypes: CONFIG?.FILES?.ACCEPTED_TYPES || ['.pdf', '.docx', '.txt', '.jpg', '.jpeg', '.png'],
            maxFiles: CONFIG?.FILES?.MAX_FILES ?? 10
        };

        this.elements = {
            modal: document.getElementById('aiChatModal'),
            messages: document.getElementById('aiChatMessages'),
            input: document.getElementById('aiChatInput'),
            sendButton: document.getElementById('aiChatSendButton'),
            attachButton: document.getElementById('aiChatAttachButton'),
            uploadButton: document.getElementById('aiChatUploadButton'),
            fileInput: document.getElementById('aiChatFileInput'),
            uploadZone: document.getElementById('aiChatUploadZone'),
            documentList: document.getElementById('aiChatDocumentList'),
            quickActions: document.getElementById('aiChatQuickActions'),
            closeButton: document.getElementById('aiChatCloseButton')
        };

        if (!this.elements.messages || !this.elements.input) {
            console.warn('AI Assistant: Required DOM nodes were not found.');
            return;
        }

        this.documents = [];
        this.chatHistory = [];
        this.state = {
            busy: false
        };

        this.setupEventListeners();
        this.addWelcomeMessage();
        console.info('✨ AI Assistant initialised');
    }

    setupEventListeners() {
        const { fileInput, uploadButton, attachButton, sendButton, input, uploadZone, quickActions, documentList, closeButton } = this.elements;

        if (fileInput) {
            fileInput.addEventListener('change', (event) => {
                const files = Array.from(event.target.files || []);
                if (files.length) {
                    this.processFiles(files);
                }
            });
        }

        if (uploadButton) {
            uploadButton.addEventListener('click', () => fileInput?.click());
        }

        if (attachButton) {
            attachButton.addEventListener('click', () => fileInput?.click());
        }

        if (sendButton) {
            sendButton.addEventListener('click', () => this.sendMessage());
        }

        if (input) {
            input.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    this.sendMessage();
                }
            });

            input.addEventListener('input', () => this.handleInputResize());
        }

        if (uploadZone) {
            ['dragenter', 'dragover'].forEach((evt) => {
                uploadZone.addEventListener(evt, (event) => this.handleDragOver(event));
            });

            ['dragleave', 'dragend'].forEach((evt) => {
                uploadZone.addEventListener(evt, (event) => this.handleDragLeave(event));
            });

            uploadZone.addEventListener('drop', (event) => this.handleDrop(event));
            uploadZone.addEventListener('click', () => fileInput?.click());
        }

        if (quickActions) {
            quickActions.addEventListener('click', (event) => this.handleQuickActionClick(event));
        }

        if (documentList) {
            documentList.addEventListener('click', (event) => this.handleDocumentListClick(event));
        }

        if (closeButton) {
            closeButton.addEventListener('click', () => closeAIChat());
        }
    }

    addWelcomeMessage() {
        const content = `
            <p><strong>Welcome to the AI Legal Assistant.</strong></p>
            <p>I can analyse accident reports, medical summaries, police statements, and insurance correspondence to help you understand potential coverage in Singapore.</p>
            <p>Upload your documents on the left or ask a question to get started.</p>
        `;

        this.appendMessage('ai', content, {
            isHtml: true
        });
    }

    async sendMessage() {
        if (this.state.busy) return;

        const value = (this.elements.input?.value || '').trim();
        if (!value) {
            UIManager.showToast('Please enter a question before sending.', 'warning');
            return;
        }

        this.elements.input.value = '';
        this.handleInputResize();

        await this.submitPrompt(value);
    }

    async submitPrompt(message, { echoUser = true } = {}) {
        if (!message.trim()) return;

        if (echoUser) {
            this.appendMessage('user', message);
        }

        this.chatHistory.push({ role: 'user', content: message });
        this.trimHistory();

        await this.callAssistant(message, { includeContext: true });
    }

    async callAssistant(message, { includeContext = true } = {}) {
        if (!this.apiConfig.key || !this.apiConfig.url) {
            this.appendMessage('system', 'AI service is not configured. Please add your OpenRouter API key in <code>config.js</code>.', {
                isHtml: true,
                showTime: false
            });
            return;
        }

        const context = includeContext ? this.buildDocumentContext() : '';
        const prompt = context ? `${context}\n\nQuestion: ${message}` : message;

        const thinkingId = this.addThinkingIndicator();
        this.setBusy(true);

        try {
            const history = this.chatHistory.slice(-((UI_CONSTANTS?.MAX_CHAT_HISTORY) || 20));
            const payload = [
                {
                    role: 'system',
                    content: 'You are a professional Singapore accident claims assistant. Provide structured, concise, and empathetic guidance. Reference uploaded documents by name when relevant. Avoid offering guarantees; instead discuss likelihoods and recommended actions in Singapore context. Use plain paragraphs and bullet points only. Do not use markdown headings (#).'
                },
                ...history,
                { role: 'user', content: prompt }
            ];

            const completion = await this.requestChatCompletion(payload, {
                temperature: this.apiConfig.temperature,
                maxTokens: this.apiConfig.maxTokens
            });

            this.removeThinkingIndicator(thinkingId);

            const cleaned = completion.trim() || 'I could not generate a helpful response, please try rephrasing your question.';
            this.appendMessage('ai', cleaned);

            this.chatHistory.push({ role: 'assistant', content: cleaned });
            this.trimHistory();
        } catch (error) {
            this.removeThinkingIndicator(thinkingId);
            console.error('AI Assistant error:', error);
            const messageSafe = this.escapeHtml(error.message || 'Unexpected error contacting the AI service.');
            this.appendMessage('system', `❌ ${messageSafe}`, { isHtml: true });
            UIManager.showToast(error.message || 'AI service error', 'error');
        } finally {
            this.setBusy(false);
        }
    }

    async processFiles(files) {
        if (!files.length) return;

        const remaining = this.fileConfig.maxFiles - this.documents.length;
        if (remaining <= 0) {
            UIManager.showToast(`You can upload up to ${this.fileConfig.maxFiles} documents per session.`, 'warning');
            return;
        }

        const limited = files.slice(0, remaining);
        if (limited.length < files.length) {
            UIManager.showToast('Some files were ignored to respect the maximum document limit.', 'warning');
        }

        for (const file of limited) {
            const validationError = this.validateFile(file);
            if (validationError) {
                UIManager.showToast(`${file.name}: ${validationError}`, 'error');
                continue;
            }

            const doc = this.createDocumentRecord(file);
            this.documents.push(doc);
            this.renderDocumentList();
            this.appendMessage('system', `📄 Analysing <strong>${this.escapeHtml(doc.name)}</strong>…`, {
                isHtml: true,
                showTime: false
            });

            try {
                doc.content = await this.readFile(file);
                doc.analysis = await this.analyseDocument(doc);
                doc.status = 'ready';
                doc.analysisSource = 'provider';
                this.renderDocumentList();
                this.showDocumentAnalysis(doc);
                UIManager.showToast(`Analysis completed for ${doc.name}`, 'success');
            } catch (error) {
                doc.status = 'error';
                doc.error = error.message;
                this.renderDocumentList();
                const safeError = this.escapeHtml(error.message || 'Unable to analyse this document.');
                this.appendMessage('system', `❌ ${safeError}`, { isHtml: true });
                const fallback = this.buildFallbackAnalysis(doc);
                if (fallback) {
                    doc.analysis = fallback;
                    doc.status = 'fallback';
                    doc.analysisSource = 'fallback';
                    this.renderDocumentList();
                    this.appendMessage('system', `⚠️ Showing an offline summary for <strong>${this.escapeHtml(doc.name)}</strong> while the AI service is unavailable. Review carefully.`, { isHtml: true, showTime: false });
                    this.showDocumentAnalysis(doc);
                    UIManager.showToast(`Generated a fallback summary for ${doc.name}`, 'warning');
                } else {
                    UIManager.showToast(`Failed to analyse ${doc.name}`, 'error');
                }
            }
        }

        this.clearFileInput();
    }

    validateFile(file) {
        if (!file) return 'Invalid file.';

        if (file.size > this.fileConfig.maxSize) {
            return `File exceeds ${(this.fileConfig.maxSize / (1024 * 1024)).toFixed(0)}MB limit.`;
        }

        const extension = this.getFileExtension(file.name) || this.getExtensionFromMimeType(file.type);
        const allowedTypes = this.fileConfig.acceptedTypes
            .map((type) => type.replace('.', '').toUpperCase())
            .join(', ');

        if (extension === '.doc') {
            return 'Legacy .doc files are not supported. Please save as .docx and upload again.';
        }

        if (!extension) {
            return `Unsupported file type. Allowed formats: ${allowedTypes}.`;
        }

        if (this.fileConfig.acceptedTypes.length && !this.fileConfig.acceptedTypes.includes(extension)) {
            return `Unsupported file type (${extension}). Allowed formats: ${allowedTypes}.`;
        }

        return null;
    }

    createDocumentRecord(file) {
        return {
            id: `doc-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            file,
            name: file.name,
            type: file.type || this.getMimeType(file.name),
            size: file.size,
            status: 'processing',
            createdAt: Date.now(),
            content: null,
            analysis: null,
            analysisSource: 'pending',
            error: null
        };
    }

    async readFile(file) {
        if (!file) throw new Error('No file provided.');

        const extension = this.getFileExtension(file.name) || this.getExtensionFromMimeType(file.type);

        if (extension === '.doc') {
            throw new Error('Legacy .doc files are not supported. Please upload a .docx file.');
        }

        if (extension === '.pdf' && window.pdfjsLib) {
            return await this.extractPdfText(file);
        }

        if (extension === '.docx' && window.mammoth) {
            return await this.extractDocxText(file);
        }

        if (file.type.startsWith('image/')) {
            return await this.extractImageText(file);
        }

        return await this.readAsText(file);
    }

    async extractPdfText(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let text = '';

            for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
                const page = await pdf.getPage(pageNumber);
                const content = await page.getTextContent();
                const pageText = content.items.map((item) => item.str).join(' ');
                text += `${pageText}\n\n`;
                if (text.length > 6000) break;
            }

            return text.trim() || `[PDF file: ${file.name} - Unable to extract text.]`;
        } catch (error) {
            console.warn('PDF extraction failed, falling back to placeholder.', error);
            return `[PDF file: ${file.name}]`;
        }
    }

    async extractDocxText(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const result = await window.mammoth.extractRawText({ arrayBuffer });
            return result.value.trim() || `[DOCX file: ${file.name} - No readable text]`;
        } catch (error) {
            console.warn('DOCX extraction failed:', error);
            return `[DOCX file: ${file.name}]`;
        }
    }

    async extractImageText(file) {
        const base64 = await this.readAsDataURL(file);

        if (!this.ocrConfig.enabled || !window.Tesseract) {
            return `[Image file: ${file.name}]\nOCR unavailable. Base64:${base64.substring(0, 1200)}...`;
        }

        try {
            const recognizePromise = window.Tesseract.recognize(file, this.ocrConfig.language);
            const result = await this.withTimeout(recognizePromise, this.ocrConfig.timeoutMs, `OCR timed out after ${this.ocrConfig.timeoutMs}ms.`);
            const text = String(result?.data?.text || '').replace(/\s+/g, ' ').trim();

            if (text) {
                return `[Image file: ${file.name}]\nOCR text:\n${this.truncateText(text, 5000)}`;
            }

            return `[Image file: ${file.name} - OCR found no readable text]\nBase64:${base64.substring(0, 1200)}...`;
        } catch (error) {
            console.warn('Image OCR failed:', error);
            return `[Image file: ${file.name}]\nOCR failed. Base64:${base64.substring(0, 1200)}...`;
        }
    }

    async readAsText(file) {
        return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result || '');
            reader.onerror = () => reject(new Error('Unable to read file.'));
            reader.readAsText(file);
        });
    }

    async readAsDataURL(file) {
        return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result || '');
            reader.onerror = () => reject(new Error('Unable to read file.'));
            reader.readAsDataURL(file);
        });
    }

    async analyseDocument(doc) {
        if (!doc.content) {
            throw new Error('Document content could not be read.');
        }

        const truncated = this.truncateText(doc.content, 4000);

        const schema = `{
            "summary": string,
            "injuries": string[],
            "circumstances": string,
            "faultIndicators": string[],
            "claimAmount": string,
            "successProbability": number (0-100),
            "suggestedActions": string[],
            "riskFactors": string[],
            "recommendedEvidence": string[]
        }`;

        const prompt = `You are a Singapore personal injury legal analyst. Review the uploaded document and respond ONLY with valid JSON following this schema: ${schema}.

Accident and injury documents include police reports, medical summaries, and insurance emails. Focus on liability signals, injury severity, and practical next steps.

Document name: ${doc.name}
Extracted text (truncated to 4k characters):\n${truncated}`;

        const messages = [
            { role: 'system', content: 'Respond strictly with valid JSON that matches the provided schema. Do not include commentary outside the JSON.' },
            { role: 'user', content: prompt }
        ];

        const rawResponse = await this.requestChatCompletion(messages, {
            temperature: 0.2,
            maxTokens: 1200
        });

        return this.parseAnalysisResponse(rawResponse, doc.name);
    }

    parseAnalysisResponse(response, name) {
        const cleaned = response.replace(/```json|```/gi, '').trim();

        // Best-effort extraction when models add extra prose around JSON.
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        const candidate = (firstBrace !== -1 && lastBrace > firstBrace)
            ? cleaned.slice(firstBrace, lastBrace + 1)
            : cleaned;

        try {
            const parsed = JSON.parse(candidate);
            return {
                summary: parsed.summary || '',
                injuries: this.toArray(parsed.injuries),
                circumstances: parsed.circumstances || '',
                faultIndicators: this.toArray(parsed.faultIndicators),
                claimAmount: parsed.claimAmount || '',
                successProbability: this.toNumber(parsed.successProbability),
                suggestedActions: this.toArray(parsed.suggestedActions),
                riskFactors: this.toArray(parsed.riskFactors),
                recommendedEvidence: this.toArray(parsed.recommendedEvidence),
                excerpt: parsed.excerpt || '',
                raw: candidate,
                name
            };
        } catch (error) {
            console.warn('Failed to parse JSON analysis. Falling back to heuristic analysis.', error);
            throw new Error('Model did not return valid JSON analysis output.');
        }
    }

    buildFallbackAnalysis(doc) {
        const rawContent = typeof doc.content === 'string' ? doc.content : String(doc.content || '');
        const normalized = rawContent.replace(/\s+/g, ' ').trim();

        if (!normalized) {
            return null;
        }

        const lowerText = normalized.toLowerCase();
        const dedupe = (items) => Array.from(new Set((items || []).filter(Boolean).map((item) => item.trim()).filter(Boolean)));

        const sentences = normalized.split(/(?<=[.!?])\s+/).filter(Boolean);
        const circumstancesCandidate = sentences.find((sentence) => /accident|collision|incident|impact|crash|fall|injur/i.test(sentence.toLowerCase()));
        const circumstances = circumstancesCandidate || sentences[0] || '';
        const summary = this.truncateText(normalized, 480);
        const excerpt = this.truncateText(normalized, 320);

        const injuries = [];
        if (typeof INJURY_TYPES === 'object' && INJURY_TYPES) {
            Object.values(INJURY_TYPES).forEach((injury) => {
                if (!injury || !injury.name) {
                    return;
                }
                const keywords = Array.isArray(injury.keywords) ? injury.keywords : [];
                const matched = keywords.some((keyword) => keyword && lowerText.includes(keyword.toLowerCase()));
                if (matched) {
                    injuries.push(injury.name);
                }
            });
        }

        const faultSignals = [
            { pattern: /\bneglig/i, label: 'Negligence is highlighted in the document.' },
            { pattern: /\bfault|\bliable|\bliability/i, label: 'Liability or fault is being discussed.' },
            { pattern: /\bspeed/i, label: 'Speed is mentioned as a contributing factor.' },
            { pattern: /\balcohol|\bdrunk|\bintoxic/i, label: 'Possible impairment is referenced.' },
            { pattern: /failure to (yield|stop)|did not (yield|stop)/i, label: 'Failure to follow traffic controls is alleged.' }
        ];
        const faultIndicators = faultSignals
            .filter((signal) => signal.pattern.test(normalized))
            .map((signal) => signal.label);

        const moneyMatch = normalized.match(/(?:S\$|SGD|\$)\s?\d{1,3}(?:[\s,]\d{3})*(?:\.\d{2})?/i);
        const claimAmount = moneyMatch ? moneyMatch[0].replace(/\s+/g, ' ') : '';

        const suggestedActions = [
            'Document all medical treatments and expenses in detail.',
            'Maintain a clear timeline of the incident and recovery milestones.',
            'Consult a legal professional to evaluate potential claims and deadlines.'
        ];
        if (lowerText.includes('witness')) {
            suggestedActions.push('Gather witness accounts and keep their contact information handy.');
        }
        if (lowerText.includes('police')) {
            suggestedActions.push('Request and review the official police report to confirm facts.');
        }

        const riskFactors = [];
        if (/\bdelay|\blate|\blimitation|\btime/i.test(lowerText)) {
            riskFactors.push('Delays mentioned here could impact limitation periods in Singapore.');
        }
        if (/\bdispute|\bcontradict|\bconflict/i.test(lowerText)) {
            riskFactors.push('Disputed accounts may require additional evidence to clarify liability.');
        }
        if (!injuries.length) {
            riskFactors.push('Injury details are sparse; collate medical records to substantiate harm.');
        }

        const recommendedEvidence = [
            'Medical reports, bills, and rehabilitation records',
            'Photographs or videos of the injuries and accident scene',
            'Correspondence with insurers or employers regarding the incident'
        ];
        if (lowerText.includes('witness')) {
            recommendedEvidence.push('Witness statements and contact information');
        }
        if (lowerText.includes('police')) {
            recommendedEvidence.push('Official police or incident report');
        }

        return {
            summary: summary || 'No clear summary could be generated from the document.',
            injuries: dedupe(injuries),
            circumstances: this.truncateText(circumstances, 320),
            faultIndicators: dedupe(faultIndicators),
            claimAmount,
            successProbability: null,
            suggestedActions: dedupe(suggestedActions),
            riskFactors: dedupe(riskFactors),
            recommendedEvidence: dedupe(recommendedEvidence),
            excerpt,
            raw: summary,
            name: doc.name
        };
    }

    renderDocumentList() {
        const container = this.elements.documentList;
        if (!container) return;

        if (!this.documents.length) {
            container.innerHTML = `
                <div class="chat-document-empty">
                    <p>No supporting documents uploaded yet.</p>
                    <p>Add PDF, DOCX, TXT, or image files to enrich the AI analysis.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.documents
            .map((doc) => this.getDocumentItemMarkup(doc))
            .join('');
    }

    getDocumentItemMarkup(doc) {
        const statusLabel = this.formatDocumentStatus(doc.status);
        const statusClass = (
            {
                ready: 'status-ready',
                error: 'status-error',
                fallback: 'status-fallback',
                processing: 'status-processing'
            }[doc.status]
        ) || 'status-processing';

        const meta = [
            this.formatFileSize(doc.size),
            doc.type || 'Unknown format'
        ].filter(Boolean).join(' • ');

        const actions = (doc.status === 'ready' || doc.status === 'fallback')
            ? `<div class="document-actions">
                    <button type="button" data-action="view">View analysis</button>
                    <button type="button" data-action="remove">Remove</button>
               </div>`
            : doc.status === 'error'
            ? `<div class="document-actions">
                    <button type="button" data-action="remove">Remove</button>
               </div>`
            : '';

        const isActive = doc.status === 'ready' || doc.status === 'fallback';

        return `
            <div class="document-item ${isActive ? 'is-active' : ''}" data-doc-id="${doc.id}">
                <div class="document-name">
                    <i class="fas fa-file-alt"></i>
                    <span>${this.escapeHtml(doc.name)}</span>
                </div>
                <div class="document-meta">
                    <span>${this.escapeHtml(meta)}</span>
                    <span class="status-tag ${statusClass}">${statusLabel}</span>
                </div>
                ${actions}
            </div>
        `;
    }

    handleQuickActionClick(event) {
        const button = event.target.closest('[data-action]');
        if (!button) return;

        const action = button.dataset.action;

        switch (action) {
            case 'guide':
                this.submitPrompt('Please explain how you can assist me with accident claims and what information you need.', { echoUser: true });
                break;
            case 'upload':
                this.elements.fileInput?.click();
                break;
            case 'suggest':
                this.appendMessage('system', `
                    <p>Try asking:</p>
                    <ul>
                        <li>What compensation range can I expect for my injuries?</li>
                        <li>What evidence should I collect to strengthen my claim?</li>
                        <li>How does partial fault affect my case in Singapore?</li>
                    </ul>
                `, { isHtml: true, showTime: false });
                break;
            default:
                break;
        }
    }

    handleDocumentListClick(event) {
        const actionButton = event.target.closest('[data-action]');
        if (!actionButton) return;

        const row = actionButton.closest('.document-item');
        const docId = row?.dataset.docId;
        if (!docId) return;

        const doc = this.documents.find((item) => item.id === docId);
        if (!doc) return;

        const action = actionButton.dataset.action;
        if (action === 'view' && doc.analysis) {
            this.highlightDocument(docId);
            this.showDocumentAnalysis(doc, { scrollIntoView: true });
        }

        if (action === 'remove') {
            this.removeDocument(docId);
        }
    }

    removeDocument(docId) {
        const doc = this.documents.find((item) => item.id === docId);
        this.documents = this.documents.filter((item) => item.id !== docId);
        this.renderDocumentList();

        if (doc) {
            this.appendMessage('system', `🗑️ Removed <strong>${this.escapeHtml(doc.name)}</strong> from this session.`, { isHtml: true, showTime: false });
        }
    }

    highlightDocument(docId) {
        const items = this.elements.documentList?.querySelectorAll('.document-item');
        items?.forEach((item) => {
            item.classList.toggle('is-active', item.dataset.docId === docId);
        });
    }

    showDocumentAnalysis(doc, { scrollIntoView = false } = {}) {
        if (!doc.analysis) return;

        const analysis = doc.analysis;
        const sections = [];

        if (doc.analysisSource === 'fallback') {
            sections.push(`
                <div class="analysis-card">
                    <h4><i class="fas fa-info-circle"></i>Offline Summary</h4>
                    <p>This overview was generated locally because the AI provider was unavailable. Cross-check the details against your document.</p>
                </div>
            `);
        }

        if (analysis.summary) {
            sections.push(`
                <div class="analysis-card">
                    <h4><i class="fas fa-file-signature"></i><span>${this.escapeHtml(doc.name)}</span></h4>
                    <p>${this.escapeHtml(analysis.summary)}</p>
                </div>
            `);
        }

        if (analysis.injuries.length) {
            sections.push(`
                <div class="analysis-card">
                    <h4><i class="fas fa-notes-medical"></i>Injuries Highlighted</h4>
                    <ul>
                        ${analysis.injuries.map((item) => `<li>${this.escapeHtml(item)}</li>`).join('')}
                    </ul>
                </div>
            `);
        }

        if (analysis.circumstances) {
            sections.push(`
                <div class="analysis-card">
                    <h4><i class="fas fa-traffic-light"></i>Accident Circumstances</h4>
                    <p>${this.escapeHtml(analysis.circumstances)}</p>
                </div>
            `);
        }

        if (analysis.faultIndicators.length) {
            sections.push(`
                <div class="analysis-card">
                    <h4><i class="fas fa-balance-scale"></i>Fault Indicators</h4>
                    <ul>
                        ${analysis.faultIndicators.map((item) => `<li>${this.escapeHtml(item)}</li>`).join('')}
                    </ul>
                </div>
            `);
        }

        if (analysis.successProbability !== null && !Number.isNaN(analysis.successProbability)) {
            const probability = Math.max(0, Math.min(100, Math.round(analysis.successProbability)));
            sections.push(`
                <div class="analysis-card">
                    <h4><i class="fas fa-chart-line"></i>Success Probability</h4>
                    <div class="probability-meter">
                        <div class="probability-bar" style="width: ${probability}%"></div>
                    </div>
                    <p>${probability}% estimated success rate based on document signals.</p>
                </div>
            `);
        }

        if (analysis.suggestedActions.length) {
            sections.push(`
                <div class="analysis-card">
                    <h4><i class="fas fa-clipboard-check"></i>Recommended Actions</h4>
                    <ul>
                        ${analysis.suggestedActions.map((item) => `<li>${this.escapeHtml(item)}</li>`).join('')}
                    </ul>
                </div>
            `);
        }

        if (analysis.riskFactors.length) {
            sections.push(`
                <div class="analysis-card">
                    <h4><i class="fas fa-exclamation-triangle"></i>Risk Factors</h4>
                    <ul>
                        ${analysis.riskFactors.map((item) => `<li class="warning">${this.escapeHtml(item)}</li>`).join('')}
                    </ul>
                </div>
            `);
        }

        if (analysis.recommendedEvidence.length) {
            sections.push(`
                <div class="analysis-card">
                    <h4><i class="fas fa-folder-open"></i>Recommended Evidence</h4>
                    <ul>
                        ${analysis.recommendedEvidence.map((item) => `<li>${this.escapeHtml(item)}</li>`).join('')}
                    </ul>
                </div>
            `);
        }

        if (!sections.length) {
            const fallbackExcerpt = this.escapeHtml(this.truncateText(doc.content || analysis.raw || '', 360));
            sections.push(`
                <div class="analysis-card">
                    <h4><i class="fas fa-file-alt"></i>Document Overview</h4>
                    <p>${fallbackExcerpt || 'No analyzable text was found in this document.'}</p>
                </div>
            `);
        }

        if (analysis.raw) {
            const rawFormatted = this.escapeHtml(this.truncateText(analysis.raw, 1800));
            sections.push(`
                <div class="analysis-card">
                    <h4><i class="fas fa-database"></i>Full AI Response</h4>
                    <details class="analysis-raw">
                        <summary>View structured output</summary>
                        <pre>${rawFormatted}</pre>
                    </details>
                </div>
            `);
        }

        const html = sections.join('');
        this.appendMessage('ai', html, { isHtml: true });

        if (scrollIntoView) {
            this.scrollToBottom();
        }
    }

    handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        this.elements.uploadZone?.classList.add('dragover');
    }

    handleDragLeave(event) {
        event.preventDefault();
        event.stopPropagation();
        this.elements.uploadZone?.classList.remove('dragover');
    }

    handleDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        this.elements.uploadZone?.classList.remove('dragover');

        const files = Array.from(event.dataTransfer?.files || []);
        if (files.length) {
            this.processFiles(files);
        }
    }

    appendMessage(type, content, { isHtml = false, includeAvatar = type !== 'system', showTime = true } = {}) {
        const container = this.elements.messages;
        if (!container) return;

        const shouldStickToBottom = this.isScrolledNearBottom();
        const markup = this.createMessageMarkup(type, content, { isHtml, includeAvatar, showTime });
        container.insertAdjacentHTML('beforeend', markup);

        if (shouldStickToBottom) {
            this.scrollToBottom();
        }
    }

    createMessageMarkup(type, content, { isHtml, includeAvatar, showTime }) {
        const avatarMarkup = includeAvatar ? this.getAvatarMarkup(type) : '';
        const body = isHtml ? content : this.formatText(content);
        const timeMarkup = showTime ? `<div class="message-meta"><span class="message-time"><i class="far fa-clock"></i>${this.getTimestamp()}</span></div>` : '';
        const bubble = `<div class="message-bubble">${body}${timeMarkup}</div>`;

        const inner = type === 'user' ? `${bubble}${avatarMarkup}` : `${avatarMarkup}${bubble}`;
        return `<div class="chat-message ${type}">${inner}</div>`;
    }

    getAvatarMarkup(type) {
        if (type === 'user') {
            return '<span class="chat-avatar"><i class="fas fa-user"></i></span>';
        }

        return '<span class="chat-avatar"><i class="fas fa-robot"></i></span>';
    }

    addThinkingIndicator() {
        const id = `thinking-${Date.now()}`;
        const container = this.elements.messages;
        const shouldStickToBottom = this.isScrolledNearBottom();
        const markup = `<div class="chat-message ai message-thinking" id="${id}">${this.getAvatarMarkup('ai')}<div class="message-bubble"><div class="typing-indicator"><span></span><span></span><span></span></div></div></div>`;
        container?.insertAdjacentHTML('beforeend', markup);
        if (shouldStickToBottom) {
            this.scrollToBottom();
        }
        return id;
    }

    removeThinkingIndicator(id) {
        const node = document.getElementById(id);
        if (node) node.remove();
    }

    async requestChatCompletion(messages, { temperature, maxTokens, overrideModel } = {}) {
        if (!Array.isArray(messages) || !messages.length) {
            throw new Error('No messages supplied to requestChatCompletion.');
        }

        const modelsToTry = [overrideModel, this.apiConfig.model, ...(this.apiConfig.fallbackModels || [])]
            .filter(Boolean)
            .filter((model, index, array) => array.indexOf(model) === index);

        const attemptLog = [];
        let lastError;

        for (const model of modelsToTry) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.apiConfig.requestTimeoutMs);

            try {
                const response = await fetch(this.apiConfig.url, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${this.apiConfig.key}`,
                        'Content-Type': 'application/json',
                        'X-Title': 'DLLC-AI-Legal-Assistant'
                    },
                    body: JSON.stringify({
                        model,
                        messages,
                        temperature: typeof temperature === 'number' ? temperature : this.apiConfig.temperature,
                        max_tokens: typeof maxTokens === 'number' ? maxTokens : this.apiConfig.maxTokens
                    }),
                    signal: controller.signal
                });

                if (!response.ok) {
                    const errorBody = await response.json().catch(() => null);
                    const message = errorBody?.error?.message || `API error (${response.status})`;
                    throw new Error(message);
                }

                const data = await response.json();
                const content = data.choices?.[0]?.message?.content;
                if (!content) {
                    throw new Error('Provider returned an empty response.');
                }

                if (attemptLog.length) {
                    console.info('AI Assistant: succeeded using fallback model', model);
                }

                return content;
            } catch (error) {
                if (error?.name === 'AbortError') {
                    lastError = new Error(`Request timed out after ${this.apiConfig.requestTimeoutMs}ms.`);
                } else {
                    lastError = error instanceof Error ? error : new Error(String(error));
                }
                attemptLog.push({ model, message: lastError.message });
            } finally {
                clearTimeout(timeoutId);
            }
        }

        const detail = attemptLog.map((attempt) => `${attempt.model}: ${attempt.message}`).join(' | ');
        throw new Error(detail || lastError?.message || 'Provider unavailable.');
    }

    buildDocumentContext() {
        const analysedDocs = this.documents.filter((doc) => (doc.status === 'ready' || doc.status === 'fallback') && doc.analysis);
        if (!analysedDocs.length) {
            return '';
        }

        const clip = analysedDocs.slice(-3); // Keep context focused
        return clip
            .map((doc) => {
                const injuries = doc.analysis.injuries.slice(0, 4).join(', ');
                const actions = doc.analysis.suggestedActions.slice(0, 3).join('; ');
                const fallbackNotice = doc.analysisSource === 'fallback'
                    ? '\nNote: This summary was generated offline because the AI provider was unavailable. Cross-check facts against the original document.'
                    : '';
                const rawExcerpt = this.truncateText(doc.content || '', 1800);
                return `Document: ${doc.name}\nSummary: ${doc.analysis.summary || doc.analysis.circumstances}\nInjuries: ${injuries || 'Not specified'}\nKey actions: ${actions || 'Not specified'}${fallbackNotice}\nOriginal excerpt:\n${rawExcerpt}`;
            })
            .join('\n\n---\n\n');
    }

    trimHistory() {
        const limit = UI_CONSTANTS?.MAX_CHAT_HISTORY || 20;
        if (this.chatHistory.length > limit) {
            this.chatHistory = this.chatHistory.slice(-limit);
        }
    }

    handleInputResize() {
        const textarea = this.elements.input;
        if (!textarea) return;
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
    }

    setBusy(isBusy) {
        this.state.busy = isBusy;
        if (this.elements.sendButton) {
            this.elements.sendButton.disabled = isBusy;
            this.elements.sendButton.setAttribute('aria-busy', String(isBusy));
        }
    }

    clearFileInput() {
        if (this.elements.fileInput) {
            this.elements.fileInput.value = '';
        }
    }

    escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    formatText(text) {
        const normalized = String(text || '').replace(/\r\n?/g, '\n');
        const escaped = this.escapeHtml(normalized);
        const bold = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        const italic = bold.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

        const lines = italic.split(/\n/);
        let html = '';
        let inList = false;
        let inOrderedList = false;

        const closeLists = () => {
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            if (inOrderedList) {
                html += '</ol>';
                inOrderedList = false;
            }
        };

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) {
                closeLists();
                continue;
            }

            const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
            if (headingMatch) {
                closeLists();
                const level = Math.min(4, headingMatch[1].length);
                html += `<h${level}>${headingMatch[2]}</h${level}>`;
                continue;
            }

            if (/^\d+\.\s+/.test(trimmed)) {
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
                if (!inOrderedList) {
                    html += '<ol>';
                    inOrderedList = true;
                }
                html += `<li>${trimmed.replace(/^\d+\.\s+/, '')}</li>`;
                continue;
            }

            if (/^[-•]/.test(trimmed)) {
                if (inOrderedList) {
                    html += '</ol>';
                    inOrderedList = false;
                }
                if (!inList) {
                    html += '<ul>';
                    inList = true;
                }
                html += `<li>${trimmed.replace(/^[-•]\s*/, '')}</li>`;
            } else {
                closeLists();
                html += `<p>${trimmed}</p>`;
            }
        }

        closeLists();

        return html || '<p>No response content.</p>';
    }

    getTimestamp() {
        return new Intl.DateTimeFormat('en-SG', {
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date());
    }

    scrollToBottom() {
        const container = this.elements.messages;
        if (!container) return;
        requestAnimationFrame(() => {
            container.scrollTop = container.scrollHeight;
        });
    }

    isScrolledNearBottom(threshold = 120) {
        const container = this.elements.messages;
        if (!container) return true;
        const distanceFromBottom = container.scrollHeight - container.clientHeight - container.scrollTop;
        return distanceFromBottom <= threshold;
    }

    formatFileSize(bytes) {
        if (typeof bytes !== 'number' || Number.isNaN(bytes)) return 'Unknown size';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    formatDocumentStatus(status) {
        switch (status) {
            case 'processing':
                return 'Analysing…';
            case 'ready':
                return 'Analysis ready';
            case 'fallback':
                return 'Fallback summary';
            case 'error':
                return 'Analysis failed';
            default:
                return status;
        }
    }

    toArray(value) {
        if (Array.isArray(value)) return value.filter(Boolean);
        if (typeof value === 'string' && value.trim()) return [value.trim()];
        return [];
    }

    toNumber(value) {
        const num = Number(value);
        return Number.isFinite(num) ? num : null;
    }

    truncateText(text, length) {
        const value = typeof text === 'string' ? text : String(text ?? '');
        if (value.length <= length) return value;
        return `${value.slice(0, length)}…`;
    }

    getFileExtension(name) {
        const match = name.toLowerCase().match(/\.\w+$/);
        return match ? match[0] : '';
    }

    getMimeType(name) {
        const extension = this.getFileExtension(name);
        const lookup = {
            '.pdf': 'application/pdf',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.txt': 'text/plain',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png'
        };
        return lookup[extension] || 'application/octet-stream';
    }

    getExtensionFromMimeType(mimeType) {
        const normalized = String(mimeType || '').toLowerCase();
        const lookup = {
            'application/pdf': '.pdf',
            'application/msword': '.doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
            'text/plain': '.txt',
            'image/jpeg': '.jpg',
            'image/png': '.png'
        };

        return lookup[normalized] || '';
    }

    async withTimeout(promise, timeoutMs, timeoutMessage) {
        const timeout = Number(timeoutMs);
        if (!Number.isFinite(timeout) || timeout <= 0) {
            return await promise;
        }

        let timeoutHandle;
        const timeoutPromise = new Promise((_, reject) => {
            timeoutHandle = setTimeout(() => {
                reject(new Error(timeoutMessage || `Operation timed out after ${timeout}ms.`));
            }, timeout);
        });

        try {
            return await Promise.race([promise, timeoutPromise]);
        } finally {
            clearTimeout(timeoutHandle);
        }
    }
}

let aiAssistant;
document.addEventListener('DOMContentLoaded', () => {
    aiAssistant = new AIAssistant();
});
