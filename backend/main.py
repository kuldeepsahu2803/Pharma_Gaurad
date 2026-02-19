import os
from typing import List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from pydantic import BaseModel

app = FastAPI(title="PharmaGuard API", version="1.0.0")

# Enable CORS for Vercel frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust to specific Vercel URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalysisRequest(BaseModel):
    drugs: List[str]

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "PharmaGuard-Backend"}

@app.post("/analyze")
async def analyze_vcf(
    vcf: UploadFile = File(...),
    drugs: str = Form(...)
):
    """
    Analyzes a VCF file for pharmacogenomic variants.
    Expects a .vcf file and a comma-separated string of drugs.
    """
    if not vcf.filename.endswith('.vcf'):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a .vcf file.")

    drug_list = [d.strip().upper() for d in drugs.split(',')]
    
    # Save file temporarily for cyvcf2 processing
    temp_path = f"temp_{vcf.filename}"
    with open(temp_path, "wb") as buffer:
        buffer.write(await vcf.read())

    try:
        # In a real implementation, you would use cyvcf2 here:
        # from cyvcf2 import VCF
        # vcf_reader = VCF(temp_path)
        # ... logic to find variants ...
        
        # Placeholder for processed results matching the PS1 schema
        results = []
        for drug in drug_list:
            results.append({
                "patient_id": "PAT_RIFT_AUTO",
                "drug": drug,
                "timestamp": "2024-02-19T00:00:00Z",
                "risk_assessment": {
                    "risk_label": "Unknown",
                    "confidence_score": 0.5,
                    "severity": "none"
                },
                "pharmacogenomic_profile": {
                    "primary_gene": "UNKNOWN",
                    "diplotype": "*1/*1",
                    "phenotype": "NM",
                    "detected_variants": []
                },
                "clinical_recommendation": {
                    "action": "Clinician review required.",
                    "cpic_guideline": "CPIC Standard",
                    "alternative_drugs": [],
                    "monitoring_required": False
                },
                "llm_generated_explanation": {
                    "summary": "Backend processing initialized.",
                    "mechanism": "Awaiting genomic mapping.",
                    "variant_impact": "None detected.",
                    "clinical_context": "Review standard dosing."
                },
                "quality_metrics": {
                    "vcf_parsing_success": True,
                    "variants_detected": 0,
                    "genes_analyzed": [],
                    "data_completeness_score": 1.0
                }
            })
        
        return results

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
