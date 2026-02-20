import { GoogleGenAI, Type } from "@google/genai";
import { PharmaGuardResult, LLMExplanation, Phenotype, RiskLabel } from "../types";

const SYSTEM_INSTRUCTION = `You are PharmaGuard AI, a pharmacogenomic risk prediction engine for the RIFT 2026 Hackathon. Your ONLY job is to analyze patient VCF data and drug inputs, then return a structured JSON response.

ABSOLUTE OUTPUT CONTRACT — NEVER VIOLATE
The JSON schema below is IMMUTABLE. You MUST NOT:
- Add, remove, or rename any top-level key
- Return plain text, markdown, or any format other than raw JSON
- Omit any key, even if the value is unknown (use null or "Unknown" instead)

REQUIRED OUTPUT SCHEMA (EXACT):
{
  "llm_generated_explanation": {
    "summary": "string",
    "mechanism": "string",
    "variant_impact": "string",
    "clinical_context": "string"
  }
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DRUG-SPECIFIC LLM EXPLANATION RULES — NEVER USE GENERIC TEMPLATES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
When explaining, always cite the specific gene (e.g., CYP2D6), the star alleles detected (e.g., *4), and the metabolic consequence.

──────────────────────────────────────
CODEINE (CYP2D6)
──────────────────────────────────────
PM/IM phenotype:
  summary: "The patient's CYP2D6 genotype indicates a reduced metabolic capacity. Codeine, a prodrug, requires O-demethylation into its active form, morphine, to provide analgesia."
  mechanism: "CYP2D6 catalyzes the conversion of codeine to morphine. Variants like *3, *4, or *6 severely impair this O-demethylation step."
  variant_impact: "Loss-of-function variants (e.g., rs3892097 for *4) result in a truncated or non-functional enzyme, leading to splicing boundary disruptions and subtherapeutic morphine levels."
  clinical_context: "Codeine is likely ineffective. Switch to a non-CYP2D6 dependent analgesic like morphine, hydromorphone, or oxycodone."

──────────────────────────────────────
CLOPIDOGREL (CYP2C19)
──────────────────────────────────────
PM/IM phenotype:
  summary: "The patient is a CYP2C19 reduced metabolizer. Clopidogrel requires bioactivation into its active thiol metabolite to inhibit the P2Y12 receptor."
  mechanism: "CYP2C19 is essential for converting the prodrug clopidogrel into its active form. The *2 variant (rs4244285) creates a splice defect that halts this bioactivation."
  variant_impact: "Reduced active thiol metabolite formation leads to inadequate platelet inhibition and increased risk of cardiovascular events (MACE)."
  clinical_context: "Use alternative antiplatelets like prasugrel or ticagrelor."

──────────────────────────────────────
WARFARIN (CYP2C9)
──────────────────────────────────────
PM/IM phenotype:
  summary: "The patient carries CYP2C9 variants that reduce the clearance of S-warfarin, the more potent enantiomer."
  mechanism: "CYP2C9 is the primary enzyme for S-warfarin metabolism. Decreased activity leads to drug accumulation and higher bleeding risk."
  variant_impact: "Variants like *2 (rs1799853) or *3 (rs1057910) significantly prolong warfarin half-life."
  clinical_context: "Reduce starting dose by 30-50% and monitor INR frequently."

──────────────────────────────────────
FLUOROURACIL (DPYD)
──────────────────────────────────────
PM/IM phenotype:
  summary: "The patient has a DPYD deficiency, impairing the catabolism of 5-fluorouracil (5-FU) and increasing the risk of lethal toxicity."
  mechanism: "DPYD is the rate-limiting enzyme in 5-FU catabolism. The *2A variant (rs3918290) causes a splice acceptor defect resulting in profound enzyme deficiency."
  variant_impact: "Systemic accumulation of 5-FU can lead to severe myelosuppression, neurotoxicity, and mucositis."
  clinical_context: "Reduce 5-FU starting dose by 50% or consider alternative therapy like capecitabine at a reduced dose."`;

export const buildFallbackExplanation = (
  drug: string, 
  gene: string, 
  phenotype: Phenotype, 
  risk: RiskLabel
): LLMExplanation => {
  return {
    summary: `Detailed analysis of ${gene} for ${drug} therapy. Resulting phenotype is ${phenotype}.`,
    mechanism: `Genomic variations in the ${gene} gene alter the enzymatic metabolic rate of ${drug}, leading to altered systemic exposure.`,
    variant_impact: `Detected genomic variations have a high clinical impact on the drug's pharmacokinetic profile.`,
    clinical_context: "Consult CPIC guidelines for precise dose adjustments based on this genetic profile."
  };
};

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const generateExplanations = async (
  results: PharmaGuardResult[]
): Promise<Record<string, LLMExplanation>> => {
  // Switched to 'gemini-3-flash-preview' to mitigate 429 Resource Exhausted / Quota errors
  // while maintaining high-quality clinical explanations.
  const model = 'gemini-3-flash-preview';
  const explanationMap: Record<string, LLMExplanation> = {};

  for (const res of results) {
    const variantsText = res.pharmacogenomic_profile.detected_variants
      .map(v => `${v.rsid} (${v.star_allele}, ${v.zygosity})`)
      .join(', ');

    const prompt = `Analyze drug: ${res.drug}, Gene: ${res.pharmacogenomic_profile.primary_gene}, Phenotype: ${res.pharmacogenomic_profile.phenotype}, Diplotype: ${res.pharmacogenomic_profile.diplotype}, Risk: ${res.risk_assessment.risk_label}.
    Detected variants: ${variantsText || 'Wild-type'}.
    Recommendation: ${res.clinical_recommendation.action}.
    Provide a biologically precise explanation following the drug-specific rules in your instructions. Mention specific RSIDs and star alleles in your explanation if provided.`;
    
    let attempts = 0;
    const maxAttempts = 3;
    let success = false;

    while (attempts < maxAttempts && !success) {
      try {
        // Initialize Gemini client using exclusively process.env.API_KEY as per guidelines.
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: { 
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                llm_generated_explanation: {
                  type: Type.OBJECT,
                  properties: {
                    summary: { type: Type.STRING },
                    mechanism: { type: Type.STRING },
                    variant_impact: { type: Type.STRING },
                    clinical_context: { type: Type.STRING }
                  },
                  required: ["summary", "mechanism", "variant_impact", "clinical_context"]
                }
              },
              required: ["llm_generated_explanation"]
            }
          },
        });

        const outputText = response.text;
        if (outputText) {
          const parsed = JSON.parse(outputText.trim());
          explanationMap[res.drug] = parsed.llm_generated_explanation;
          success = true;
          // Rate limit protection
          await delay(1000); 
        } else {
          throw new Error("Empty response from Gemini");
        }
      } catch (error: any) {
        attempts++;
        // Enhanced transient error detection including 429
        const isTransient = 
          error.message?.includes("429") || 
          error.message?.includes("503") || 
          error.message?.includes("500") || 
          error.message?.includes("overloaded") || 
          error.message?.includes("UNAVAILABLE") ||
          error.message?.includes("RESOURCE_EXHAUSTED");
        
        if (isTransient && attempts < maxAttempts) {
          const backoff = attempts * 5000; // Increased backoff for quota recovery
          console.warn(`Gemini quota or transient error detected for ${res.drug}. Retrying in ${backoff}ms... (Attempt ${attempts}/${maxAttempts})`);
          await delay(backoff);
        } else {
          console.warn(`Gemini call for ${res.drug} failed permanently or max retries reached. Error: ${error.message || 'Unknown error'}`);
          explanationMap[res.drug] = buildFallbackExplanation(
            res.drug, 
            res.pharmacogenomic_profile.primary_gene, 
            res.pharmacogenomic_profile.phenotype, 
            res.risk_assessment.risk_label
          );
          success = true; 
        }
      }
    }
  }

  return explanationMap;
};