
export enum Phenotype {
  PM = 'Poor Metabolizer',
  IM = 'Intermediate Metabolizer',
  NM = 'Normal Metabolizer',
  RM = 'Rapid Metabolizer',
  URM = 'Ultra-rapid Metabolizer',
  UNKNOWN = 'Unknown'
}

export enum RiskLabel {
  LOW = 'Low Risk',
  MODERATE = 'Moderate Risk',
  HIGH = 'High Risk',
  UNKNOWN = 'Unknown'
}

export enum Severity {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export interface VariantRecord {
  chrom: string;
  pos: number;
  id: string;
  ref: string;
  alt: string;
  gene: string;
}

export interface PharmacogenomicProfile {
  gene: string;
  phenotype: Phenotype;
  detected_variants: VariantRecord[];
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
  explanation: string;
  mechanism: string;
  caveats: string;
}

export interface QualityMetrics {
  vcf_parsing_success: boolean;
  variant_count: number;
  gene_coverage: string[];
  errors: string[];
}

export interface PharmaGuardResult {
  risk_assessment: ClinicalRecommendation[];
  pharmacogenomic_profiles: PharmacogenomicProfile[];
  llm_generated_explanations: Record<string, LLMExplanation>;
  quality_metrics: QualityMetrics;
}
