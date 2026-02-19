
import { Phenotype, RiskLabel, Severity } from '../types';
import { DRUG_GENE_MAP, CPIC_RULES } from '../constants';

export const getRecommendation = (drug: string, phenotype: Phenotype, confidence?: number) => {
  const gene = DRUG_GENE_MAP[drug];
  const rules = CPIC_RULES[gene];
  
  if (rules && rules[phenotype]) {
    const rule = rules[phenotype];
    return {
      drug,
      primary_gene: gene,
      recommendation_text: rule.rec,
      risk_label: rule.risk as RiskLabel,
      severity: rule.severity as Severity,
      confidence_score: confidence ?? 0.98
    };
  }

  return {
    drug,
    primary_gene: gene,
    recommendation_text: 'Standard clinical management recommended.',
    risk_label: RiskLabel.SAFE,
    severity: Severity.NONE,
    confidence_score: confidence ?? 0.85
  };
};
