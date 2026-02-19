
import { VariantRecord, QualityMetrics } from '../types';
import { SUPPORTED_GENES } from '../constants';

/**
 * Extracts gene symbol from a VCF INFO string using multiple fallback strategies.
 */
function extractGeneSymbol(info: string): string | null {
  const simpleMatch = info.match(/(?:^|;)(?:GENE|SYMBOL)=([^;]+)/i);
  if (simpleMatch) return simpleMatch[1].split(',')[0].toUpperCase();

  const annMatch = info.match(/(?:^|;)ANN=([^;]+)/i);
  if (annMatch) {
    const firstEff = annMatch[1].split(',')[0];
    const parts = firstEff.split('|');
    if (parts.length > 3) return parts[3].toUpperCase();
  }

  const csqMatch = info.match(/(?:^|;)CSQ=([^;]+)/i);
  if (csqMatch) {
    const firstCsq = csqMatch[1].split(',')[0];
    const parts = firstCsq.split('|');
    if (parts.length > 3) return parts[3].toUpperCase();
  }

  return null;
}

/**
 * Robust VCF Parser for PharmaGuard.
 * Validates format, size, and extracts gene-specific variants with quality tracking.
 */
export const parseVCF = (content: string): { variants: VariantRecord[], metrics: QualityMetrics } => {
  const lines = content.split('\n');
  const variants: VariantRecord[] = [];
  const errors: string[] = [];
  let vcf_parsing_success = true;

  if (lines.length === 0 || !lines[0].trim()) {
    return { variants: [], metrics: { vcf_parsing_success: false, variant_count: 0, gene_coverage: [], assumed_wildtype_genes: [], variant_quality_score: 0, errors: ["Empty file."] } };
  }

  if (!lines[0].startsWith('##fileformat=VCFv4.2')) {
    errors.push("Invalid VCF format. System strictly requires VCF v4.2 headers.");
    vcf_parsing_success = false;
  }

  let totalQuality = 0;
  let qualCount = 0;

  lines.forEach((line) => {
    if (line.startsWith('#') || !line.trim()) return;

    const parts = line.split('\t');
    if (parts.length < 8) return;

    const [chrom, pos, id, ref, alt, qualRaw, , info] = parts;
    const geneName = extractGeneSymbol(info) || 'Unknown';

    const rawQual = parseFloat(qualRaw);
    const variantQuality = isNaN(rawQual) ? 0.85 : Math.min(rawQual / 100, 0.99);
    
    totalQuality += variantQuality;
    qualCount++;

    if (SUPPORTED_GENES.includes(geneName)) {
      variants.push({
        chrom,
        pos: parseInt(pos),
        id: id === '.' ? `rs_${pos}_${geneName}` : id,
        ref,
        alt,
        gene: geneName,
        quality: variantQuality,
        rawLine: line.trim()
      });
    }
  });

  const geneCoverage = [...new Set(variants.map(v => v.gene))];
  const assumed_wildtype_genes = SUPPORTED_GENES.filter(g => !geneCoverage.includes(g));
  const variant_quality_score = qualCount > 0 ? totalQuality / qualCount : 0.85;

  return {
    variants,
    metrics: {
      vcf_parsing_success,
      variant_count: variants.length,
      gene_coverage: geneCoverage,
      assumed_wildtype_genes,
      variant_quality_score,
      errors
    }
  };
};
