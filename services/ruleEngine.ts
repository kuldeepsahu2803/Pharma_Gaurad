import { Phenotype, RiskLabel, Severity } from '../types';
import { DRUG_GENE_MAP, CPIC_RULES } from '../constants';

const ALTERNATIVE_DRUGS_MAP: Record<string, Record<string, string[]>> = {
  'CODEINE': {
    [Phenotype.PM]: ['Morphine', 'Hydromorphone', 'Oxycodone'],
    [Phenotype.IM]: ['Morphine', 'Hydromorphone', 'Oxycodone'],
    [Phenotype.URM]: ['Morphine', 'Hydromorphone', 'Oxycodone'],
  },
  'CLOPIDOGREL': {
    [Phenotype.PM]: ['Prasugrel', 'Ticagrelor'],
    [Phenotype.IM]: ['Prasugrel', 'Ticagrelor'],
  },
  'WARFARIN': {
    [Phenotype.PM]: ['Apixaban', 'Rivaroxaban', 'Dabigatran'],
    [Phenotype.IM]: ['Apixaban', 'Rivaroxaban', 'Dabigatran'],
  },
  'SIMVASTATIN': {
    [Phenotype.PM]: ['Pravastatin', 'Rosuvastatin'],
    [Phenotype.IM]: ['Pravastatin', 'Rosuvastatin'],
  },
  'FLUOROURACIL': {
    [Phenotype.PM]: ['Capecitabine (reduced dose)', 'Raltitrexed'],
    [Phenotype.IM]: ['Capecitabine (reduced dose)', 'Raltitrexed'],
  },
  'AZATHIOPRINE': {
    [Phenotype.PM]: ['Non-thiopurine immunosuppressants'],
    [Phenotype.IM]: ['Non-thiopurine immunosuppressants'],
  }
};

export const getRecommendation = (drug: string, phenotype: Phenotype, confidence?: number) => {
  const gene = DRUG_GENE_MAP[drug];
  const rules = CPIC_RULES[gene];
  const alternatives = ALTERNATIVE_DRUGS_MAP[drug]?.[phenotype] || [];
  
  if (rules && rules[phenotype]) {
    const rule = rules[phenotype];
    return {
      drug,
      primary_gene: gene,
      recommendation_text: rule.rec,
      risk_label: rule.risk as RiskLabel,
      severity: rule.severity as Severity,
      confidence_score: confidence ?? 0.98,
      alternative_drugs: alternatives
    };
  }

  return {
    drug,
    primary_gene: gene,
    recommendation_text: 'Standard clinical management recommended.',
    risk_label: RiskLabel.SAFE,
    severity: Severity.NONE,
    confidence_score: confidence ?? 0.85,
    alternative_drugs: []
  };
};