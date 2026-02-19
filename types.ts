
export enum Phenotype {
  PM = 'PM',
  IM = 'IM',
  NM = 'NM',
  RM = 'RM',
  URM = 'URM',
  UNKNOWN = 'Unknown'
}

export enum RiskLabel {
  SAFE = 'Safe',
  ADJUST = 'Adjust Dosage',
  TOXIC = 'Toxic',
  INEFFECTIVE = 'Ineffective',
  UNKNOWN = 'Unknown'
}

export enum Severity {
  NONE = 'none',
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface VariantRecord {
  chrom: string;
  pos: number;
  id: string;
  ref: string;
  alt: string;
  gene: string;
  quality: number;
  rsid?: string;
  rawLine?: string;
}

export interface DetectedVariant {
  rsid: string;
  is_causal?: boolean;
  rawLine?: string;
}

export interface PharmacogenomicProfile {
  primary_gene: string;
  diplotype: string;
  phenotype: Phenotype;
  detected_variants: DetectedVariant[];
  assumed_wildtype?: boolean;
  confidence_note?: string;
  confidence?: number;
}

export interface ClinicalRecommendation {
  drug: string;
  primary_gene: string;
  recommendation_text: string;
  risk_label: RiskLabel;
  severity: Severity;
  confidence_score: number;
}

export interface LLMExplanation {
  summary: string;
  mechanism?: string;
  clinical_caveats: string;
}

export interface QualityMetrics {
  vcf_parsing_success: boolean;
  variant_count: number;
  gene_coverage: string[];
  assumed_wildtype_genes: string[];
  variant_quality_score: number;
  errors: string[];
}

export interface PharmaGuardResult {
  patient_id: string;
  drug: string;
  timestamp: string;
  risk_assessment: {
    risk_label: RiskLabel;
    confidence_score: number;
    severity: Severity;
  };
  pharmacogenomic_profile: PharmacogenomicProfile;
  clinical_recommendation: {
    summary: string;
  };
  llm_generated_explanation: LLMExplanation;
  quality_metrics: QualityMetrics;
}
