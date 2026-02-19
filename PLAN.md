
# PharmaGuard Implementation Plan (RIFT 2026 PS1)

## 1. High-Level Architecture
- **Frontend (React)**: Handles file upload, state management, and results visualization.
- **Backend (Proposed Python/FastAPI)**: Handles heavy VCF parsing using `cyvcf2` and complex star-allele mapping.
- **Rules Engine**: A mapping system that correlates genotypes -> phenotypes -> drug risk labels based on CPIC guidelines.
- **LLM Service**: Gemini-powered generator for high-quality clinical explanations based on structured results.

## 2. Implementation Steps

### Phase 1: Skeleton (T = 0-3h)
- Set up React project structure.
- Define TypeScript interfaces for the PS1 JSON schema.
- Implement `VCFUpload` and `DrugSelector` components.
- Stub out `POST /analyze` to return mock JSON.

### Phase 2: Genomics Engine (T = 3-10h)
- Implement `vcfParser.ts` (later to be `vcf_parser.py` in your backend).
- Create phenotype lookup tables for the 6 genes: CYP2D6, CYP2C19, CYP2C9, SLCO1B1, TPMT, DPYD.
- Map phenotypes to the 6 drugs: Codeine, Clopidogrel, Warfarin, Simvastatin, Tacrolimus, Fluorouracil.

### Phase 3: AI Integration (T = 10-16h)
- Configure Gemini API using `@google/genai`.
- Craft medical-grade system prompts to avoid hallucinations.
- Generate per-drug explanations focusing on mechanism and caveats.

### Phase 4: UX & Polish (T = 16-24h)
- Add Tailwind styling for "Severity" badges (Critical/High/Low).
- Implement "Quality Metrics" visualization.
- Final testing with sample VCF files.
- Deploy to Vercel/Render.

## 3. Common Pitfalls
- **Mismatched IDs**: Ensure rsIDs in VCF match the phenotype translation tables.
- **VCF Versioning**: Strict adherence to v4.2 format.
- **API Limits**: Use streaming or cached results for multiple drugs to manage Gemini rate limits.
