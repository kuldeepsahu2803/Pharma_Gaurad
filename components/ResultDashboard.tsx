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
  Zap
} from 'lucide-react';
import { PharmaGuardResult, RiskLabel, Severity, Phenotype, DetectedVariant } from '../types';
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

const RiskBadgeIcon = ({ level, size = 16, className = "", strokeWidth }: { level: RiskLabel, size?: number, className?: string, strokeWidth?: number }) => {
  const shouldReduceMotion = useReducedMotion();
  
  const variants = {
    initial: shouldReduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    transition: { type: "spring", stiffness: 400, damping: 25, delay: 0.1 }
  };

  const iconProps = { size, strokeWidth, className };

  return (
    <motion.div {...variants} className={className}>
      {(() => {
        switch (level) {
          case RiskLabel.SAFE: return <CheckCircle2 {...iconProps} className={cn("text-[#22C55E]", className)} />;
          case RiskLabel.ADJUST: return <TriangleAlert {...iconProps} className={cn("text-[#F59E0B]", className)} />;
          case RiskLabel.TOXIC:
          case RiskLabel.INEFFECTIVE: return <OctagonX {...iconProps} className={cn("text-[#EF4444]", className)} />;
          default: return <CircleHelp {...iconProps} className={cn("text-[#6B7280]", className)} />;
        }
      })()}
    </motion.div>
  );
};

const StatusBadge = ({ label }: { label: RiskLabel }) => {
  const styles = {
    [RiskLabel.SAFE]: "text-[#22C55E] bg-green-950/40 border-green-800",
    [RiskLabel.ADJUST]: "text-[#F59E0B] bg-amber-950/40 border-amber-800",
    [RiskLabel.TOXIC]: "text-[#EF4444] bg-red-950/40 border-red-800",
    [RiskLabel.INEFFECTIVE]: "text-[#EF4444] bg-red-950/40 border-red-800",
    [RiskLabel.UNKNOWN]: "text-[#6B7280] bg-gray-900/40 border-gray-700",
  }[label] || "text-[#6B7280] bg-gray-900/40 border-gray-700";

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider", styles)}>
      <RiskBadgeIcon level={label} size={12} strokeWidth={2.5} />
      {label}
    </span>
  );
};

const MetabolicTimeline: React.FC<{ res: PharmaGuardResult }> = ({ res }) => {
  const pgProfile = res.pharmacogenomic_profile;
  const risk = res.risk_assessment;
  const causalVariant = pgProfile.detected_variants.find(v => v.is_causal);
  const shouldReduceMotion = useReducedMotion();

  const steps = [
    { 
      title: "Gene Identification", 
      value: pgProfile.primary_gene, 
      desc: "Target enzyme isolation successful",
      Icon: FlaskConical 
    },
    { 
      title: "Sequence Analysis", 
      value: causalVariant?.rsid || "Polymorphism Analysis", 
      desc: causalVariant ? "Functional variant identified" : "Wild-type consensus mapped",
      variant: causalVariant?.rsid,
      isAffected: !!causalVariant,
      Icon: Activity 
    },
    { 
      title: "Phenotype Translation", 
      value: `${pgProfile.diplotype} → ${pgProfile.phenotype}`, 
      desc: "Metabolic rate classification",
      Icon: Zap 
    },
    { 
      title: "Protocol Match", 
      value: risk.risk_label, 
      desc: "CPIC Guideline v4.2 alignment",
      isAffected: risk.risk_label !== RiskLabel.SAFE,
      Icon: ShieldCheck 
    },
  ];

  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.15
      }
    }
  };

  const itemVariants = {
    initial: { opacity: 0, x: -10 },
    animate: { opacity: 1, x: 0 },
  };

  return (
    <div className="mt-8 relative">
      <div className="flex items-center gap-2 mb-6">
        <Activity size={12} className="text-[#8B90A7]" />
        <h5 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8B90A7]">Metabolic Reasoning Path</h5>
      </div>
      
      <motion.div 
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="space-y-0 relative"
      >
        {steps.map((step, i) => (
          <motion.div 
            key={i} 
            variants={itemVariants}
            className="flex items-start gap-6 relative"
          >
            {/* Connector line */}
            {i < steps.length - 1 && (
              <motion.div 
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: i * 0.15 + 0.2, duration: 0.3 }}
                className="absolute left-[19px] top-[38px] w-[2px] h-[calc(100%+8px)] bg-[#2E3147] origin-top" 
              />
            )}

            {/* Node */}
            <div className={cn(
              "w-10 h-10 shrink-0 rounded-full border-2 flex items-center justify-center z-10 transition-colors",
              "bg-[#222533]",
              step.isAffected ? "border-[#EF4444] shadow-[0_0_15px_rgba(239,68,68,0.2)]" : "border-[#2E3147]"
            )}>
              <step.Icon size={16} className={step.isAffected ? "text-[#EF4444]" : "text-[#8B90A7]"} />
            </div>

            {/* Content */}
            <div className="pb-8">
              <p className="text-[10px] font-bold text-[#8B90A7] uppercase tracking-wider">{step.title}</p>
              <p className="text-sm font-bold text-[#F0F2F8] mt-0.5">{step.value}</p>
              <p className="text-xs text-[#8B90A7] mt-0.5">{step.desc}</p>
              {step.variant && (
                <span className="mt-1.5 inline-block font-mono text-[11px] bg-[#222533] border border-[#2E3147] px-2 py-0.5 rounded text-[#F59E0B]">
                  {step.variant}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

const Accordion: React.FC<{ 
  title: string, 
  icon: React.ReactNode,
  children: React.ReactNode 
}> = ({ title, icon, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-t border-[#2E3147] first:border-t-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 group transition-colors hover:bg-[#222533]/50 px-6"
      >
        <div className="flex items-center gap-3">
          <span className="text-[#8B90A7] group-hover:text-[#4F8EF7] transition-colors">{icon}</span>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#8B90A7]">{title}</span>
        </div>
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden bg-[#0F1117]/50"
          >
            <div className="p-6 pt-0">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DrugResultCard: React.FC<{ 
  res: PharmaGuardResult; 
  viewMode: 'clinician' | 'patient';
  highlightedRsid: string | null;
  onHoverRsid: (rsid: string | null) => void;
}> = ({ res, viewMode, highlightedRsid, onHoverRsid }) => {
  const risk = res.risk_assessment;
  const aiExp = res.llm_generated_explanation;
  const pgProfile = res.pharmacogenomic_profile;

  const severityStyles = {
    [Severity.CRITICAL]: "bg-[#EF4444] text-white",
    [Severity.HIGH]: "bg-red-600 text-white",
    [Severity.MODERATE]: "bg-[#F59E0B] text-black",
    [Severity.LOW]: "bg-[#22C55E] text-white",
    [Severity.NONE]: "bg-[#8B90A7] text-white",
  }[risk.severity] || "bg-[#8B90A7]";

  return (
    <div className={cn(
      "relative bg-[#1A1D27] rounded-xl border border-[#2E3147] overflow-hidden shadow-2xl transition-all",
      "before:absolute before:left-0 before:top-6 before:bottom-6 before:w-[4px] before:rounded-full before:z-10",
      risk.risk_label === RiskLabel.SAFE && "before:bg-[#22C55E]",
      (risk.risk_label === RiskLabel.TOXIC || risk.risk_label === RiskLabel.INEFFECTIVE) && "before:bg-[#EF4444]",
      risk.risk_label === RiskLabel.ADJUST && "before:bg-[#F59E0B]",
      risk.risk_label === RiskLabel.UNKNOWN && "before:bg-[#6B7280]"
    )}>
      {/* CARD HEADER */}
      <div className="p-8 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <StatusBadge label={risk.risk_label} />
          <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight", severityStyles)}>
            {risk.severity} Severity
          </span>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h3 className="text-[28px] font-black tracking-tight leading-none text-[#F0F2F8]">{res.drug}</h3>
            <p className="text-sm font-bold text-[#8B90A7] mt-2 flex items-center gap-2">
              <span className="font-mono text-[12px] bg-[#222533] px-2 py-0.5 rounded border border-[#2E3147]">
                {pgProfile.primary_gene}
              </span>
              Interaction Profile
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8B90A7]">Genetic Phenotype</p>
              <p className="text-base font-bold text-[#F0F2F8]">
                {viewMode === 'clinician' ? pgProfile.phenotype : PHENOTYPE_MAP[pgProfile.phenotype] || pgProfile.phenotype}
              </p>
            </div>
            <div className="w-[1px] h-10 bg-[#2E3147]" />
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8B90A7]">Confidence</p>
              <p className="text-base font-mono font-bold text-[#4F8EF7]">{(risk.confidence_score * 100).toFixed(0)}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 pb-8">
        {/* RECOMMENDATION BOX */}
        <div className="bg-[#222533] border border-[#2E3147] rounded-xl p-6 mt-4">
          <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#8B90A7] mb-3">Clinical Management Strategy</h4>
          <p className="text-base font-semibold leading-relaxed text-[#F0F2F8]">
            {res.clinical_recommendation.summary}
          </p>
        </div>

        {/* AI REASONING PANEL */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#2E3147]">
            <Sparkles size={14} className="text-[#4F8EF7]" />
            <span className="text-[11px] font-mono text-[#8B90A7] tracking-widest uppercase">
              AI-Generated Reasoning · PharmaGuard Engine v1.0
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-sm text-[#8B90A7] leading-relaxed">
                {aiExp.summary.split(/\b(rs\d+)\b/g).map((part, i) => {
                  if (part.match(/^rs\d+$/)) {
                    return (
                      <span 
                        key={i} 
                        className={cn(
                          "font-mono text-[#4F8EF7] cursor-help border-b border-dotted border-[#4F8EF7]/40 transition-colors",
                          highlightedRsid === part && "bg-[#4F8EF7]/20 rounded px-1"
                        )}
                        onMouseEnter={() => onHoverRsid(part)}
                        onMouseLeave={() => onHoverRsid(null)}
                      >
                        {part}
                      </span>
                    );
                  }
                  return part;
                })}
              </p>
              {aiExp.mechanism && (
                <div className="bg-[#0F1117]/50 rounded-lg p-3 border border-[#2E3147]">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#8B90A7] mb-1">Molecular Mechanism</p>
                  <p className="text-[13px] italic text-[#8B90A7] leading-relaxed">{aiExp.mechanism}</p>
                </div>
              )}
            </div>

            <div className="bg-[#222533]/50 rounded-xl p-4 border border-[#2E3147]">
               <p className="text-[10px] font-bold uppercase tracking-widest text-[#8B90A7] mb-2">Clinical Caveats</p>
               {viewMode === 'clinician' ? (
                 <p className="text-[13px] text-[#EF4444]/80 italic leading-relaxed">{aiExp.clinical_caveats}</p>
               ) : (
                 <p className="text-[13px] text-[#8B90A7] italic">Detailed technical caveats are reserved for clinical review. Please consult your physician.</p>
               )}
               <div className="mt-6 pt-4 border-t border-[#2E3147] flex items-center justify-between">
                 <a href="https://cpicpgx.org/guidelines/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] font-bold text-[#4F8EF7] hover:underline uppercase tracking-widest">
                   <ExternalLink size={10} /> CPIC Guideline Level 1A
                 </a>
               </div>
            </div>
          </div>
        </div>

        {/* DETAILED VARIANTS ACCORDION */}
        <div className="mt-8 border border-[#2E3147] rounded-xl overflow-hidden bg-[#0F1117]/30">
          <Accordion title="Genomic Loci & Variant Evidence" icon={<Dna size={14} />}>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] text-[#8B90A7] uppercase tracking-widest">
                    <th className="py-2 px-3">Locus (rsID)</th>
                    <th className="py-2 px-3">Quality</th>
                    <th className="py-2 px-3 text-right">Function</th>
                  </tr>
                </thead>
                <tbody className="text-[13px] font-mono divide-y divide-[#2E3147]">
                  {pgProfile.detected_variants.map((v, i) => (
                    <tr 
                      key={i} 
                      className={cn(
                        "transition-colors duration-200",
                        highlightedRsid === v.rsid && "bg-[#4F8EF7]/10"
                      )}
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "font-bold",
                            v.is_causal ? "text-[#F59E0B]" : "text-[#F0F2F8]"
                          )}>{v.rsid}</span>
                          {v.is_causal && <Zap size={10} className="text-[#F59E0B] animate-pulse" />}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-[#8B90A7]">0.99</td>
                      <td className="py-3 px-3 text-right">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] uppercase font-bold",
                          v.is_causal ? "bg-amber-900/40 text-amber-500" : "bg-[#222533] text-[#8B90A7]"
                        )}>
                          {v.is_causal ? "Loss of Function" : "Standard"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Accordion>
          
          <Accordion title="Decision Intelligence Flow" icon={<Activity size={14} />}>
            <MetabolicTimeline res={res} />
          </Accordion>
        </div>
      </div>
    </div>
  );
};

const ResultDashboard = ({ results, viewMode }: ResultDashboardProps) => {
  const [activeDrugId, setActiveDrugId] = useState(results[0].drug);
  const [highlightedRsid, setHighlightedRsid] = useState<string | null>(null);

  const activeResult = useMemo(() => 
    results.find(r => r.drug === activeDrugId) || results[0]
  , [results, activeDrugId]);

  const priorityActions = results.filter(r => r.risk_assessment.risk_label !== RiskLabel.SAFE).length;

  return (
    <div className="flex flex-col lg:flex-row gap-0 lg:h-[calc(100vh-140px)] border border-[#2E3147] rounded-2xl overflow-hidden bg-[#0F1117] mb-20">
      {/* LEFT RAIL NAVIGATION */}
      <aside className="w-full lg:w-[320px] bg-[#1A1D27] border-b lg:border-b-0 lg:border-r border-[#2E3147] overflow-y-auto flex flex-col">
        <div className="p-6 border-b border-[#2E3147]">
          <div className="mb-6 p-4 rounded-xl bg-[#222533] border border-[#2E3147]">
            <p className="text-[10px] text-[#8B90A7] font-bold uppercase tracking-[0.2em] mb-1">Genomic Match Score</p>
            <p className="text-4xl font-black text-[#F0F2F8] font-mono">
              {(results[0].quality_metrics.variant_quality_score * 100).toFixed(1)}%
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
              <p className="text-[10px] font-bold text-[#8B90A7]">{results[0].quality_metrics.variant_count} target loci mapped</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-[#8B90A7]">
            <span>Drug Insights Panel</span>
            {priorityActions > 0 && (
              <span className="bg-[#EF4444] text-white px-2 py-0.5 rounded-full">{priorityActions} Priority</span>
            )}
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {results.map((res) => (
            <button
              key={res.drug}
              onClick={() => setActiveDrugId(res.drug)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all group",
                activeDrugId === res.drug 
                  ? "bg-[#4F8EF7]/10 text-[#4F8EF7] border border-[#4F8EF7]/30 shadow-[inset_0_0_10px_rgba(79,142,247,0.05)]" 
                  : "text-[#8B90A7] hover:bg-[#222533] hover:text-[#F0F2F8]"
              )}
            >
              <div className="flex flex-col items-start text-left">
                <span className="text-[13px] font-black uppercase tracking-tighter">{res.drug}</span>
                <span className="text-[10px] font-mono opacity-60 group-hover:opacity-100">{res.pharmacogenomic_profile.primary_gene}</span>
              </div>
              <RiskBadgeIcon level={res.risk_assessment.risk_label} size={14} />
            </button>
          ))}
        </nav>
      </aside>

      {/* DETAIL PANEL */}
      <main className="flex-1 overflow-y-auto bg-[#0F1117] p-6 lg:p-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeDrugId + viewMode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <DrugResultCard 
              res={activeResult} 
              viewMode={viewMode}
              highlightedRsid={highlightedRsid}
              onHoverRsid={setHighlightedRsid}
            />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default ResultDashboard;