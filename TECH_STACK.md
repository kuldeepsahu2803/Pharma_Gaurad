# Technology Stack: PharmaGuard AI

## 1. STACK OVERVIEW
- **Architecture:** Monolithic REST API + Static Single Page Application (SPA).
- **Pattern:** Stateless Backend. The system processes VCF files in memory, returns the analysis, and discards all genomic data. No database persistence is used to ensure maximum patient privacy.
- **Justification:** Optimized for RIFT PS1 constraints, prioritizing high-performance Python-based VCF parsing and Gemini reasoning.

---

## 2. FRONTEND STACK

| Library | Version | documentation | Reason for Choice |
| :--- | :--- | :--- | :--- |
| **Vite** | ^6.0.0 | [vitejs.dev](https://vitejs.dev/) | Ultra-fast HMR and build times. |
| **React** | ^19.0.0 | [react.dev](https://react.dev/) | Robust ecosystem. |
| **TypeScript** | ^5.5.0 | [typescriptlang.org](https://www.typescriptlang.org/) | Type safety for genomic structures. |
| **Tailwind CSS** | ^3.4.0 | [tailwindcss.com](https://tailwindcss.com/) | Clinical Precision theme styling. |
| **Framer Motion** | ^11.0.0 | [framer.com/motion](https://www.framer.com/motion/) | Smooth clinical UI transitions. |

---

## 3. BACKEND STACK (FastAPI)

| Library | Version | Documentation | Reason for Choice |
| :--- | :--- | :--- | : :--- |
| **Python** | 3.11 | [python.org](https://python.org/) | Standard for bioinformatics. |
| **FastAPI** | ^0.111.0 | [fastapi.tiangolo.com](https://fastapi.tiangolo.com/) | High-performance, async-first Python web framework. |
| **cyvcf2** | ^0.30.0 | [github.com/brentp/cyvcf2](https://github.com/brentp/cyvcf2) | Blazing fast C-based VCF parsing. |
| **google-generativeai** | ^0.7.0 | [ai.google.dev](https://ai.google.dev/) | Direct Gemini integration. |

---

## 4. AI INTEGRATION (GEMINI)
- **Model:** `gemini-3-flash-preview`
- **Primary Use Case:** Generation of `llm_generated_explanation`.
- **Hallucination Prevention:** Risk labels are deterministic (Rule Engine); LLM provides context and explanation based strictly on those results.

---

## 5. DEVOPS & INFRASTRUCTURE
- **Frontend Hosting:** **Vercel** (Root: `/`, Build: `npm run build`, Output: `dist`).
- **Backend Hosting:** **Render** (Root: `backend`, Build: `pip install -r requirements.txt`, Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`).
