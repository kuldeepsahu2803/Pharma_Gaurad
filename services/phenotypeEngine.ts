
import { VariantRecord, Phenotype } from '../types';

type VariantFunction = 'no_function' | 'decreased' | 'increased' | 'normal';

interface MapEntry {
  gene: string;
  star: string;
  phenotype: Phenotype;
  function: VariantFunction;
}

const RSID_STAR_ALLELE_MAP: Record<string, MapEntry> = {
  "rs3892097":  { gene: "CYP2D6",  star: "*4",  phenotype: Phenotype.PM, function: 'no_function' },
  "rs35742686": { gene: "CYP2D6",  star: "*3",  phenotype: Phenotype.PM, function: 'no_function' },
  "rs5030655":  { gene: "CYP2D6",  star: "*6",  phenotype: Phenotype.PM, function: 'no_function' },
  "rs16947":    { gene: "CYP2D6",  star: "*2",  phenotype: Phenotype.NM, function: 'normal' },
  "rs4244285":  { gene: "CYP2C19", star: "*2",  phenotype: Phenotype.PM, function: 'no_function' },
  "rs4986893":  { gene: "CYP2C19", star: "*3",  phenotype: Phenotype.PM, function: 'no_function' },
  "rs12248560": { gene: "CYP2C19", star: "*17", phenotype: Phenotype.RM, function: 'increased' },
  "rs1799853":  { gene: "CYP2C9",  star: "*2",  phenotype: Phenotype.IM, function: 'decreased' },
  "rs1057910":  { gene: "CYP2C9",  star: "*3",  phenotype: Phenotype.PM, function: 'no_function' },
  "rs4149056":  { gene: "SLCO1B1", star: "*5",  phenotype: Phenotype.PM, function: 'no_function' },
  "rs1800462":  { gene: "TPMT",    star: "*2",  phenotype: Phenotype.IM, function: 'decreased' },
  "rs1800460":  { gene: "TPMT",    star: "*3B", phenotype: Phenotype.PM, function: 'no_function' },
  "rs1142345":  { gene: "TPMT",    star: "*3C", phenotype: Phenotype.PM, function: 'no_function' },
  "rs3918290":  { gene: "DPYD",    star: "*2A", phenotype: Phenotype.PM, function: 'no_function' },
  "rs55886062": { gene: "DPYD",    star: "*13", phenotype: Phenotype.IM, function: 'decreased' },
};

const impactOrder: Record<VariantFunction, number> = { 
  no_function: 0, 
  decreased: 1, 
  increased: 2, 
  normal: 3 
};

export const getDiplotypeForGene = (gene: string, variants: VariantRecord[]): string => {
  const geneVariants = variants.filter(v => v.gene === gene);
  if (geneVariants.length === 0) return '*1/*1 (assumed)';
  
  const detectedAlleles = geneVariants
    .map(v => RSID_STAR_ALLELE_MAP[v.rsid])
    .filter(entry => entry && entry.gene === gene) as MapEntry[];

  if (detectedAlleles.length === 0) {
    return '*1/*1';
  }

  const sorted = detectedAlleles.sort((a, b) => impactOrder[a.function] - impactOrder[b.function]);
  const primary = sorted[0];
  const variant = geneVariants.find(v => v.rsid === primary.star); // Not exactly rsid but key

  // FIX: Use 'homozygous_alt' instead of 'homozygous' to match DetectedVariant type for variant detection
  if (geneVariants.some(v => v.zygosity === 'homozygous_alt')) {
    return `${primary.star}/${primary.star}`;
  }

  return `${primary.star}/*1`;
};

export interface PhenotypeResult {
  phenotype: Phenotype;
  causalVariantIds: string[];
  assumed_wildtype?: boolean;
  confidence_note?: string;
  confidence: number;
}

export const getPhenotypeForGene = (gene: string, variants: VariantRecord[]): PhenotypeResult => {
  const geneVariants = variants.filter(v => v.gene === gene);
  
  if (geneVariants.length === 0) {
    return { 
      phenotype: Phenotype.NM,
      assumed_wildtype: true,
      confidence_note: `Gene ${gene} not detected in VCF. Wild-type (NM) assumed with low confidence.`,
      confidence: 0.85,
      causalVariantIds: []
    };
  }

  const detectedEntries: { variant: VariantRecord; entry: MapEntry }[] = [];
  for (const variant of geneVariants) {
    const entry = RSID_STAR_ALLELE_MAP[variant.rsid];
    if (entry && entry.gene === gene) {
      detectedEntries.push({ variant, entry });
    }
  }

  if (detectedEntries.length === 0) {
    const avgQuality = geneVariants.reduce((sum, v) => sum + v.quality, 0) / geneVariants.length;
    return { 
      phenotype: Phenotype.NM, 
      confidence: avgQuality,
      causalVariantIds: []
    };
  }

  const sortedEntries = detectedEntries.sort((a, b) => impactOrder[a.entry.function] - impactOrder[b.entry.function]);
  const primary = sortedEntries[0];
  
  // Zygosity Check
  let phenotype = primary.entry.phenotype;
  if (primary.variant.zygosity === 'heterozygous' && primary.entry.function === 'no_function') {
    phenotype = Phenotype.IM;
  }
  
  // SLCO1B1 Terminology nuance handled via enum but mapped in LLM logic
  
  const causalVariantIds = sortedEntries.slice(0, 2).map(e => e.variant.rsid);
  const avgQualOfCausal = sortedEntries.slice(0, 2).reduce((sum, e) => sum + e.variant.quality, 0) / Math.min(2, sortedEntries.length);

  return { 
    phenotype, 
    causalVariantIds,
    confidence: avgQualOfCausal
  };
};
