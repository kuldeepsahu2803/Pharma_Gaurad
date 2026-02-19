# Implementation Plan: PharmaGuard AI (RIFT 2026 PS1)

## 1. OVERVIEW
- **Project:** PharmaGuard AI — RIFT 2026 PS1
- **Track:** Pharmacogenomics / Explainable AI
- **Submission Window:** 19 Feb 2026, 6:00 PM – 8:00 PM
- **Build Philosophy:** **Schema Compliance First.** The primary goal is to ensure the JSON output perfectly matches the 17-field PS1 specification. Aesthetics and UX polish are secondary to data integrity and clinical rule accuracy.

---

## 2. DISQUALIFICATION CHECKLIST
The following must be verified before 6:00 PM on submission day:

- [ ] **Live Deployed URL:** App is accessible via public Vercel/Render URLs.
- [ ] **LinkedIn Video:** 2–5 min demo posted, public, tagging RIFT and using correct hashtags.
- [ ] **GitHub Repository:** Public, contains all source code and documentation.
- [ ] **README.md:** Contains all 9 required sections including the Live Demo and Video links.
- [ ] **VCF Support:** App successfully parses valid VCF v4.2 files.
- [ ] **JSON Schema:** Output contains all 17 required fields (patient_id, risk_assessment, etc.).
- [ ] **Deterministic Rules:** Risk labels are based on CPIC guidelines, not LLM hallucinations.
- [ ] **Sample VCFs:** App produces expected results for all 3 required test scenarios.
- [ ] **On-Time Submission:** Form submitted before 8:00 PM on Feb 19.

---

## 3. PHASE 1: CORE PIPELINE (T=0–6h)
**Goal:** Establish the stateless data processing chain.

1.  **VCF Parser Implementation (`vcfParser.ts`):** 
    - *Task:* Ensure multi-tag fallback (GENE/ANN/CSQ) works for all 6 target pharmacogenes.
    - *Success:* `parseVCF` returns a `VariantRecord[]` with correct gene mapping from sample files.
2.  **Phenotype Engine (`phenotypeEngine.ts`):** 
    - *Task:* Implement rsID-to-star-allele mapping for high-impact variants (e.g., CYP2D6 *3, *4).
    - *Success:* Correct diplotypes generated for `toxic_codeine_profile.vcf`.
3.  **Rule Engine (`ruleEngine.ts`):** 
    - *Task:* Standardize CPIC-style lookups in `constants.ts`.
    - *Success:* `applyRules` returns "Toxic" for Codeine + PM phenotype.
4.  **Basic API Interface:** 
    - *Task:* Connect Express backend to the pipeline.
    - *Success:* `curl` request to `POST /analyze` returns a raw JSON array matching the PS1 schema.

---

## 4. PHASE 2: INTEGRATION & MIDNIGHT CHECKPOINT (T=6–12h)
**Goal:** Achieve "Draft Submission" state.

1.  **Gemini Integration (`geminiService.ts`):** 
    - *Task:* Implement batched calls to Gemini 3 Flash for clinical reasoning.
    - *Success:* Responses include formatted `summary` and `mechanism` fields.
2.  **Frontend Plumbing (`App.tsx`):** 
    - *Task:* Connect `VCFUpload` and `DrugSelector` to the backend analysis call.
    - *Success:* Results from the backend render as raw state in the console.
3.  **Initial Deployment:** 
    - *Task:* Deploy Backend to Render (Stateless) and Frontend to Vercel.
    - *Success:* GET /health returns 200 on the live server.

**MIDNIGHT MUST-HAVES:**
- [ ] `POST /analyze` returns 17/17 JSON fields.
- [ ] App accepts 5MB VCF upload.
- [ ] All 6 drugs (CODEINE to FLUOROURACIL) are selectable.

---

## 5. PHASE 3: CLINICAL UX POLISH (T=12–20h)
**Goal:** Elevate to "High-Fidelity" status.

1.  **Result Dashboard (`ResultDashboard.tsx`):** 
    - *Task:* Implement color-coded risk cards (Safe=Green, Adjust=Yellow, Toxic=Red).
    - *Success:* Immediate visual differentiation of risk levels.
2.  **Dual Mode (Clinician/Patient):** 
    - *Task:* Toggle that simplifies LLM summaries and hides technical rsID tables.
3.  **Decision Intelligence Flow:** 
    - *Task:* Build the `MetabolicTimeline` component to show the trace from VCF -> Phenotype -> Risk.
4.  **Quality Metrics HUD:** 
    - *Task:* Visualize `variant_quality_score` and `assumed_wildtype_genes` list.

---

## 6. PHASE 4: FINAL QA & SUBMISSION (T=20–24h)
**Goal:** Final verification and documentation.

1.  **End-to-End Test Suite:**
    - Run `normal_metabolizer.vcf` (Expected: 6 Safe results).
    - Run `toxic_codeine_profile.vcf` (Expected: Codeine=Toxic, SLCO1B1=NM).
    - Run `warfarin_risk_profile.vcf` (Expected: Warfarin=Adjust Dosage).
2.  **Documentation Finalization:**
    - Complete `README.md` with PS1 sections.
    - Generate `samples/` VCF files for judge testing.
3.  **Submission Workflow:**
    - **Step 1:** Push final code to GitHub.
    - **Step 2:** Record 3-minute demo video (screen share + voiceover).
    - **Step 3:** Post to LinkedIn with hashtags: `#RIFT2026 #Pharmacogenomics #AI`.
    - **Step 4:** Submit final URLs via RIFT form.

---

## 7. RISK MITIGATION

| Priority | Feature | Mitigation if Time-Short |
| :--- | :--- | :--- |
| **P0 (Critical)** | JSON Schema Compliance | **NEVER DROP.** This is the core requirement. |
| **P0 (Critical)** | All 6 Drugs/Genes | **NEVER DROP.** PS1 requires breadth. |
| **P1 (High)** | Gemini Explanations | Drop if API is down; use `buildFallbackExplanation`. |
| **P1 (High)** | UI Results View | Use a simpler list if `ResultDashboard` is too complex. |
| **P2 (Med)** | Clinician/Patient Mode | Drop first. Keep single professional mode. |
| **P2 (Med)** | What-if Switcher | Drop second. Require re-upload for changes. |

---

## 8. TEST CASES & EXPECTED OUTPUTS

| Scenario | File | Expected Risk | Key Markers |
| :--- | :--- | :--- | :--- |
| **Healthy Baseline** | `normal_metabolizer.vcf` | **Safe** (All) | Phenotype: NM; Diplotype: *1/*1 |
| **Opioid Danger** | `toxic_codeine_profile.vcf` | **Toxic** (Codeine) | CYP2D6 PM; rs3892097 detected |
| **Warfarin Precision**| `warfarin_risk_profile.vcf` | **Adjust** (Warfarin) | CYP2C9 IM; rs1799853 detected |
| **Chemo Safety** | `toxic_codeine_profile.vcf` | **Toxic** (Fluorouracil)| DPYD PM; rs3918290 detected |

---

## 9. SUCCESS CRITERIA
PharmaGuard AI is ready for submission when:
- [ ] All 3 sample VCFs produce correct deterministic risk labels.
- [ ] Every drug in the results array contains all 17 required JSON fields.
- [ ] The app looks like a professional clinical tool (Clinical Precision theme).
- [ ] The README provides a clear, verifiable path for a judge to test the app.