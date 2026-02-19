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

──────────────────────────────────────
CODEINE (CYP2D6)
──────────────────────────────────────
PM phenotype:
  summary: "The patient is a CYP2D6 Poor Metabolizer (PM). Codeine cannot be O-demethylated into its active form, morphine, resulting in complete therapeutic failure with no analgesic effect."
  mechanism: "CYP2D6 catalyzes the O-demethylation of codeine (a prodrug) into morphine, which is responsible for all analgesic activity. In PM patients, absent CYP2D6 activity means codeine remains unconverted and pharmacologically inert."
  variant_impact: "The detected alleles introduce defects such as splicing boundary PRODUCTIONS producing non-functional truncated enzyme. Diplotypes like *4/*1 or *4/*4 result in significantly reduced/absent overall CYP2D6 activity."
  clinical_context: "Codeine will provide no pain relief. Switch to a non-CYP2D6-dependent analgesic such as morphine (direct opioid), hydromorphone, or oxycodone. Avoid tramadol (also CYP2D6-dependent)."

IM phenotype:
  summary: "The patient is a CYP2D6 Intermediate Metabolizer. Partial conversion of codeine to morphine may result in subtherapeutic analgesia."
  mechanism: "Reduced CYP2D6 activity leads to lower morphine production compared to normal metabolizers."
  variant_impact: "One reduced-function allele limits enzymatic output to approximately 50% of normal capacity."
  clinical_context: "Monitor analgesic response closely. Consider dose adjustment or alternative analgesic if pain relief is inadequate."

──────────────────────────────────────
WARFARIN (CYP2C9)
──────────────────────────────────────
PM/IM phenotype:
  summary: "The patient is a CYP2C9 Poor/Reduced Metabolizer, resulting in severely reduced clearance of S-warfarin and high bleeding risk at standard doses."
  mechanism: "CYP2C9 is the primary enzyme metabolizing S-warfarin (the more pharmacologically potent enantiomer). Reduced activity leads to drug accumulation and supratherapeutic INR levels."
  variant_impact: "Loss-of-function alleles such as *2 (rs1799853) and *3 (rs1057910) reduce enzymatic activity by 30–95% respectively, prolonging warfarin's half-life significantly."
  clinical_context: "Reduce starting warfarin dose by 50–75%. Increase INR monitoring frequency during initiation. Consider DOAC alternatives (apixaban, rivaroxaban, dabigatran) that do not require CYP2C9 metabolism."

──────────────────────────────────────
CLOPIDOGREL (CYP2C19)
──────────────────────────────────────
PM/IM phenotype:
  summary: "The patient is a CYP2C19 Poor/Reduced Metabolizer. Clopidogrel cannot be bioactivated to its active thiol metabolite, resulting in absent/low antiplatelet effect and high cardiovascular risk."
  mechanism: "CYP2C19 performs two sequential oxidation steps to convert clopidogrel (an inactive prodrug) into its active thiol metabolite, which irreversibly inhibits the P2Y12 platelet receptor. PM patients cannot complete this bioactivation."
  variant_impact: "Alleles like *2 (rs4244285) create aberrant splice sites, producing non-functional protein. Carriers have drastically reduced active metabolite formation."
  clinical_context: "Clopidogrel will provide inadequate antiplatelet protection, placing the patient at high risk for major adverse cardiovascular events (MACE). Switch to Prasugrel or Ticagrelor."

──────────────────────────────────────
SIMVASTATIN (SLCO1B1)
──────────────────────────────────────
PM/IM (Carrier) phenotype:
  summary: "The patient carries the SLCO1B1 *5 allele (or equivalent), reducing hepatic uptake of simvastatin acid and increasing myopathy risk."
  mechanism: "SLCO1B1 encodes the OATP1B1 hepatic transporter responsible for moving simvastatin acid from blood into liver cells. Reduced transporter function results in elevated systemic plasma concentrations."
  variant_impact: "The *5 allele (rs4149056, c.521T>C) reduces OATP1B1 transport activity, leading to 2–3x higher simvastatin plasma exposure."
  clinical_context: "Elevated systemic exposure significantly increases risk of statin-associated myopathy (SAM). Limit simvastatin dose to ≤20mg/day or switch to pravastatin/rosuvastatin."

──────────────────────────────────────
AZATHIOPRINE (TPMT)
──────────────────────────────────────
PM/IM phenotype:
  summary: "The patient is a TPMT Reduced Metabolizer. Reduced enzyme activity leads to accumulation of cytotoxic 6-thioguanine nucleotides (6-TGN), increasing myelosuppression risk."
  mechanism: "TPMT inactivates 6-mercaptopurine via S-methylation. Reduced TPMT activity diverts more 6-MP toward the 6-TGN pathway, which is cytotoxic to bone marrow."
  variant_impact: "Alleles like *2 (rs1800462) or *3 reduce enzymatic activity significantly."
  clinical_context: "Initiate therapy at 30–70% of standard dose. Monitor CBC weekly for the first month."

──────────────────────────────────────
FLUOROURACIL (DPYD)
──────────────────────────────────────
PM/IM phenotype:
  summary: "The patient carries a DPYD variant reducing 5-FU catabolism, leading to severe and potentially life-threatening fluorouracil toxicity at standard doses."
  mechanism: "DPYD (Dihydropyrimidine Dehydrogenase) is responsible for >80% of fluorouracil catabolism. Reduced DPYD activity causes 5-FU accumulation."
  variant_impact: "The *2A allele (rs3918290) creates an aberrant splice site, producing non-functional DPYD protein."
  clinical_context: "Standard 5-FU dosing is contraindicated. Reduce dose by 50% for heterozygous carriers. Consider alternative agents."`;

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

export const generateExplanations = async (
  results: PharmaGuardResult[]
): Promise<Record<string, LLMExplanation>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-pro-preview";

  const analysisPromises = results.map(async (res) => {
    const variantsText = res.pharmacogenomic_profile.detected_variants
      .map(v => `${v.rsid} (${v.star_allele}, ${v.zygosity})`)
      .join(', ');

    const prompt = `Analyze drug: ${res.drug}, Gene: ${res.pharmacogenomic_profile.primary_gene}, Phenotype: ${res.pharmacogenomic_profile.phenotype}, Diplotype: ${res.pharmacogenomic_profile.diplotype}, Risk: ${res.risk_assessment.risk_label}.
    Detected variants: ${variantsText || 'Wild-type'}.
    Recommendation: ${res.clinical_recommendation.action}.
    Provide a biologically precise explanation following the drug-specific rules in your instructions.`;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

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

      clearTimeout(timeoutId);

      if (response.text) {
        const parsed = JSON.parse(response.text.trim());
        return { drug: res.drug, explanation: parsed.llm_generated_explanation };
      }
    } catch (error) {
      console.warn(`Gemini call for ${res.drug} failed. Falling back.`);
    }

    return { 
      drug: res.drug, 
      explanation: buildFallbackExplanation(
        res.drug, 
        res.pharmacogenomic_profile.primary_gene, 
        res.pharmacogenomic_profile.phenotype, 
        res.risk_assessment.risk_label
      ) 
    };
  });

  const resolvedExplanations = await Promise.all(analysisPromises);
  const explanationMap: Record<string, LLMExplanation> = {};
  
  resolvedExplanations.forEach(item => {
    explanationMap[item.drug] = item.explanation;
  });

  return explanationMap;
};