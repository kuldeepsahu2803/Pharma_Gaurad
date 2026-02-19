
import { RiskLabel, Severity, Phenotype } from './types';

export const SUPPORTED_DRUGS = [
  'Codeine',
  'Clopidogrel',
  'Warfarin',
  'Simvastatin',
  'Tacrolimus',
  'Fluorouracil'
];

export const SUPPORTED_GENES = [
  'CYP2D6',
  'CYP2C19',
  'CYP2C9',
  'SLCO1B1',
  'TPMT',
  'DPYD'
];

export const DRUG_GENE_MAP: Record<string, string> = {
  'Codeine': 'CYP2D6',
  'Clopidogrel': 'CYP2C19',
  'Warfarin': 'CYP2C9',
  'Simvastatin': 'SLCO1B1',
  'Tacrolimus': 'CYP3A5', // While 3A5 isn't in core 6 for some specs, it's the CPIC standard. For PS1 we map to the nearest relevant.
  'Fluorouracil': 'DPYD'
};

// Simplified CPIC Rule Engine Table
export const CPIC_RULES: Record<string, Record<string, any>> = {
  'CYP2D6': {
    [Phenotype.PM]: {
      risk: RiskLabel.HIGH,
      severity: Severity.HIGH,
      rec: 'Avoid codeine due to lack of efficacy. Use alternative analgesics.'
    },
    [Phenotype.URM]: {
      risk: RiskLabel.HIGH,
      severity: Severity.CRITICAL,
      rec: 'Avoid codeine due to risk of toxicity. High risk of respiratory depression.'
    },
    [Phenotype.NM]: {
      risk: RiskLabel.LOW,
      severity: Severity.LOW,
      rec: 'Standard dosing recommended.'
    }
  },
  'CYP2C19': {
    [Phenotype.PM]: {
      risk: RiskLabel.HIGH,
      severity: Severity.HIGH,
      rec: 'Avoid clopidogrel. Use alternative antiplatelet therapy like Prasugrel.'
    },
    [Phenotype.IM]: {
      risk: RiskLabel.MODERATE,
      severity: Severity.MEDIUM,
      rec: 'Consider alternative antiplatelet if high risk of thrombosis.'
    }
  },
  'SLCO1B1': {
    [Phenotype.PM]: {
      risk: RiskLabel.HIGH,
      severity: Severity.HIGH,
      rec: 'Avoid high-dose Simvastatin. Use lower dose or different statin.'
    }
  }
};
