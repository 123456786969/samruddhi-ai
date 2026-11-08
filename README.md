# Samruddhi AI (ಸಮೃದ್ಧಿ AI)

> Ultra-low-latency, autonomous Indic voice automation platform engineered for real-time lead qualification, multilingual triage, and post-call business workflows.

---

## Overview

**Samruddhi AI** is designed to eliminate high caller drop-offs and after-hours communication gaps for businesses across India. By optimizing speech synthesis pipelines, streaming models, and webhook dispatches, Samruddhi AI achieves **sub-800ms end-to-end voice latency** in regional Indic languages while maintaining natural phonetics and conversational pacing.

### Supported Languages
* **Kannada (ಕನ್ನಡ)** (`kn-IN`)
* **Hindi (हिन्दी)** (`hi-IN`)
* **Tamil (தமிழ்)** (`ta-IN`)
* **Telugu (తెలుగు)** (`te-IN`)
* **Indian English** (`en-IN`)

---

## Architecture & Tech Stack

```text
[Inbound / Outbound Call]
         │
         ▼
 ┌───────────────┐      WebSocket (16kHz PCM)      ┌─────────────────────────┐
 │ Telephony /   │ ◄─────────────────────────────► │   FastAPI Backend Core  │
 │ Bolna Agent   │                                 └────────────┬────────────┘
 └───────┬───────┘                                              │
         │                                                      │
         ├─► Deepgram Nova-2 (Real-time Indic ASR)              ├─► Groq (Llama 3.1 Streaming Inference)
         └─► Sarvam AI (bulbul:v1 Streaming TTS)                ├─► Dynamic Tool Execution (CRM / DB Lookup)
                                                                └─► Meta WhatsApp Cloud API (Automated Follow-up)
```

### Key Engineering Highlights
* **Sub-800ms Voice Pipeline**: Full duplex WebSocket integration with chunked streaming audio serialization to prevent buffer lag.
* **Anti-Screech & Feedback Elimination**: Strict discrete state handling prevents audio underrun loops and acoustic feedback during continuous phone sessions.
* **Deterministic TTS Guardrails**: Zero-leak regex and parsing layer strips URLs, Markdown formatting, and punctuation artifacts before text hits the TTS engine.
* **Instant Omnichannel Hand-off**: Webhook integration dispatches structured call summaries and booking details to WhatsApp within milliseconds of call termination.

---

## Next Steps for This Repo

### 1. Link Your Git Remote Locally
If you have created or cloned the repository locally on your machine, connect it to the remote repository:

```bash
git remote add origin https://github.com/123456786969/samruddhi-ai.git
git branch -M main
git push -u origin main
```

### 2. Exclude Secrets with `.gitignore`
Ensure your `.env` containing API credentials (`GROQ_API_KEY`, `SARVAM_API_KEY`, `BOLNA_API_KEY`, `WHATSAPP_ACCESS_TOKEN`, `GEMINI_API_KEY`) is never committed publicly. 

The repository `.gitignore` includes:
```plaintext
.env
.env.*
!.env.example
__pycache__/
*.pyc
venv/
.venv/
.DS_Store
node_modules/
dist/
```
