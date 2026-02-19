
import React, { useState } from 'react';
import { PharmaGuardResult, RiskLabel, Severity, Phenotype, DetectedVariant } from '../types';

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
  [Phenotype.UNKNOWN]: "Could not determine"
};

const RISK_MAP: Record<string, string> = {
  [RiskLabel.TOXIC]: "⚠️ High Risk — this drug may be harmful",
  [RiskLabel.INEFFECTIVE]: "⚠️ Low Benefit — this drug may not work",
  [RiskLabel.ADJUST]: "⚡ Dose adjustment likely needed",
  [RiskLabel.SAFE]: "✓ Generally safe based on your genes",
  [RiskLabel.UNKNOWN]: "? Insufficient genetic data"
};

const WHATIF_RULES: Record<string, Record<string, Record<string, { risk_label: string; severity: string }>>> = {
  CYP2D6: {
    CODEINE: { PM: { risk_label: 'Toxic', severity: 'high' }, IM: { risk_label: 'Adjust Dosage', severity: 'moderate' }, NM: { risk_label: 'Safe', severity: 'none' }, URM: { risk_label: 'Ineffective', severity: 'moderate' } },
    WARFARIN: { NM: { risk_label: 'Safe', severity: 'none' } }, // Simple mapping for cross-check
  },
  CYP2C9: {
    WARFARIN: { PM: { risk_label: 'Adjust Dosage', severity: 'high' }, IM: { risk_label: 'Adjust Dosage', severity: 'moderate' }, NM: { risk_label: 'Safe', severity: 'none' } },
  },
  CYP2C19: {
    CLOPIDOGREL: { PM: { risk_label: 'Ineffective', severity: 'high' }, IM: { risk_label: 'Adjust Dosage', severity: 'moderate' }, NM: { risk_label: 'Safe', severity: 'none' } },
  },
  SLCO1B1: {
    SIMVASTATIN: { PM: { risk_label: 'Toxic', severity: 'high' }, IM: { risk_label: 'Adjust Dosage', severity: 'moderate' }, NM: { risk_label: 'Safe', severity: 'none' } },
  },
  TPMT: {
    AZATHIOPRINE: { PM: { risk_label: 'Toxic', severity: 'critical' }, IM: { risk_label: 'Adjust Dosage', severity: 'moderate' }, NM: { risk_label: 'Safe', severity: 'none' } },
  },
  DPYD: {
    FLUOROURACIL: { PM: { risk_label: 'Toxic', severity: 'critical' }, IM: { risk_label: 'Adjust Dosage', severity: 'high' }, NM: { risk_label: 'Safe', severity: 'none' } },
  },
};

const MetabolicTimeline: React.FC<{ res: PharmaGuardResult }> = ({ res }) => {
  const pgProfile = res.pharmacogenomic_profile;
  const risk = res.risk_assessment;
  const causalVariant = pgProfile.detected_variants.find(v => v.is_causal);

  const steps = [
    { title: "Gene Detected", value: pgProfile.primary_gene },
    causalVariant && { title: "Causal Variant Identified", value: `${causalVariant.rsid} — Evidence of functional impact` },
    { title: "Diplotype & Phenotype Assigned", value: `${pgProfile.diplotype} → ${pgProfile.phenotype}` },
    { title: "CPIC Rule Applied", value: `${pgProfile.phenotype} + ${res.drug} → ${risk.risk_label}` },
    { title: "Risk Classification", value: `${risk.risk_label} | Severity: ${risk.severity} | Confidence: ${(risk.confidence_score * 100).toFixed(0)}%` },
  ].filter(Boolean) as { title: string; value: string }[];

  return (
    <div className="mt-8 border-l-2 border-zinc-200/50 dark:border-zinc-700/50 pl-4 ml-2">
      <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Metabolic Reasoning Path</h5>
      {steps.map((step, idx) => (
        <div key={idx} className="relative mb-6 last:mb-0">
          <div className="absolute -left-6 w-3.5 h-3.5 rounded-full bg-slate-200 dark:bg-zinc-700 border-2 border-white dark:border-zinc-900 flex items-center justify-center">
            <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400">{idx + 1}</span>
          </div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{step.title}</p>
          <p className={`text-sm font-medium mt-0.5 ${idx === steps.length - 1 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-zinc-200'}`}>
            {step.value}
          </p>
        </div>
      ))}
    </div>
  );
};

const RiskSummaryTable: React.FC<{ results: PharmaGuardResult[] }> = ({ results }) => {
  const getBadgeColor = (label: RiskLabel) => {
    switch (label) {
      case RiskLabel.SAFE: return 'bg-emerald-500';
      case RiskLabel.ADJUST: return 'bg-amber-500';
      case RiskLabel.TOXIC:
      case RiskLabel.INEFFECTIVE: return 'bg-red-500';
      default: return 'bg-zinc-500';
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden mb-10 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-zinc-800/50">
            <tr>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Drug</th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Gene</th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400 text-center">Risk</th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Severity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
            {results.map((res) => (
              <tr 
                key={res.drug} 
                onClick={() => document.getElementById(`drug-${res.drug}`)?.scrollIntoView({ behavior: 'smooth' })}
                className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-zinc-100 underline decoration-dotted decoration-slate-300 underline-offset-4">{res.drug}</td>
                <td className="px-6 py-4 text-sm font-medium text-slate-500 dark:text-zinc-400 font-mono">{res.pharmacogenomic_profile.primary_gene}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase text-white ${getBadgeColor(res.risk_assessment.risk_label)}`}>
                    {res.risk_assessment.risk_label}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-zinc-400 capitalize">{res.risk_assessment.severity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AccordionSection: React.FC<{ 
  title: string, 
  isOpen: boolean, 
  onToggle: () => void, 
  children: React.ReactNode 
}> = ({ title, isOpen, onToggle, children }) => {
  return (
    <div className="border-t border-black/5 dark:border-white/5 mt-4 pt-4 overflow-hidden">
      <button 
        onClick={onToggle}
        className="flex items-center justify-between w-full text-left focus:outline-none group"
      >
        <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-500 flex items-center gap-2 group-hover:text-blue-600 transition-colors">
          <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-blue-500' : 'bg-slate-300 dark:bg-zinc-700'}`}></span>
          {title}
        </h4>
        <span className="text-slate-400 group-hover:text-blue-500 transition-all text-xs">
          {isOpen ? '▲' : '▼'}
        </span>
      </button>
      <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0 invisible'}`}>
        {isOpen && children}
      </div>
    </div>
  );
};

const VariantRow: React.FC<{ variant: DetectedVariant; viewMode: 'clinician' | 'patient' }> = ({ variant, viewMode }) => {
  const [showSource, setShowSource] = useState(false);

  return (
    <div className="mb-2 last:mb-0">
      <div className={`text-[11px] flex justify-between p-2 rounded-xl border transition-all ${variant.is_causal ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50' : 'bg-slate-50 dark:bg-zinc-800/50 border-transparent'}`}>
        <div className="flex items-center gap-2">
          {viewMode === 'clinician' ? (
            <span className="font-mono font-bold text-slate-700 dark:text-zinc-200">{variant.rsid}</span>
          ) : (
            <span className="font-bold text-slate-700 dark:text-zinc-200">Gene variation detected</span>
          )}
          {viewMode === 'clinician' && variant.rawLine && (
            <button 
              onClick={() => setShowSource(!showSource)}
              className="text-[9px] font-black text-blue-500 hover:text-blue-600 uppercase tracking-tighter"
            >
              [View Source]
            </button>
          )}
        </div>
        {variant.is_causal && (
          <span className="text-[9px] font-black text-amber-700 dark:text-amber-500 uppercase flex items-center gap-1 animate-pulse">
            <span className="w-1 h-1 bg-amber-600 rounded-full"></span>
            Causal Evidence
          </span>
        )}
      </div>
      {showSource && viewMode === 'clinician' && variant.rawLine && (
        <pre className="bg-zinc-900 border border-zinc-700 rounded p-2 font-mono text-[10px] text-zinc-300 mt-1 overflow-x-auto">
          {variant.rawLine}
        </pre>
      )}
    </div>
  );
};

const DrugResultCard: React.FC<{ res: PharmaGuardResult; viewMode: 'clinician' | 'patient' }> = ({ res, viewMode }) => {
  const [sections, setSections] = useState({
    variants: false,
    recommendation: false,
    explanation: false
  });
  const [whatIfDrug, setWhatIfDrug] = useState<string>('');

  const toggleSection = (key: keyof typeof sections) => {
    setSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const risk = res.risk_assessment;
  const aiExp = res.llm_generated_explanation;
  const pgProfile = res.pharmacogenomic_profile;

  const getRiskColor = (label: RiskLabel) => {
    switch (label) {
      case RiskLabel.TOXIC:
      case RiskLabel.INEFFECTIVE: return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400';
      case RiskLabel.ADJUST: return 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400';
      case RiskLabel.SAFE: return 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400';
      default: return 'bg-slate-50 dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-400';
    }
  };

  const getSeverityBadge = (sev: Severity) => {
    switch (sev) {
      case Severity.CRITICAL: return 'bg-red-600 text-white';
      case Severity.HIGH: return 'bg-red-500 text-white';
      case Severity.MODERATE: return 'bg-amber-500 text-white';
      case Severity.LOW: return 'bg-emerald-500 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  const whatIfResult = whatIfDrug ? WHATIF_RULES[pgProfile.primary_gene]?.[whatIfDrug]?.[pgProfile.phenotype] : null;

  return (
    <div id={`drug-${res.drug}`} className={`rounded-2xl border-2 p-6 transition-all ${getRiskColor(risk.risk_label)} shadow-sm hover:shadow-md mb-6`}>
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tight ${getSeverityBadge(risk.severity)}`}>
              {risk.severity} Severity
            </span>
            <span className="text-sm font-bold opacity-80">
              {viewMode === 'clinician' ? risk.risk_label : RISK_MAP[risk.risk_label]}
            </span>
          </div>
          <h3 className="text-3xl font-black tracking-tight dark:text-white">{res.drug}</h3>
          <p className="text-lg mt-1 font-semibold opacity-90">{pgProfile.primary_gene} Interaction</p>
        </div>
        
        <div className="flex flex-col items-end gap-3">
          <div className="bg-white/40 dark:bg-black/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-black/5 self-start md:self-auto min-w-[140px]">
            <p className="text-[10px] font-black uppercase opacity-60">Genotype Status</p>
            <p className="text-sm font-bold dark:text-zinc-200">
              {viewMode === 'clinician' ? pgProfile.phenotype : PHENOTYPE_MAP[pgProfile.phenotype]}
            </p>
          </div>
          
          {/* WHAT-IF DROPDOWN */}
          <div className="relative w-full md:w-auto">
            <select 
              className="w-full text-[10px] font-black uppercase tracking-tighter bg-white/20 hover:bg-white/40 border border-black/10 rounded-lg px-3 py-2 outline-none cursor-pointer dark:text-zinc-300"
              value={whatIfDrug}
              onChange={(e) => setWhatIfDrug(e.target.value)}
            >
              <option value="">What-if Comparison</option>
              {['CODEINE', 'WARFARIN', 'CLOPIDOGREL', 'SIMVASTATIN', 'AZATHIOPRINE', 'FLUOROURACIL']
                .filter(d => d !== res.drug)
                .map(d => <option key={d} value={d}>{d}</option>)
              }
            </select>
          </div>
        </div>
      </div>

      {whatIfResult && (
        <div className="mb-4 bg-white/30 dark:bg-black/10 rounded-xl p-3 border border-black/5 flex flex-col sm:flex-row justify-between items-center text-[11px] font-bold gap-2">
          <div className="flex items-center gap-2 opacity-60">
            <span className="uppercase">Current:</span>
            <span className="text-slate-900 dark:text-zinc-200">{res.drug} → {risk.risk_label} ({risk.severity})</span>
          </div>
          <div className="hidden sm:block text-slate-300">|</div>
          <div className="flex items-center gap-2">
            <span className="uppercase text-blue-600 dark:text-blue-400">Comparison:</span>
            <span className="text-slate-900 dark:text-zinc-100">{whatIfDrug} → {whatIfResult.risk_label} ({whatIfResult.severity})</span>
          </div>
        </div>
      )}

      {pgProfile.assumed_wildtype && (
        <div className="mb-4 bg-amber-900/10 border border-amber-500/30 text-amber-800 dark:text-amber-500 rounded-xl px-4 py-2 text-sm flex items-center gap-3 font-medium">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          {pgProfile.confidence_note}
        </div>
      )}

      {/* ACCORDION 1: DETECTED VARIANTS */}
      <AccordionSection 
        title="Detected Variants & Genomic Evidence" 
        isOpen={sections.variants} 
        onToggle={() => toggleSection('variants')}
      >
        <div className="bg-white/40 dark:bg-black/10 rounded-xl p-4 border border-black/5">
          <div className="flex justify-between items-center mb-4">
             <div>
               <p className="text-[10px] font-black uppercase opacity-60">Haplotype Identity</p>
               <p className="text-sm font-mono font-bold text-slate-700 dark:text-zinc-200">
                 {viewMode === 'clinician' ? pgProfile.diplotype : pgProfile.primary_gene + " Genetic Profile"}
               </p>
             </div>
             <div className="text-right">
               <p className="text-[10px] font-black uppercase opacity-60">Mapping Quality</p>
               <p className="text-sm font-bold text-slate-700 dark:text-zinc-200">{(pgProfile.confidence ?? 0 * 100).toFixed(1)}%</p>
             </div>
          </div>
          <div className="space-y-1">
            {pgProfile.detected_variants.length > 0 ? pgProfile.detected_variants.map((v, vIdx) => (
              <VariantRow key={vIdx} variant={v} viewMode={viewMode} />
            )) : (
              <p className="text-[11px] text-slate-400 italic">No specific target variations identified.</p>
            )}
          </div>
        </div>
      </AccordionSection>

      {/* ACCORDION 2: CLINICAL RECOMMENDATION */}
      <AccordionSection 
        title="Clinical Management Strategy" 
        isOpen={sections.recommendation} 
        onToggle={() => toggleSection('recommendation')}
      >
        <div className="bg-white/60 dark:bg-black/20 rounded-xl p-4 border border-black/5">
          <p className="text-slate-900 dark:text-zinc-100 font-bold leading-relaxed">{res.clinical_recommendation.summary}</p>
        </div>
      </AccordionSection>

      {/* ACCORDION 3: AI REASONING */}
      <AccordionSection 
        title="Predictive Reasoning & Mechanisms" 
        isOpen={sections.explanation} 
        onToggle={() => toggleSection('explanation')}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-black uppercase opacity-60 mb-1">Functional Impact Summary</p>
              <p className="text-slate-800 dark:text-zinc-200 text-sm leading-relaxed">{aiExp.summary}</p>
            </div>
            {aiExp.mechanism && (
              <div className="bg-white/30 dark:bg-black/10 rounded-lg p-3 border border-black/5">
                <p className="text-[10px] font-black uppercase opacity-60 mb-1">Molecular Pathway</p>
                <p className="text-xs italic text-slate-700 dark:text-zinc-400 leading-relaxed">{aiExp.mechanism}</p>
              </div>
            )}
          </div>
          <div className="bg-white/40 dark:bg-black/20 rounded-xl p-4 border border-black/5 flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-black uppercase opacity-60 mb-1">Clinical Caveats</p>
              {viewMode === 'clinician' ? (
                <p className="text-xs text-red-900/80 dark:text-red-400/80 leading-relaxed italic">{aiExp.clinical_caveats}</p>
              ) : (
                <p className="text-xs text-slate-500 italic">Clinical notes hidden in patient mode. Consult your healthcare provider for technical details.</p>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-black/5 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase opacity-40 font-mono">Model Score: {(risk.confidence_score * 100).toFixed(0)}%</span>
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-tighter cursor-help hover:underline">Level 1A Evidence</span>
            </div>
          </div>
        </div>
        
        {/* METABOLIC TIMELINE (TASK 4) */}
        <MetabolicTimeline res={res} />
      </AccordionSection>
    </div>
  );
};

const ResultDashboard = React.memo(({ results, viewMode }: ResultDashboardProps) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Global Precision</p>
          <p className="text-3xl font-black text-slate-900 dark:text-zinc-100 font-mono">
            {(results[0].quality_metrics.variant_quality_score * 100).toFixed(1)}%
          </p>
          <p className="text-slate-400 text-xs mt-1">Instrumental confidence avg</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Loci Identified</p>
          <p className="text-3xl font-black text-slate-900 dark:text-zinc-100 font-mono">{results[0].quality_metrics.variant_count}</p>
          <p className="text-slate-400 text-xs mt-1">Targeted pharmacogenomic sites</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Priority Actions</p>
          <p className="text-3xl font-black text-red-600 font-mono">
            {results.filter(r => r.risk_assessment.risk_label !== RiskLabel.SAFE).length}
          </p>
          <p className="text-slate-400 text-xs mt-1">Potential clinical contraindications</p>
        </div>
      </div>

      {/* SUMMARY TABLE (TASK 1) */}
      <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Executive Summary</h2>
      <RiskSummaryTable results={results} />

      <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Patient Detail Cards</h2>
      <div className="grid grid-cols-1 gap-6">
        {results.map((res, idx) => (
          <DrugResultCard key={idx} res={res} viewMode={viewMode} />
        ))}
      </div>
    </div>
  );
});

export default ResultDashboard;
