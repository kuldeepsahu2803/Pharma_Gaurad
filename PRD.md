# Product Requirements Document (PRD): PharmaGuard AI

**Project Name:** PharmaGuard AI  
**Track:** RIFT 2026 — Pharmacogenomics / Explainable AI (PS1)  
**Version:** 1.0  
**Date:** February 2026  
**Status:** High-Fidelity Implementation

---

## 1. PRODUCT OVERVIEW
PharmaGuard AI is an AI-powered genomic risk prediction system that transforms raw VCF files into actionable clinical decision support by mapping patient genotypes to pharmacogenomic dosing guidelines.

---

## 2. PROBLEM STATEMENT
Adverse drug reactions (ADRs) are a leading cause of morbidity and mortality, killing over 100,000 Americans annually. A significant portion of these reactions are preventable through pharmacogenomic (PGx) screening. However, raw genomic data (VCF files) is technically dense and virtually unreadable by frontline clinicians. PharmaGuard AI bridges this "interpretation gap" by converting v4.2 VCF files into clear, authoritative risk labels and explainable AI reasoning.

---

## 3. GOALS & OBJECTIVES
1.  **JSON Schema Compliance:** Achieve 100% field match with the PS1 specification (17/17 required fields).
2.  **Breadth of Coverage:** Provide high-confidence risk prediction for 6 critical pharmacogenes across 6 high-impact drugs.
3.  **Performance:** Ensure the end-to-end analysis (parsing + rule mapping + LLM generation) completes in under 3 seconds.
4.  **Parsing Robustness:** Maintain a 100% success rate for valid VCF v4.2 files containing standard INFO tags.

---

## 4. SUCCESS METRICS
- **vcf_parsing_success rate:** 100% for valid v4.2 files with appropriate gene mapping.
- **JSON Compliance:** 17/17 required schema fields present in every export.
- **Risk Label Accuracy:** 100% alignment with CPIC guidelines for provided test scenarios.
- **LLM Grounding:** Zero hallucinations of gene names or rsIDs; 100% citations of metabolic mechanisms.

---

## 5. TARGET PERSONAS

### Primary: Dr. Priya (Clinical Researcher)
- **Role:** Evaluates drug safety before prescribing high-risk medications.
- **Needs:** Clear risk labels (Toxic vs. Safe) and clinical reasoning that justifies dose changes.
- **Technical Proficiency:** Moderate.

### Secondary: Alex (Bioinformatics Hackathon Judge)
- **Role:** Validates app logic with sample VCF edge cases.
- **Needs:** Verifiable JSON output and transparent mapping from rsID to Phenotype.
- **Technical Proficiency:** Expert.

---

## 6. FEATURES & REQUIREMENTS

### P0 — Must Have (Core PS1 Requirements)
1.  **VCF File Upload:**
    - Accepts `.vcf` v4.2 files up to 5MB.
    - Drag-and-drop or file picker UI.
    - Validates `##fileformat=VCFv4.2` header and INFO tags (`GENE=`, `RS=`, `STAR=`).
2.  **Drug Selection Input:**
    - Searchable multi-select grid supporting: `CODEINE`, `WARFARIN`, `CLOPIDOGREL`, `SIMVASTATIN`, `AZATHIOPRINE`, `FLUOROURACIL`.
3.  **Pharmacogenomic Analysis Engine:**
    - Maps 6 genes: `CYP2D6`, `CYP2C19`, `CYP2C9`, `SLCO1B1`, `TPMT`, `DPYD`.
    - Computes phenotype: PM, IM, NM, RM, URM, or Unknown.
4.  **PS1 JSON Schema Output:**
    - Includes `patient_id`, `drug`, `timestamp`, `risk_assessment`, `pharmacogenomic_profile`, `clinical_recommendation`, `llm_generated_explanation`, and `quality_metrics`.
5.  **Risk Results Dashboard:**
    - High-fidelity Master-Detail layout.
    - Color-coded border accents: Green (Safe), Yellow (Adjust), Red (Toxic/Ineffective).
    - JSON download and clipboard functionality.
6.  **Gemini AI Reasoning:**
    - Grounded prompts citing gene, phenotype, and rsIDs.
    - Mechanism-based clinical caveats.
7.  **Error Handling:**
    - Invalid VCF banners, file size rejection, and unsupported drug warnings.

### P1 — Should Have
1.  **Dual Mode (Clinician / Patient):** Toggle that simplifies medical terminology for patient viewing.
2.  **What-If Drug Switcher:** Instant re-analysis from cached genotypes when switching target drugs.
3.  **Quality Metrics Panel:** Visualization of `variant_quality_score` and `gene_coverage`.
4.  **Multi-Drug Summary Table:** Matrix view of risk across all selected medications.

### P2 — Nice to Have
1.  **Phenotype-Centric View:** "How does this genotype affect my entire medication profile?"
2.  **Rule Transparency Viewer:** Inspect the exact CPIC-style rule applied to a result.
3.  **Audit Trail:** Visual trace from raw VCF line -> rsID -> Phenotype -> Risk.

---

## 7. EXPLICITLY OUT OF SCOPE
- User authentication/login.
- Multi-patient batch processing.
- Real-time CPIC API calls (embedded rule tables only).
- VCF files > 5MB.
- Support for drugs or genes outside the specified 6x6 matrix.
- Mobile native apps.
- PDF export.

---

## 8. USER SCENARIOS

### Scenario 1: Normal Metabolizer Baseline
- **Entry:** User uploads `normal_metabolizer.vcf`.
- **Steps:** Selects all 6 drugs and clicks "Initialize Analysis".
- **Expected:** All 6 results return `RiskLabel.SAFE` with `NM` phenotypes.

### Scenario 2: Toxic Codeine Risk
- **Entry:** User uploads `toxic_codeine_profile.vcf`.
- **Steps:** Selects `CODEINE` and `FLUOROURACIL`.
- **Expected:** `CODEINE` returns `RiskLabel.INEFFECTIVE` or `TOXIC` based on `CYP2D6` status; `DPYD` variations trigger `RiskLabel.TOXIC` for `FLUOROURACIL`.

### Scenario 3: Warfarin Dose Adjustment
- **Entry:** User uploads `warfarin_risk_profile.vcf`.
- **Steps:** Selects `WARFARIN`.
- **Expected:** `RiskLabel.ADJUST` (High Severity) with `CYP2C9 *2/*3` diplotype explanation.

---

## 9. CONSTRAINTS & DEPENDENCIES
- **Data Format:** VCF must follow v4.2 standards.
- **API:** Requires valid `GEMINI_API_KEY`.
- **Environment:** Must support browser-based VCF parsing (Local-First).
- **Compliance:** Must meet PS1 submission deadline (Feb 19, 2026).

---

## 10. NON-FUNCTIONAL REQUIREMENTS
- **Performance:** End-to-end analysis < 5 seconds for 5MB file.
- **Reliability:** Graceful fallback to static rule-based explanations if Gemini is unreachable.
- **Accessibility:** WCAG 2.1 AA compliant contrast and shape-based status indicators.
- **Security:** No PHI persistence; process genomic data in-memory only.

---

## 11. USER STORIES
- **As a clinician,** I want to see a clear risk badge so I don't accidentally prescribe a toxic dose.
- **As a researcher,** I want to see the specific rsIDs detected so I can verify the AI's logic against raw sequence data.
- **As a patient,** I want an explanation I can understand so I feel confident in my treatment plan.

---

## 12. ACCEPTANCE CRITERIA
- [ ] VCF parsing handles `ANN`, `CSQ`, and `GENE=` tags.
- [ ] Risk labels update instantly when switching between drugs in the sidebar.
- [ ] JSON export contains all 17 fields defined in `types.ts`.
- [ ] "Clinical Precision" theme is enforced (no light mode, font-black only for drug names).

---

## 13. DATA RETENTION
PharmaGuard AI operates on a **Zero-Retention** policy. Genomic data is parsed in the client's memory. LLM calls transmit only anonymous phenotypes and drug names. No VCF data is stored in any database.