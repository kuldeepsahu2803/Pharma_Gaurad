
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
    .map(v => RSID_STAR_ALLELE_MAP[v.id])
    .filter(entry => entry && entry.gene === gene) as MapEntry[];

  if (detectedAlleles.length === 0) {
    const starMatch = geneVariants.find(v => v.id.includes('*'));
    if (starMatch) return `${starMatch.id}/*1`;
    return '*1/*1';
  }

  // Sort alleles by impact
  const sorted = detectedAlleles.sort((a, b) => impactOrder[a.function] - impactOrder[b.function]);

  if (sorted.length === 1) {
    return `${sorted[0].star}/*1`;
  }

  // Use the two highest-impact alleles (Compound Heterozygote)
  return `${sorted[0].star}/${sorted[1].star}`;
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
    const entry = RSID_STAR_ALLELE_MAP[variant.id];
    if (entry && entry.gene === gene) {
      detectedEntries.push({ variant, entry });
    }
  }

  // Fallback: allele heuristics if map doesn't catch it
  if (detectedEntries.length === 0) {
    const alleleHeuristics: Record<string, { pheno: Phenotype; func: VariantFunction }> = {
      '*2': { pheno: Phenotype.PM, func: 'no_function' },
      '*3': { pheno: Phenotype.PM, func: 'no_function' },
      '*4': { pheno: Phenotype.PM, func: 'no_function' },
      '*5': { pheno: Phenotype.PM, func: 'no_function' },
      '*6': { pheno: Phenotype.PM, func: 'no_function' },
      '*17': { pheno: Phenotype.RM, func: 'increased' },
      'xN': { pheno: Phenotype.URM, func: 'increased' },
      '*2A': { pheno: Phenotype.PM, func: 'no_function' },
      '*13': { pheno: Phenotype.IM, func: 'decreased' }
    };

    for (const variant of geneVariants) {
      for (const [allele, info] of Object.entries(alleleHeuristics)) {
        if (variant.id.toUpperCase().includes(allele.toUpperCase())) {
          detectedEntries.push({ 
            variant, 
            entry: { gene, star: allele, phenotype: info.pheno, function: info.func } 
          });
          break;
        }
      }
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

  // Sort by impact
  const sortedEntries = detectedEntries.sort((a, b) => impactOrder[a.entry.function] - impactOrder[b.entry.function]);
  
  // The overall phenotype is determined by the most impactful allele
  const phenotype = sortedEntries[0].entry.phenotype;
  
  // Mark the top 1-2 alleles as causal
  const causalVariantIds = sortedEntries.slice(0, 2).map(e => e.variant.id);
  
  const avgQualOfCausal = sortedEntries.slice(0, 2).reduce((sum, e) => sum + e.variant.quality, 0) / Math.min(2, sortedEntries.length);

  return { 
    phenotype, 
    causalVariantIds,
    confidence: avgQualOfCausal
  };
};
