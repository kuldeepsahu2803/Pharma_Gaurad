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

export interface DetectedVariant {
  rsid: string;
  gene: string;
  star_allele: string;
  zygosity: 'homozygous_ref' | 'homozygous_alt' | 'heterozygous' | 'hemizygous' | 'hemizygous_ref' | 'unknown';
}

export interface VariantRecord extends DetectedVariant {
  chrom: string;
  pos: number;
  ref: string;
  alt: string;
  quality: number;
  cpic_level?: string;
  clinical_significance?: string;
}

export interface PharmacogenomicProfile {
  primary_gene: string;
  diplotype: string;
  phenotype: Phenotype;
  detected_variants: DetectedVariant[];
}

export interface ClinicalRecommendation {
  action: string;
  cpic_guideline: string;
  alternative_drugs: string[];
  monitoring_required: boolean;
}

export interface LLMExplanation {
  summary: string;
  mechanism: string;
  variant_impact: string;
  clinical_context: string;
}

export interface QualityMetrics {
  vcf_parsing_success: boolean;
  variants_detected: number;
  genes_analyzed: string[];
  data_completeness_score: number;
  errors?: string[];
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
  clinical_recommendation: ClinicalRecommendation;
  llm_generated_explanation: LLMExplanation;
  quality_metrics: QualityMetrics;
}