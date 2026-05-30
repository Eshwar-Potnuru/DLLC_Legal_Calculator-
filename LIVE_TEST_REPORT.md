# Live Test Report - AI Assistant

Date: 2026-05-30

Environment: <http://127.0.0.1:5501/index.html>

## Scope

- Real file upload and AI analysis:
- live-accident-report.pdf
- live-medical-summary.docx
- live-insurer-note.png
- OCR validation for image processing
- Legacy .doc rejection validation
- Timeout utility validation

## Runtime Configuration Verified

- Primary model: deepseek/deepseek-chat
- Fallback chain:
- google/gemini-3.1-flash-lite
- ~openai/gpt-mini-latest
- openrouter/auto
- API request timeout: 45000ms
- OCR enabled: true
- OCR language: eng
- OCR timeout: 40000ms

## End-to-End Results

- File processing completed in 24 seconds.
- Final statuses:
- live-accident-report.pdf: ready
- live-medical-summary.docx: ready
- live-insurer-note.png: ready
- All files produced analysis output.

## Content Quality Checks

- PDF analysis:
- Structured fields filled: 8/8
- Injuries detected: 2
- Success probability: 85
- DOCX analysis:
- Structured fields filled: 8/8
- Injuries detected: 2
- Success probability: 85
- PNG analysis:
- Structured fields filled: 7/8
- OCR detected: true
- OCR text included insurer offer and right-of-way signals

## Chat Context Check

- A follow-up prompt using all uploaded files returned a new AI message.
- Response referenced all three files and correctly summarized:
- injury list
- insurer offer amount (SGD 18,000)
- liability indicators

## Negative and Resilience Checks

- Legacy .doc upload was rejected in live UI flow.
- User-facing toast confirmed conversion guidance to .docx.
- Timeout utility returned expected timeout error string for a forced timeout case.

## Verdict

PASS: Professional-grade AI document analysis flow is working end-to-end for PDF, DOCX, and image OCR with robust rejection and timeout behavior.

## Final Full QA Sweep

Date: 2026-05-30

- Error sweep passed for core app files:
  - index.html
  - js/main.js
  - js/calculator.js
  - js/legal-fee-calculator.js
  - js/ui-manager.js
  - js/ai-assistant.js
  - styles/main.css
  - styles/components.css
  - styles/responsive.css
- Desktop interaction smoke tests passed:
  - Calculator selector modal open/close
  - Coverage calculator modal open/close
  - Fee calculator modal open/close
  - AI chat modal open/close
  - No horizontal overflow
- Mobile responsive smoke tests passed:
  - Mobile nav toggle updates ARIA and open state correctly
  - AI chat modal opens/closes correctly
  - No horizontal overflow with or without chat modal open
- Runtime errors during smoke tests: none (no page errors, no console errors)
- AI upload verification rerun passed:
  - Uploaded PDF + DOCX
  - Both analyses completed with provider source and ready status

Final status: COMPLETE and stable for production-style usage in this static deployment setup.
