# Backend Structure: PharmaGuard AI

## 1. ARCHITECTURE OVERVIEW
PharmaGuard AI follows a stateless, functional pipeline architecture. Every analysis request is processed in-memory, ensuring maximum data sovereignty and privacy for genomic sequences.

**Data Flow:**
```
POST /analyze (multipart/form-data: vcf file + drugs string)
       ↓
vcfParser.ts → VariantRecord[] (Normalization & Extraction)
       ↓
phenotypeEngine.ts → GeneProfile[] (Diplotype & Phenotype Computation)
       ↓
ruleEngine.ts + constants.ts → RuleResult[] (Clinical Protocol Matching)
       ↓
geminiService.ts → LLM explanations (Batched Contextual Reasoning)
       ↓
JSON assembler → PharmaGuardResult[] (PS1 Schema Compliance)
       ↓
HTTP 200 response
```

---

## 2. TYPE DEFINITIONS (`types.ts`)

### PS1-Required Output Schema
```typescript
interface PharmaGuardResult {
  patient_id: string;          // "PAT_RIFT_" + random uppercase hash
  drug: string;                // Uppercase drug name (e.g., "WARFARIN")
  timestamp: string;           // ISO 8601 string
  risk_assessment: RiskAssessment;
  pharmacogenomic_profile: PharmacogenomicProfile;
  clinical_recommendation: {
    summary: string;           // 1-2 sentence clinical action
  };
  llm_generated_explanation: LLMExplanation;
  quality_metrics: QualityMetrics;
}

interface RiskAssessment {
  risk_label: 'Safe' | 'Adjust Dosage' | 'Toxic' | 'Ineffective' | 'Unknown';
  confidence_score: number;    // 0.0–1.0
  severity: 'none' | 'low' | 'moderate' | 'high' | 'critical';
}

interface PharmacogenomicProfile {
  primary_gene: string;        // e.g., "CYP2D6"
  diplotype: string;           // e.g., "*4/*3" or "*1/*1 (assumed)"
  phenotype: 'PM' | 'IM' | 'NM' | 'RM' | 'URM' | 'Unknown';
  detected_variants: DetectedVariant[];
  assumed_wildtype?: boolean;
}

interface DetectedVariant {
  rsid: string;                // e.g., "rs3892097"
  is_causal?: boolean;         // true if allele affects metabolic phenotype
  rawLine?: string;            // The original VCF row for audit transparency
}

interface LLMExplanation {
  summary: string;              // Full reasoning paragraph
  mechanism?: string;           // Biochemical pathway description
  clinical_caveats: string;     // Disclaimer and monitoring notes
}

interface QualityMetrics {
  vcf_parsing_success: boolean;
  variant_count: number;
  gene_coverage: string[];
  assumed_wildtype_genes: string[];
  variant_quality_score: number; // Avg QUAL / 100, capped at 1.0
  errors: string[];
}
```

---

## 3. VCF PARSER (`vcfParser.ts`)
The custom parser is designed for clinical-grade extraction using a multi-tag fallback strategy.

**Function Signature:**
```typescript
export const parseVCF = (content: string): { 
  variants: VariantRecord[], 
  metrics: QualityMetrics 
}
```

**Parsing Logic:**
1. **Validation:** Checks for `##fileformat=VCFv4.2`. If invalid, `vcf_parsing_success` is set to `false`.
2. **Tag Extraction:**
   - Attempts `GENE=` or `SYMBOL=` in INFO column.
   - Fallback: `ANN=` (field 4) for SnpEff annotations.
   - Fallback: `CSQ=` (field 4) for Ensembl VEP annotations.
3. **Identifier Normalization:**
   - Extracts RSIDs from ID column or `RS=` tag in INFO.
   - If ID is `.`, generates a unique locus ID: `rs_{pos}_{gene}`.
4. **Zygosity:** Parses the `GT` (Genotype) field from the sample column to determine biallelic status.
5. **Quality Scoring:** Normalizes the `QUAL` field (QUAL / 100) to a 0.0–1.0 scale. Defaults to `0.85` if missing.

---

## 4. PHENOTYPE ENGINE (`phenotypeEngine.ts`)
Maps normalized variants to star alleles and computes diplotypes using a compound heterozygote detection algorithm.

**Mapping Table (Summary):**
- **CYP2D6:** rs3892097 (*4, PM), rs35742686 (*3, PM), rs16947 (*2, NM).
- **CYP2C19:** rs4244285 (*2, PM), rs12248560 (*17, RM).
- **CYP2C9:** rs1799853 (*2, IM), rs1057910 (*3, PM).
- **SLCO1B1:** rs4149056 (*5, PM).
- **TPMT:** rs1800462 (*2, IM), rs1800460 (*3B, PM).
- **DPYD:** rs3918290 (*2A, PM), rs55886062 (*13, IM).

**Phenotype Resolution:**
- **Compound Heterozygote:** Detects different "No Function" alleles on the same gene and resolves to **PM**.
- **Assumed Wildtype:** If no variants are detected for a target gene, the engine returns `NM` (Normal Metabolizer) with a `0.85` confidence score and marks as `assumed_wildtype`.

---

## 5. RULE ENGINE (`ruleEngine.ts` + `constants.ts`)

Matches resolved phenotypes to CPIC-style management strategies.

| Drug | Primary Gene | Phenotype | Risk Label | Severity | Dose Action / Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **CODEINE** | CYP2D6 | PM | Ineffective | High | Avoid; use alternative analgesic |
| **CODEINE** | CYP2D6 | URM | Toxic | Critical | Avoid; high risk of respiratory depression |
| **WARFARIN** | CYP2C9 | PM | Adjust Dosage | High | Reduce starting dose 50–75%; monitor INR |
| **CLOPIDOGREL**| CYP2C19 | PM | Ineffective | High | Avoid; use alternative antiplatelet |
| **AZATHIOPRINE**| TPMT | PM | Toxic | Critical | Reduce dose by 90% or avoid |
| **FLUOROURACIL**| DPYD | PM | Toxic | Critical | Avoid; extreme risk of fatal toxicity |

**Confidence Logic:**
- **High (0.98):** Direct star-allele match from high-quality VCF line.
- **Moderate (0.85):** Assumed wild-type due to lack of variant records.
- **Low (<0.70):** Inconsistent variant data or unknown phenotype status.

---

## 6. GEMINI SERVICE (`geminiService.ts`)
Generates high-fidelity clinical reasoning for report summaries.

**Model:** `gemini-3-flash-preview`

**System Instruction:**
> "Act as a senior clinical pharmacogeneticist. Explain genomic findings for a clinical dashboard. Use CPIC standards. Do not hallucinate rsIDs or mechanisms."

**Prompt Template:**
```text
Explain the following findings:
DRUG: {drug}, PHENO: {phenotype}, RISK: {risk_label}, REC: {recommendation}

OUTPUT RULES:
1. Return valid JSON only.
2. Provide keys: "summary", "mechanism", "clinical_caveats".
3. Use clinician-grade terminology for "mechanism".
```

**Mode Switching (In UI):**
- **Clinician Mode:** Displays full `summary` and `mechanism`.
- **Patient Mode:** Simplifies `summary` and hides specific `mechanism` jargon.

---

## 7. API ENDPOINTS

### `POST /analyze`
- **Content-Type:** `multipart/form-data`
- **Fields:** 
  - `vcf`: File (.vcf format, max 5MB)
  - `drugs`: String (comma-separated list)
- **Response:** `200 OK` with `PharmaGuardResult[]` JSON array.

### `GET /health`
- **Response:** `200 OK` with `{ "status": "ok", "timestamp": "..." }`.

---

## 8. ERROR HANDLING
- **VCF Validation:** Rejects files missing the v4.2 header with `400 Bad Request`.
- **Stateless Recovery:** Since no data is stored, errors in the pipeline require a fresh upload, simplifying state management.
- **LLM Resilience:** If Gemini fails (API timeout/JSON error), the system injects a `buildFallbackExplanation` based on the deterministic risk label.

---

## 9. LOGGING
Utilizes `console.debug` and `console.error` for:
- VCF parsing statistics (variant count, detected genes).
- Pipeline transition times (Phase durations).
- API response status codes.
- Gemini API availability flags.