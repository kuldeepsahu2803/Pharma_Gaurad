
import { VariantRecord, QualityMetrics, DetectedVariant } from '../types';
import { SUPPORTED_GENES } from '../constants';

function extractFromInfo(info: string, key: string): string | null {
  const match = info.match(new RegExp(`(?:^|;)${key}=([^;]+)`));
  return match ? match[1].split(',')[0].trim() : null;
}

function extractGeneSymbol(info: string): string | null {
  const direct = extractFromInfo(info, 'GENE') || extractFromInfo(info, 'SYMBOL');
  if (direct) return direct.toUpperCase();

  const annMatch = info.match(/(?:^|;)ANN=([^;]+)/i);
  if (annMatch) {
    const parts = annMatch[1].split(',')[0].split('|');
    if (parts.length > 3) return parts[3].toUpperCase().trim();
  }

  const csqMatch = info.match(/(?:^|;)CSQ=([^;]+)/i);
  if (csqMatch) {
    const parts = csqMatch[1].split(',')[0].split('|');
    if (parts.length > 3) return parts[3].toUpperCase().trim();
  }

  return null;
}

function parseZygosity(format: string, sample: string): DetectedVariant['zygosity'] {
  if (!format || !sample) return 'unknown';
  const formatParts = format.split(':');
  const sampleParts = sample.split(':');
  const gtIndex = formatParts.indexOf('GT');
  
  if (gtIndex === -1) return 'unknown';
  const gt = sampleParts[gtIndex].trim();
  
  // Precise PS1 Mapping
  if (gt === '0/0' || gt === '0|0') return 'homozygous_ref';
  if (gt === '1/1' || gt === '1|1' || gt === '2/2' || gt === '2|2') return 'homozygous_alt';
  if (gt === '0/1' || gt === '0|1' || gt === '1/0' || gt === '1|0' || gt === '1/2' || gt === '1|2') return 'heterozygous';
  if (gt === '1/.' || gt === './1' || gt === '1|.' || gt === '.|1' || gt === '1') return 'hemizygous';
  if (gt === '0/.' || gt === './0' || gt === '0|.' || gt === '.|0' || gt === '0') return 'hemizygous_ref';
  if (gt === './.' || gt === '.|.') return 'unknown';
  
  return 'unknown';
}

export const parseVCF = (content: string): { variants: VariantRecord[], metrics: QualityMetrics } => {
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const variants: VariantRecord[] = [];
  const errors: string[] = [];
  let vcf_parsing_success = true;
  const allGeneSymbols = new Set<string>();

  if (lines.length === 0 || !lines[0].trim()) {
    return { variants: [], metrics: { vcf_parsing_success: false, variants_detected: 0, genes_analyzed: [], data_completeness_score: 0, errors: ["Empty file."] } };
  }

  if (!lines[0].startsWith('##fileformat=VCFv4.2')) {
    errors.push("Invalid VCF format. System requires VCF v4.2 headers.");
    vcf_parsing_success = false;
  }

  let totalQuality = 0;
  let qualCount = 0;

  lines.forEach((line) => {
    if (line.startsWith('#') || !line.trim()) return;

    const parts = line.split('\t');
    if (parts.length < 10) return;

    const [chrom, pos, id, ref, alt, qualRaw, , info, format, sample] = parts;
    const geneName = extractGeneSymbol(info) || 'Unknown';
    if (geneName !== 'Unknown') allGeneSymbols.add(geneName);

    const rsid = extractFromInfo(info, 'RS') || (id !== '.' ? id : `rs_${pos}_${geneName}`);
    const starAllele = extractFromInfo(info, 'STAR') || '*Unknown';
    const zygosity = parseZygosity(format, sample);

    const rawQual = parseFloat(qualRaw);
    const variantQuality = isNaN(rawQual) ? 0.85 : Math.min(rawQual / 100, 0.99);
    
    totalQuality += variantQuality;
    qualCount++;

    if (SUPPORTED_GENES.includes(geneName)) {
      variants.push({
        chrom,
        pos: parseInt(pos),
        rsid,
        ref,
        alt,
        gene: geneName,
        star_allele: starAllele,
        zygosity: zygosity,
        quality: variantQuality,
      });
    }
  });

  const genesAnalyzed = Array.from(allGeneSymbols);
  const variant_quality_score = qualCount > 0 ? totalQuality / qualCount : 0.85;

  return {
    variants,
    metrics: {
      vcf_parsing_success,
      variants_detected: variants.length,
      // Fix: Use correct variable name 'genesAnalyzed' for 'genes_analyzed' property
      genes_analyzed: genesAnalyzed,
      data_completeness_score: variant_quality_score,
      errors
    }
  };
};
