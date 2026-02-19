# PharmaGuard AI 🧬

PharmaGuard AI is an AI-powered pharmacogenomic risk prediction system designed to bridge the gap between complex genomic data and actionable clinical decision support.

## 🔴 Live Demo
> **[INSERT YOUR DEPLOYED URL HERE]**

## 🎥 LinkedIn Demo Video
> **[INSERT YOUR LINKEDIN VIDEO URL HERE]**

## ⚠️ Problem Statement
Clinicians often struggle to interpret raw genomic data (VCF files) in real-time. Misinterpreting a patient's metabolic phenotype can lead to life-threatening adverse drug reactions (ADRs) or therapeutic failure. PharmaGuard AI automates the parsing of VCF files against CPIC (Clinical Pharmacogenetics Implementation Consortium) guidelines, providing high-confidence risk labels and Gemini-powered clinical explanations.

## 🏗 Architecture Overview
```
VCF Upload → vcfParser.ts → phenotypeEngine.ts →
ruleEngine.ts + constants.ts → geminiService.ts →
PharmaGuardResult[] JSON → React Frontend
```
- **vcfParser.ts**: Extracts variants using multiple fallback strategies (GENE=, ANN=, CSQ= tags).
- **phenotypeEngine.ts**: Maps rsIDs to star alleles and computes compound heterozygote diplotypes.
- **ruleEngine.ts**: Cross-references phenotypes with CPIC dosing guidelines.
- **geminiService.ts**: Generates human-readable clinical reasoning using Gemini 3 Flash.
- **React Frontend**: Visualizes risks through a high-fidelity clinician/patient dashboard.

## 🛠 Tech Stack
| Component | Technology |
|---|---|
| Frontend | Vite + React + TypeScript + Tailwind CSS |
| Backend | Express + TypeScript + Node.js |
| AI Model | Google Gemini 3 Flash |
| VCF Parsing | Custom TypeScript parser (multi-tag fallback) |
| Deployment | Vercel (frontend) + Render (backend) |

## 🧬 Supported Genes & Drugs
- **Genes**: CYP2D6, CYP2C19, CYP2C9, SLCO1B1, TPMT, DPYD
- **Drugs**: CODEINE, WARFARIN, CLOPIDOGREL, SIMVASTATIN, AZATHIOPRINE, FLUOROURACIL

## 🚀 Installation

### Backend Setup:
```bash
cd backend
npm install
cp .env.example .env
# Add GEMINI_API_KEY to .env
npm run dev
```

### Frontend Setup:
```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:3000 in .env
npm run dev
```

## 📖 API Documentation
### `POST /analyze`
Analyzes a VCF file against a list of target drugs.

**Request:**
- `vcf`: File (.vcf)
- `drugs`: String (comma-separated, e.g., "CODEINE,WARFARIN")

**Example Curl:**
```bash
curl -X POST -F "vcf=@samples/toxic_codeine_profile.vcf" -F "drugs=CODEINE" http://localhost:3000/analyze
```

**Success Response (JSON):**
```json
[
  {
    "patient_id": "PAT_RIFT_X9Z2K4",
    "drug": "CODEINE",
    "timestamp": "2024-05-24T10:00:00.000Z",
    "risk_assessment": {
      "risk_label": "Toxic",
      "confidence_score": 0.94,
      "severity": "high"
    },
    "pharmacogenomic_profile": {
      "primary_gene": "CYP2D6",
      "diplotype": "*4/*3",
      "phenotype": "PM",
      "detected_variants": [
        { "rsid": "rs3892097", "is_causal": true, "rawLine": "chr22 42524945 rs3892097 G A 99 PASS GENE=CYP2D6;STAR=*4" },
        { "rsid": "rs35742686", "is_causal": true, "rawLine": "chr22 42523943 rs35742686 C T 95 PASS GENE=CYP2D6;STAR=*3" }
      ]
    },
    "clinical_recommendation": {
      "summary": "Avoid codeine due to lack of efficacy. Use alternative analgesics."
    },
    "llm_generated_explanation": {
      "summary": "The patient carries two non-functional alleles for CYP2D6, resulting in a Poor Metabolizer phenotype. This prevents the conversion of Codeine to its active form, Morphine.",
      "clinical_caveats": "Monitor for lack of pain relief. Do not increase dose as it increases risk of non-opioid side effects without therapeutic benefit."
    },
    "quality_metrics": {
      "vcf_parsing_success": true,
      "assumed_wildtype_genes": [],
      "variant_quality_score": 0.94
    }
  }
]
```

**Error Response:**
```json
{
  "vcf_parsing_success": false,
  "errors": ["Invalid VCF format. System strictly requires VCF v4.2 headers."]
}
```

## 💡 Usage Examples
- **Scenario 1**: `normal_metabolizer.vcf` → All genes wild-type (*1/*1). Result: **Safe** for all 6 drugs.
- **Scenario 2**: `toxic_codeine_profile.vcf` → CYP2D6 PM detected. Result: **Toxic** for CODEINE.
- **Scenario 3**: `warfarin_risk_profile.vcf` → CYP2C9 *2/*3 detected. Result: **Adjust Dosage** (High Severity) for WARFARIN.

## ✨ Key Features
- **PS1 JSON schema compliant**: Full 17/17 field implementation.
- **Multi-tag VCF fallback parsing**: Supports GENE=, ANN=, and CSQ= info fields.
- **Compound heterozygote detection**: Logic to identify complex *X/*Y diplotypes.
- **CPIC-style rules**: Validated rules for 6 major pharmacogenes.
- **Gemini 3 Flash Reasoning**: Explainable AI with mechanism and caveats.
- **Metabolic Timeline**: Step-by-step visual trace of the clinical decision.
- **What-if Comparison**: Client-side logic to compare genotypes across multiple drugs.
- **Clinician/Patient Mode**: Switches between technical and plain-language summaries.
- **Privacy Shield HUD**: In-browser processing transparency modal.

## 🌐 Deployment

### Backend on Render:
1. New Web Service → Connect GitHub Repository.
2. Root Directory: `backend`.
3. Build Command: `npm install && npm run build`.
4. Start Command: `node dist/server.js`.
5. Environment Variables: Add `GEMINI_API_KEY`.

### Frontend on Vercel:
1. Import Repository → Select `frontend` folder.
2. Environment Variables: `VITE_API_URL=https://your-render-url.com`.
3. Deploy.

## 👥 Team Members
> **[INSERT YOUR NAME AND ROLE HERE]**

## ⚖️ Disclaimer
PharmaGuard AI is a research and decision-support prototype built for RIFT 2026. It is not a certified medical device and should not replace clinical judgment or validated pharmacogenomic testing. All outputs must be reviewed by a qualified clinician.

---
*RIFT 2026 — PS1 PharmaGuard — Pharmacogenomics / Explainable AI Track*