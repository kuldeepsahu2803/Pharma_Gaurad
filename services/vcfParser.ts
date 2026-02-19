
import { VariantRecord, Phenotype, QualityMetrics, PharmacogenomicProfile } from '../types';
import { SUPPORTED_GENES } from '../constants';

/**
 * Simplified VCF Parser for prototype.
 * In production, this logic would live on the Python backend.
 */
export const parseVCF = (content: string): { variants: VariantRecord[], metrics: QualityMetrics } => {
  const lines = content.split('\n');
  const variants: VariantRecord[] = [];
  const errors: string[] = [];
  let vcf_parsing_success = true;

  // Basic V4.2 Header Check
  if (!lines[0].startsWith('##fileformat=VCFv4.2')) {
    errors.push("Invalid VCF format. Expected v4.2.");
    vcf_parsing_success = false;
  }

  lines.forEach((line, index) => {
    if (line.startsWith('#') || !line.trim()) return;

    const parts = line.split('\t');
    if (parts.length < 8) return;

    const [chrom, pos, id, ref, alt, qual, filter, info] = parts;

    // Simplified Gene Extraction from INFO field
    const geneMatch = info.match(/GENE=([^;]+)/);
    const geneName = geneMatch ? geneMatch[1] : 'Unknown';

    if (SUPPORTED_GENES.includes(geneName)) {
      variants.push({
        chrom,
        pos: parseInt(pos),
        id,
        ref,
        alt,
        gene: geneName
      });
    }
  });

  return {
    variants,
    metrics: {
      vcf_parsing_success,
      variant_count: variants.length,
      gene_coverage: [...new Set(variants.map(v => v.gene))],
      errors
    }
  };
};

export const determinePhenotypes = (variants: VariantRecord[]): PharmacogenomicProfile[] => {
  return SUPPORTED_GENES.map(gene => {
    const geneVariants = variants.filter(v => v.gene === gene);
    let phenotype = Phenotype.NM;

    // Prototype Heuristics (in reality, use star-allele translation tables)
    if (gene === 'CYP2D6') {
      if (geneVariants.some(v => v.id.includes('*4') || v.id.includes('*5'))) phenotype = Phenotype.PM;
      if (geneVariants.some(v => v.id.includes('xN'))) phenotype = Phenotype.URM;
    }
    
    if (gene === 'CYP2C19') {
       if (geneVariants.some(v => v.id.includes('*2') || v.id.includes('*3'))) phenotype = Phenotype.PM;
    }

    if (gene === 'SLCO1B1') {
       if (geneVariants.some(v => v.id.includes('*5'))) phenotype = Phenotype.PM;
    }

    return {
      gene,
      phenotype,
      detected_variants: geneVariants
    };
  });
};
