
import { GoogleGenAI, Type } from "@google/genai";
import { PharmaGuardResult, LLMExplanation } from "../types";

export const generateExplanations = async (
  results: PharmaGuardResult
): Promise<Record<string, LLMExplanation>> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key missing");

  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview";

  const explanations: Record<string, LLMExplanation> = {};

  for (const risk of results.risk_assessment) {
    const profile = results.pharmacogenomic_profiles.find(p => p.gene === risk.primary_gene);
    
    const prompt = `
      Act as a clinical pharmacogeneticist. Explain the following finding:
      - Drug: ${risk.drug}
      - Gene: ${risk.primary_gene}
      - Phenotype: ${profile?.phenotype || 'Unknown'}
      - Risk: ${risk.risk_label}
      - Recommendation: ${risk.recommendation_text}
      - Detected Variants: ${JSON.stringify(profile?.detected_variants || [])}

      Structure the response as JSON with:
      - explanation: A clear 2-3 sentence summary.
      - mechanism: The biochemical mechanism behind this reaction.
      - caveats: Important medical disclaimers or monitoring needs.
    `;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              explanation: { type: Type.STRING },
              mechanism: { type: Type.STRING },
              caveats: { type: Type.STRING },
            },
            required: ["explanation", "mechanism", "caveats"],
          },
        },
      });

      if (response.text) {
        explanations[risk.drug] = JSON.parse(response.text);
      }
    } catch (error) {
      console.error(`Failed to generate explanation for ${risk.drug}:`, error);
    }
  }

  return explanations;
};
