
import { RiskLabel, Severity, Phenotype } from './types';

export const SUPPORTED_DRUGS = [
  'CODEINE',
  'WARFARIN',
  'CLOPIDOGREL',
  'SIMVASTATIN',
  'AZATHIOPRINE',
  'FLUOROURACIL'
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
  'CODEINE': 'CYP2D6',
  'CLOPIDOGREL': 'CYP2C19',
  'WARFARIN': 'CYP2C9',
  'SIMVASTATIN': 'SLCO1B1',
  'AZATHIOPRINE': 'TPMT',
  'FLUOROURACIL': 'DPYD'
};

export const CPIC_RULES: Record<string, Record<string, any>> = {
  'CYP2D6': {
    [Phenotype.PM]: {
      risk: RiskLabel.INEFFECTIVE,
      severity: Severity.HIGH,
      rec: 'Avoid codeine due to lack of efficacy. Use alternative analgesics.'
    },
    [Phenotype.URM]: {
      risk: RiskLabel.TOXIC,
      severity: Severity.CRITICAL,
      rec: 'Avoid codeine due to risk of toxicity. High risk of respiratory depression.'
    },
    [Phenotype.NM]: {
      risk: RiskLabel.SAFE,
      severity: Severity.NONE,
      rec: 'Standard dosing recommended.'
    },
    [Phenotype.UNKNOWN]: {
      risk: RiskLabel.UNKNOWN,
      severity: Severity.LOW,
      rec: 'Genetic status uncertain. Monitor for efficacy and adverse events.'
    }
  },
  'CYP2C19': {
    [Phenotype.PM]: {
      risk: RiskLabel.INEFFECTIVE,
      severity: Severity.HIGH,
      rec: 'Avoid clopidogrel. Use alternative antiplatelet therapy like Prasugrel.'
    },
    [Phenotype.IM]: {
      risk: RiskLabel.ADJUST,
      severity: Severity.MODERATE,
      rec: 'Consider alternative antiplatelet if high risk of thrombosis.'
    },
    [Phenotype.NM]: {
      risk: RiskLabel.SAFE,
      severity: Severity.NONE,
      rec: 'Standard clopidogrel therapy.'
    },
    [Phenotype.UNKNOWN]: {
      risk: RiskLabel.UNKNOWN,
      severity: Severity.LOW,
      rec: 'Phenotype unknown. Follow standard clinical protocols.'
    }
  },
  'CYP2C9': {
    [Phenotype.PM]: {
      risk: RiskLabel.ADJUST,
      severity: Severity.HIGH,
      rec: 'CYP2C9 Poor Metabolizer: Reduce starting dose of warfarin by 50–75%. Monitor INR closely and titrate slowly.'
    },
    [Phenotype.IM]: {
      risk: RiskLabel.ADJUST,
      severity: Severity.MODERATE,
      rec: 'CYP2C9 Intermediate Metabolizer: Reduce starting dose of warfarin by 25–50%. Monitor INR regularly.'
    },
    [Phenotype.NM]: {
      risk: RiskLabel.SAFE,
      severity: Severity.NONE,
      rec: 'CYP2C9 Normal Metabolizer: Standard warfarin dosing applies. Routine INR monitoring.'
    },
    [Phenotype.RM]: {
      risk: RiskLabel.ADJUST,
      severity: Severity.LOW,
      rec: 'CYP2C9 Rapid Metabolizer: Slightly higher dose may be needed. Monitor INR.'
    },
    [Phenotype.UNKNOWN]: {
      risk: RiskLabel.UNKNOWN,
      severity: Severity.LOW,
      rec: 'CYP2C9 phenotype could not be determined. Use standard dosing with close INR monitoring.'
    }
  },
  'SLCO1B1': {
    [Phenotype.PM]: {
      risk: RiskLabel.TOXIC,
      severity: Severity.HIGH,
      rec: 'Avoid high-dose Simvastatin. Use lower dose or different statin.'
    },
    [Phenotype.IM]: {
      risk: RiskLabel.ADJUST,
      severity: Severity.MODERATE,
      rec: 'Intermediate SLCO1B1 function: Consider lower starting dose of simvastatin or alternative statin to minimize myopathy risk.'
    },
    [Phenotype.RM]: {
      risk: RiskLabel.SAFE,
      severity: Severity.NONE,
      rec: 'Normal or increased SLCO1B1 function: Standard simvastatin dosing is generally appropriate.'
    },
    [Phenotype.NM]: {
      risk: RiskLabel.SAFE,
      severity: Severity.NONE,
      rec: 'Standard simvastatin dosing.'
    },
    [Phenotype.UNKNOWN]: {
      risk: RiskLabel.UNKNOWN,
      severity: Severity.LOW,
      rec: 'Risk profile unclear. Monitor for muscle pain or weakness.'
    }
  },
  'TPMT': {
    [Phenotype.PM]: {
      risk: RiskLabel.TOXIC,
      severity: Severity.CRITICAL,
      rec: 'Avoid or reduce dose by 90% for azathioprine. High risk of life-threatening myelosuppression.'
    },
    [Phenotype.IM]: {
      risk: RiskLabel.ADJUST,
      severity: Severity.MODERATE,
      rec: 'Reduce azathioprine dose by 30-70%. Monitor blood counts frequently.'
    },
    [Phenotype.NM]: {
      risk: RiskLabel.SAFE,
      severity: Severity.NONE,
      rec: 'Standard dosing recommended.'
    },
    [Phenotype.UNKNOWN]: {
      risk: RiskLabel.UNKNOWN,
      severity: Severity.LOW,
      rec: 'Unknown TPMT status. Standard dosing but monitor CBC closely.'
    }
  },
  'DPYD': {
    [Phenotype.PM]: {
      risk: RiskLabel.TOXIC,
      severity: Severity.CRITICAL,
      rec: 'Avoid fluorouracil. Extreme risk of severe or fatal toxicity.'
    },
    [Phenotype.IM]: {
      risk: RiskLabel.ADJUST,
      severity: Severity.HIGH,
      rec: 'Reduce initial dose of fluorouracil by 50% and monitor for toxicity.'
    },
    [Phenotype.NM]: {
      risk: RiskLabel.SAFE,
      severity: Severity.NONE,
      rec: 'Standard fluorouracil dosing.'
    },
    [Phenotype.UNKNOWN]: {
      risk: RiskLabel.UNKNOWN,
      severity: Severity.LOW,
      rec: 'Risk profile unclear. Monitor closely for neutropenia or diarrhea.'
    }
  }
};
