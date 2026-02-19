
import { VariantRecord, Phenotype } from '../types';

type VariantFunction = 'no_function' | 'decreased' | 'increased' | 'normal';

interface MapEntry {
  gene: string;
  star: string;
  phenotype: Phenotype;
  function: VariantFunction;
}

/**
 * Strict Mapping for Pathogenic Star Alleles
 * RSIDs listed here are considered Clinically Significant (Pathogenic/Affects Function)
 * Benign or CPIC Level 3 variants (like rs16947) are EXCLUDED here.
 */
const PATHOGENIC_MAP: Record<string, MapEntry> = {
  "rs3892097":  { gene: "CYP2D6",  star: "*4",  phenotype: Phenotype.PM, function: 'no_function' },
  "rs35742686": { gene: "CYP2D6",  star: "*3",  phenotype: Phenotype.PM, function: 'no_function' },
  "rs5030655":  { gene: "CYP2D6",  star: "*6",  phenotype: Phenotype.PM, function: 'no_function' },
  "rs1065852":  { gene: "CYP2D6",  star: "*4",  phenotype: Phenotype.PM, function: 'no_function' },
  "rs1135840":  { gene: "CYP2D6",  star: "*4",  phenotype: Phenotype.PM, function: 'no_function' },
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

export const isPathogenicVariant = (rsid: string): boolean => {
  return rsid in PATHOGENIC_MAP;
};

/**
 * Programmatic Diplotype Construction based on GT rules:
 * - NO non-ref GT pathogenic variants found -> "*1/*1"
 * - ONE heterozygous (0/1) pathogenic variant found -> "*X/*1"
 * - ONE homozygous (1/1) pathogenic variant found -> "*X/*X"
 * - TWO different heterozygous pathogenic variants -> "*X/*Y"
 */
export const getDiplotypeForGene = (gene: string, variants: VariantRecord[]): string => {
  const pathogenicVariants = variants.filter(v => 
    v.gene === gene && 
    isPathogenicVariant(v.rsid) &&
    v.zygosity !== 'homozygous_ref' && 
    v.zygosity !== 'unknown' && 
    v.zygosity !== 'hemizygous_ref'
  );

  if (pathogenicVariants.length === 0) {
    return '*1/*1';
  }

  // Map to star alleles
  const starAlleles = pathogenicVariants.map(v => ({
    star: PATHOGENIC_MAP[v.rsid].star,
    zygosity: v.zygosity,
    func: PATHOGENIC_MAP[v.rsid].function
  }));

  // Rule: If ONE homozygous pathogenic variant found
  const homozygous = starAlleles.find(s => s.zygosity === 'homozygous_alt');
  if (homozygous) {
    return `${homozygous.star}/${homozygous.star}`;
  }

  // Rule: If TWO DIFFERENT heterozygous pathogenic variants
  if (starAlleles.length >= 2) {
    // Sort by pathogenicity (no_function first)
    const sorted = starAlleles.sort((a, b) => impactOrder[a.func] - impactOrder[b.func]);
    return `${sorted[0].star}/${sorted[1].star}`;
  }

  // Rule: If ONE heterozygous pathogenic variant
  if (starAlleles.length === 1) {
    return `${starAlleles[0].star}/*1`;
  }

  return '*1/*1';
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

  const detectedPathogenic = variants.filter(v => 
    v.gene === gene && 
    isPathogenicVariant(v.rsid) &&
    v.zygosity !== 'homozygous_ref' && 
    v.zygosity !== 'unknown' && 
    v.zygosity !== 'hemizygous_ref'
  );

  if (detectedPathogenic.length === 0) {
    const avgQuality = geneVariants.reduce((sum, v) => sum + v.quality, 0) / geneVariants.length;
    return { 
      phenotype: Phenotype.NM, 
      confidence: avgQuality,
      causalVariantIds: []
    };
  }

  const sorted = detectedPathogenic
    .map(v => ({ variant: v, entry: PATHOGENIC_MAP[v.rsid] }))
    .sort((a, b) => impactOrder[a.entry.function] - impactOrder[b.entry.function]);

  const primary = sorted[0];
  let phenotype = primary.entry.phenotype;

  // Phenotype Resolution Rules:
  if (primary.variant.zygosity === 'heterozygous' && primary.entry.function === 'no_function') {
    phenotype = Phenotype.IM;
  } else if (primary.variant.zygosity === 'homozygous_alt' && primary.entry.function === 'no_function') {
    phenotype = Phenotype.PM;
  }
  
  // Compound Heterozygote logic (PM)
  if (sorted.length >= 2 && primary.variant.zygosity === 'heterozygous') {
    const secondary = sorted[1];
    if (primary.entry.function === 'no_function' && secondary.entry.function === 'no_function') {
      phenotype = Phenotype.PM;
    }
  }
  
  const causalVariantIds = sorted.slice(0, 2).map(e => e.variant.rsid);
  const avgQualOfCausal = sorted.slice(0, 2).reduce((sum, e) => sum + e.variant.quality, 0) / Math.min(2, sorted.length);

  return { 
    phenotype, 
    causalVariantIds,
    confidence: avgQualOfCausal
  };
};
