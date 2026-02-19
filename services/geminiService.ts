
import { GoogleGenAI, Type } from "@google/genai";
import { PharmaGuardResult, LLMExplanation, Phenotype, RiskLabel } from "../types";

/**
 * Strips markdown code fences from AI response string.
 */
function sanitizeLlmJson(raw: string): string {
  return raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

/**
 * Generates a structured fallback explanation if the LLM fails.
 */
export const buildFallbackExplanation = (
  drug: string, 
  gene: string, 
  phenotype: Phenotype, 
  risk: RiskLabel
): LLMExplanation => {
  return {
    summary: `Analysis of ${gene} indicates a ${phenotype} phenotype, affecting how the body processes ${drug}.`,
    mechanism: `Genomic variations in ${gene} alter the metabolic clearance rate, leading to ${risk === RiskLabel.TOXIC ? 'elevated drug levels' : 'reduced efficacy'}.`,
    clinical_caveats: "Standard monitoring for adverse effects and therapeutic response is advised. Adjustments should consider comorbid conditions and polypharmacy."
  };
};

export const generateExplanations = async (
  results: PharmaGuardResult[]
): Promise<Record<string, LLMExplanation>> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key missing");

  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview";

  const drugSummaries = results.map(r => 
    `DRUG: ${r.drug}, PHENO: ${r.pharmacogenomic_profile.phenotype}, RISK: ${r.risk_assessment.risk_label}, REC: ${r.clinical_recommendation.summary}`
  ).join('\n');

  const prompt = `
    Act as a senior clinical pharmacogeneticist. 
    Explain the following findings for a clinical dashboard.
    
    ${drugSummaries}

    OUTPUT RULES:
    1. Return valid JSON only.
    2. JSON keys must exactly match the DRUG names provided.
    3. Each value must be an object with: 
       "summary" (Professional 2-sentence explanation of what this means for the drug), 
       "mechanism" (Biochemical explanation of the gene-drug interaction), 
       "clinical_caveats" (Important clinical considerations, limitations, or monitoring requirements).
    4. Keep it non-prescriptive and grounded in CPIC standards.
  `;

  const finalExplanations: Record<string, LLMExplanation> = {};

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    if (response.text) {
      const cleanedJson = sanitizeLlmJson(response.text);
      const parsed = JSON.parse(cleanedJson);
      
      // Process each drug individually to handle missing keys
      for (const res of results) {
        if (parsed[res.drug]) {
          finalExplanations[res.drug] = parsed[res.drug];
        } else {
          finalExplanations[res.drug] = buildFallbackExplanation(
            res.drug,
            res.pharmacogenomic_profile.primary_gene,
            res.pharmacogenomic_profile.phenotype,
            res.risk_assessment.risk_label
          );
        }
      }
      return finalExplanations;
    }
  } catch (error) {
    console.error("Gemini explanation parsing failed. Using fallbacks.", error);
  }

  // Global fallback if everything fails
  for (const res of results) {
    if (!finalExplanations[res.drug]) {
      finalExplanations[res.drug] = buildFallbackExplanation(
        res.drug,
        res.pharmacogenomic_profile.primary_gene,
        res.pharmacogenomic_profile.phenotype,
        res.risk_assessment.risk_label
      );
    }
  }
  return finalExplanations;
};
