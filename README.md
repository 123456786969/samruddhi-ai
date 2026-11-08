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
