
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
  CheckCircle2, 
  TriangleAlert, 
  OctagonX, 
  CircleHelp, 
  Sparkles, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp,
  FlaskConical,
  Activity,
  Dna,
  ShieldCheck,
  Zap,
  ShieldAlert,
  Download,
  Copy,
  Check,
  ChevronRight
} from 'lucide-react';
import { PharmaGuardResult, RiskLabel, Severity, Phenotype } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ResultDashboardProps {
  results: PharmaGuardResult[];
  viewMode: 'clinician' | 'patient';
}

const PHENOTYPE_MAP: Record<string, string> = {
  [Phenotype.PM]: "Slow metabolizer",
  [Phenotype.IM]: "Reduced metabolizer",
  [Phenotype.NM]: "Normal metabolizer",
  [Phenotype.RM]: "Fast metabolizer",
  [Phenotype.URM]: "Ultra-fast metabolizer",
  [Phenotype.UNKNOWN]: "Unknown Metabolism"
};

const CPIC_LINKS: Record<string, string> = {
  CODEINE:      'https://cpicpgx.org/guidelines/guideline-for-codeine-and-cyp2d6/',
  WARFARIN:     'https://cpicpgx.org/guidelines/guideline-for-warfarin-and-cyp2c9-and-vkorc1/',
  CLOPIDOGREL:  'https://cpicpgx.org/guidelines/guideline-for-clopidogrel-and-cyp2c19/',
  SIMVASTATIN:  'https://cpicpgx.org/guidelines/guideline-for-statins-and-slco1b1/',
  AZATHIOPRINE: 'https://cpicpgx.org/guidelines/guideline-for-thiopurines-and-tpmt/',
  FLUOROURACIL: 'https://cpicpgx.org/guidelines/guideline-for-fluoropyrimidines-and-dpyd/',
};

const RiskBadgeIcon = ({ level, size = 16, className = "" }: { level: RiskLabel, size?: number, className?: string }) => {
  const iconProps = { size, className };
  switch (level) {
    case RiskLabel.SAFE: return <CheckCircle2 {...iconProps} className={cn("text-emerald-500", className)} />;
    case RiskLabel.ADJUST: return <TriangleAlert {...iconProps} className={cn("text-amber-500", className)} />;
    case RiskLabel.TOXIC: return <ShieldAlert {...iconProps} className={cn("text-red-500", className)} />;
    case RiskLabel.INEFFECTIVE: return <OctagonX {...iconProps} className={cn("text-orange-500", className)} />;
    default: return <CircleHelp {...iconProps} className={cn("text-gray-400", className)} />;
  }
};

const StatusBadge = ({ label }: { label: RiskLabel }) => {
  const styles = {
    [RiskLabel.SAFE]: "text-emerald-600 bg-emerald-50 border-emerald-100",
    [RiskLabel.ADJUST]: "text-amber-600 bg-amber-50 border-amber-100",
    [RiskLabel.TOXIC]: "text-red-600 bg-red-50 border-red-100",
    [RiskLabel.INEFFECTIVE]: "text-orange-600 bg-orange-50 border-orange-100",
    [RiskLabel.UNKNOWN]: "text-gray-600 bg-gray-50 border-gray-100",
  }[label] || "text-gray-600 bg-gray-50 border-gray-100";

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider", styles)}>
      <RiskBadgeIcon level={label} size={12} />
      {label}
    </span>
  );
};

const MetabolicTimeline: React.FC<{ res: PharmaGuardResult }> = ({ res }) => {
  const pgProfile = res.pharmacogenomic_profile;
  const riskLabel = res.risk_assessment.risk_label;
  const prefersReduced = useReducedMotion();

  const steps = [
    { label: "Gene ID", value: pgProfile.primary_gene, Icon: Dna, isAffected: false },
    { label: "Sequence", value: pgProfile.detected_variants[0]?.rsid || "Wild-type", Icon: Activity, isAffected: pgProfile.detected_variants.length > 0 },
    { label: "Phenotype", value: pgProfile.phenotype, Icon: Zap, isAffected: pgProfile.phenotype !== Phenotype.NM },
    { label: "Risk Class", value: riskLabel, Icon: ShieldCheck, isAffected: riskLabel !== RiskLabel.SAFE },
  ];

  return (
    <div className="mt-8 space-y-4">
      <h5 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Metabolic Logic Path</h5>
      <div className="flex items-center gap-1">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5 relative z-10">
              <div className={cn(
                'w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors',
                step.isAffected ? 'border-brand-blue bg-white text-brand-blue shadow-glow' : 'border-gray-200 bg-gray-50 text-gray-400'
              )}>
                <step.Icon size={16} strokeWidth={2} />
              </div>
              <span className="text-[9px] text-gray-500 font-bold uppercase text-center max-w-[60px] leading-tight">
                {step.label}
              </span>
              <span className="text-[9px] font-mono text-gray-800 font-bold">
                {step.value}
              </span>
            </div>

            {index < steps.length - 1 && (
              <div className="flex items-center mx-1">
                <div className={cn(
                  'h-[2px] w-8 md:w-12 transition-all',
                  step.isAffected || steps[index + 1].isAffected ? 'bg-brand-blue/60' : 'bg-gray-200'
                )} />
                <ChevronRight size={12} className={cn(
                  'shrink-0 -ml-1',
                  step.isAffected || steps[index + 1].isAffected ? 'text-brand-blue/60' : 'text-gray-200'
                )} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const Accordion: React.FC<{ title: string, icon: any, children: React.ReactNode }> = ({ title, icon: Icon, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const prefersReduced = useReducedMotion();
  return (
    <div className="border-t border-gray-100">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between py-4 transition-colors hover:bg-gray-50/50">
        <div className="flex items-center gap-3">
          <Icon size={14} className="text-gray-400" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">{title}</span>
        </div>
        {isOpen ? <ChevronDown size={14} className="rotate-180" /> : <ChevronDown size={14} />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={prefersReduced ? { opacity: 1, height: 'auto' } : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={prefersReduced ? { opacity: 1, height: 'auto' } : { opacity: 0, height: 0 }}
            transition={prefersReduced ? { duration: 0 } : { duration: 0.3 }}
            className="overflow-hidden pb-4"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ResultDashboard = ({ results, viewMode }: ResultDashboardProps) => {
  const [activeDrugId, setActiveDrugId] = useState(results[0].drug);
  const [copied, setCopied] = useState(false);
  const prefersReduced = useReducedMotion();

  const activeResult = useMemo(() => 
    results.find(r => r.drug === activeDrugId) || results[0]
  , [results, activeDrugId]);

  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pharmaguard-report-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    const fullText = `PharmaGuard AI Clinical Report\nGenerated: ${new Date().toLocaleString()}\n⚠️ AI-generated. Requires clinician review.\n\n` +
      results.map(r => `${r.drug}: ${r.risk_assessment.risk_label}\nAction: ${r.clinical_recommendation.action}`).join('\n\n');

    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement('textarea');
      el.value = fullText;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative pb-24">
      <div className="flex flex-col lg:flex-row gap-0 min-h-[600px] border border-gray-200 rounded-[32px] overflow-hidden bg-white shadow-glass">
        <aside className="w-full lg:w-[280px] bg-gray-50/50 border-r border-gray-200 flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">Precision Score</p>
            <div className="text-4xl font-black text-gray-900 font-display">
              {(activeResult.quality_metrics.data_completeness_score * 100).toFixed(0)}%
            </div>
          </div>
          <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
            {results.map((res) => (
              <button
                key={res.drug}
                onClick={() => setActiveDrugId(res.drug)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all",
                  activeDrugId === res.drug ? "bg-white shadow-sm ring-1 ring-gray-200" : "text-gray-400 hover:bg-white/50"
                )}
              >
                <div className="text-left">
                  <p className="text-xs font-bold text-gray-900">{res.drug}</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">{res.pharmacogenomic_profile.primary_gene}</p>
                </div>
                <RiskBadgeIcon level={res.risk_assessment.risk_label} size={14} />
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 flex flex-col min-h-0 bg-white">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <StatusBadge label={activeResult.risk_assessment.risk_label} />
            <div className="flex items-center gap-2">
              <button onClick={handleCopy} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-[10px] font-bold uppercase hover:bg-gray-50 transition-colors">
                {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button onClick={handleDownloadJSON} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-[10px] font-bold uppercase hover:bg-gray-50 transition-colors">
                <Download size={12} /> JSON
              </button>
            </div>
          </div>

          <div className="flex-1 p-8 lg:p-12 overflow-y-auto">
            <div className="max-w-3xl">
              <h1 className="text-5xl font-black text-gray-900 mb-2 font-display">{activeResult.drug}</h1>
              <p className="text-lg text-gray-500 font-medium mb-8">
                {viewMode === 'clinician' ? 'Genomic Profile: ' : 'Metabolic Type: '}
                <span className="text-gray-900">
                  {viewMode === 'clinician' ? activeResult.pharmacogenomic_profile.diplotype : PHENOTYPE_MAP[activeResult.pharmacogenomic_profile.phenotype]}
                </span>
              </p>

              <div className="bg-gray-50 rounded-[24px] p-6 mb-10 border border-gray-100 relative overflow-hidden group">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Clinical Recommendation</h4>
                  <a href={CPIC_LINKS[activeResult.drug]} target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline text-[10px] font-bold flex items-center gap-1">
                    <ExternalLink size={10} /> CPIC Level 1A
                  </a>
                </div>
                <p className="text-xl font-bold text-gray-900 leading-relaxed">
                  {activeResult.clinical_recommendation.action}
                </p>
              </div>

              <div className="space-y-12">
                <div>
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
                    <Sparkles size={13} className="text-brand-blue shrink-0" />
                    <span className="text-[10px] font-mono text-gray-500 tracking-widest uppercase">
                      AI-Generated · PharmaGuard v1.0 · Requires Clinician Review
                    </span>
                  </div>
                  <p className="text-gray-700 leading-relaxed text-lg mb-6">
                    {activeResult.llm_generated_explanation.summary}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                      <p className="text-xs font-bold text-brand-blue uppercase tracking-widest mb-1">Mechanism</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{activeResult.llm_generated_explanation.mechanism}</p>
                    </div>
                    <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                      <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">Impact</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{activeResult.llm_generated_explanation.variant_impact}</p>
                    </div>
                  </div>
                </div>

                <Accordion title="Genomic Loci & Sequence Data" icon={Dna}>
                  <div className="space-y-3">
                    {activeResult.pharmacogenomic_profile.detected_variants.map((v, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 font-mono text-[11px]">
                        <div className="flex items-center gap-3">
                          <span className="text-gray-900 font-bold">{v.rsid}</span>
                          <span className="text-gray-400 uppercase">{v.zygosity}</span>
                        </div>
                        <span className="text-brand-blue font-bold">{v.star_allele}</span>
                      </div>
                    ))}
                  </div>
                </Accordion>

                <MetabolicTimeline res={activeResult} />
              </div>
            </div>
          </div>
        </main>
      </div>

      <footer
        role="contentinfo"
        aria-label="Medical disclaimer"
        className="fixed bottom-0 left-0 right-0 z-50 bg-[#0F1117]/95 backdrop-blur-sm border-t border-white/10 px-6 py-3"
      >
        <p className="text-[11px] text-gray-400 text-center leading-relaxed max-w-4xl mx-auto">
          ⚕️ <strong className="text-gray-200">PharmaGuard AI is a clinical decision support tool</strong> — not a substitute for professional medical judgment. All AI-generated recommendations require clinician review before patient application. For investigational use only.
        </p>
      </footer>
    </div>
  );
};

export default ResultDashboard;
