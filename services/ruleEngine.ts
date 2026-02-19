import { Phenotype, RiskLabel, Severity } from '../types';
import { DRUG_GENE_MAP, CPIC_RULES } from '../constants';

const ALTERNATIVE_DRUGS_MAP: Record<string, Record<string, string[]>> = {
  'CODEINE': {
    [Phenotype.PM]: ['morphine', 'hydromorphone', 'oxycodone'],
    [Phenotype.IM]: ['morphine', 'hydromorphone', 'oxycodone'],
    [Phenotype.URM]: ['morphine', 'hydromorphone', 'oxycodone'],
  },
  'CLOPIDOGREL': {
    [Phenotype.PM]: ['prasugrel', 'ticagrelor'],
    [Phenotype.IM]: ['prasugrel', 'ticagrelor'],
  },
  'WARFARIN': {
    [Phenotype.PM]: ['apixaban', 'rivaroxaban', 'dabigatran'],
    [Phenotype.IM]: ['apixaban', 'rivaroxaban', 'dabigatran'],
  },
  'SIMVASTATIN': {
    [Phenotype.PM]: ['pravastatin', 'rosuvastatin'],
    [Phenotype.IM]: ['pravastatin', 'rosuvastatin'],
  },
  'FLUOROURACIL': {
    [Phenotype.PM]: ['capecitabine (reduced dose)', 'raltitrexed'],
    [Phenotype.IM]: ['capecitabine (reduced dose)'],
  },
  'AZATHIOPRINE': {
    [Phenotype.PM]: ['non-thiopurine immunosuppressants'],
    [Phenotype.IM]: ['non-thiopurine immunosuppressants'],
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