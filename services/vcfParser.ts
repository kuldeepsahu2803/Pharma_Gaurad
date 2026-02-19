import { VariantRecord, QualityMetrics, DetectedVariant } from '../types';
import { SUPPORTED_GENES } from '../constants';

function extractFromInfo(info: string, key: string): string | null {
  // Enhanced regex to handle optional spaces and ensure key=value boundary
  const match = info.match(new RegExp(`(?:^|;|\\s)${key}=([^;\\s]+)`));
  return match ? match[1].split(',')[0].trim() : null;
}

function extractGeneSymbol(info: string): string | null {
  const direct = extractFromInfo(info, 'GENE') || extractFromInfo(info, 'SYMBOL');
  if (direct) return direct.toUpperCase().trim();

  const annMatch = info.match(/(?:^|;|\\s)ANN=([^;\\s]+)/i);
  if (annMatch) {
    const parts = annMatch[1].split(',')[0].split('|');
    if (parts.length > 3) return parts[3].toUpperCase().trim();
  }

  const csqMatch = info.match(/(?:^|;|\\s)CSQ=([^;\\s]+)/i);
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
  
  // Extract GT and handle potential formatting variants
  const rawGt = sampleParts[gtIndex].trim();
  
  // Standard VCF GT mapping
  if (rawGt === '0/0' || rawGt === '0|0') return 'homozygous_ref';
  if (rawGt === '1/1' || rawGt === '1|1' || rawGt === '2/2' || rawGt === '2|2') return 'homozygous_alt';
  if (rawGt === '0/1' || rawGt === '0|1' || rawGt === '1/0' || rawGt === '1|0' || rawGt === '0/2' || rawGt === '1/2') return 'heterozygous';
  if (rawGt === '1/.' || rawGt === './1' || rawGt === '1|.' || rawGt === '.|1' || rawGt === '1') return 'hemizygous';
  if (rawGt === '0/.' || rawGt === './0' || rawGt === '0|.' || rawGt === '.|0' || rawGt === '0') return 'hemizygous_ref';
  
  return 'unknown';
}

function extractDP(format: string, sample: string): number {
  if (!format || !sample) return 0;
  const formatParts = format.split(':');
  const sampleParts = sample.split(':');
  const dpIndex = formatParts.indexOf('DP');
  if (dpIndex === -1) return 0;
  const dpValue = parseInt(sampleParts[dpIndex]);
  return isNaN(dpValue) ? 0 : dpValue;
}

export const parseVCF = (content: string): { variants: VariantRecord[], metrics: QualityMetrics } => {
  // Normalize line endings and split
  const lines = content.split(/\r?\n/);
  const tempMap = new Map<string, { variant: VariantRecord, dp: number }>();
  const errors: string[] = [];
  let vcf_parsing_success = true;
  const allGeneSymbols = new Set<string>();

  if (lines.length === 0 || (lines.length === 1 && !lines[0].trim())) {
    return { variants: [], metrics: { vcf_parsing_success: false, variants_detected: 0, genes_analyzed: [], data_completeness_score: 0, errors: ["Empty file."] } };
  }

  // Header validation
  const firstHeader = lines.find(l => l.startsWith('##fileformat=VCF'));
  if (!firstHeader || !firstHeader.includes('v4.2')) {
    errors.push("Invalid VCF format. System requires VCF v4.2 headers.");
    vcf_parsing_success = false;
  }

  let totalQuality = 0;
  let qualCount = 0;

  lines.forEach((line) => {
    if (line.startsWith('#') || !line.trim()) return;

    // Strict split by TAB as per clinical requirements
    const parts = line.split('\t');
    if (parts.length < 10) return;

    const chrom = parts[0];
    const pos = parts[1];
    const id = parts[2];
    const ref = parts[3];
    const alt = parts[4];
    const qualRaw = parts[5];
    const info = parts[7];
    const format = parts[8];
    const sample = parts[9];

    const geneName = extractGeneSymbol(info) || 'Unknown';
    if (geneName !== 'Unknown') allGeneSymbols.add(geneName);

    // Extraction of primary markers
    const rsid = extractFromInfo(info, 'RS') || (id !== '.' ? id.trim() : `rs_${pos}_${geneName}`);
    const starAllele = extractFromInfo(info, 'STAR') || '*Unknown';
    const zygosity = parseZygosity(format, sample);
    const dp = extractDP(format, sample);

    // Dynamic annotation extraction for pathogenicity checks
    const cpic = extractFromInfo(info, 'CPIC');
    const clnsig = extractFromInfo(info, 'CLNSIG');

    const rawQual = parseFloat(qualRaw);
    const variantQuality = isNaN(rawQual) ? 0.85 : Math.min(rawQual / 100, 0.99);
    
    totalQuality += variantQuality;
    qualCount++;

    if (SUPPORTED_GENES.includes(geneName)) {
      const existing = tempMap.get(rsid);
      // Keep record with highest depth
      if (!existing || dp > existing.dp) {
        tempMap.set(rsid, {
          dp,
          variant: {
            chrom,
            pos: parseInt(pos),
            rsid,
            ref,
            alt,
            gene: geneName,
            star_allele: starAllele,
            zygosity,
            quality: variantQuality,
            cpic_level: cpic || undefined,
            clinical_significance: clnsig || undefined
          }
        });
      }
    }
  });

  const variants = Array.from(tempMap.values()).map(v => v.variant);
  const genesAnalyzed = Array.from(allGeneSymbols);
  const variant_quality_score = qualCount > 0 ? totalQuality / qualCount : 0.85;

  return {
    variants,
    metrics: {
      vcf_parsing_success,
      variants_detected: variants.length,
      genes_analyzed: genesAnalyzed,
      data_completeness_score: variant_quality_score,
      errors
    }
  };
};