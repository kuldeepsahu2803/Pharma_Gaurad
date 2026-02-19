import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ShieldAlert, Info, Microscope, Search, Check, AlertCircle } from 'lucide-react';
import Layout from './components/Layout';
import VCFUpload from './components/VCFUpload';
import DrugSelector from './components/DrugSelector';
import ResultDashboard from './components/ResultDashboard';
import { PharmaGuardResult, Phenotype } from './types';
import { parseVCF } from './services/vcfParser';
import { getPhenotypeForGene, getDiplotypeForGene } from './services/phenotypeEngine';
import { getRecommendation } from './services/ruleEngine';
import { generateExplanations, buildFallbackExplanation } from './services/geminiService';
import { DRUG_GENE_MAP, SUPPORTED_DRUGS } from './constants';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper utility for merging tailwind classes safely
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type AnalysisPhase = 'idle' | 'parsing' | 'mapping' | 'reasoning' | 'complete' | 'error';
type ViewMode = 'clinician' | 'patient';

const PrivacyModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#1A1D27] border border-[#2E3147] rounded-3xl p-10 max-w-lg w-full shadow-[0_0_50px_rgba(0,0,0,0.5)]" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-[#4F8EF7]/10 text-[#4F8EF7] rounded-2xl flex items-center justify-center border border-[#4F8EF7]/20">
             <ShieldAlert size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-[#F0F2F8] tracking-tight uppercase">Privacy Architecture</h3>
            <p className="text-[10px] text-[#8B90A7] font-mono tracking-widest mt-0.5 uppercase">Security & Sovereignty Protocol</p>
          </div>
        </div>
        
        <div className="space-y-6 mb-10">
          {[
            { label: "Local-First Parsing", desc: "Genomic sequence data is processed locally in-browser. Raw DNA strings never traverse the network." },
            { label: "Summarized Inference", desc: "Only calculated phenotypes are transmitted for interpretation. No raw variants are shared with external models." },
            { label: "Identity Obfuscation", desc: "Internal IDs (e.g., PAT_RIFT_...) ensure no personally identifiable information (PII) is associated with analysis calls." }
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="w-6 h-6 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center shrink-0 mt-0.5">
                <Check size={12} className="text-[#22C55E]" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#F0F2F8]">{item.label}</p>
                <p className="text-[13px] text-[#8B90A7] leading-relaxed mt-1">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={onClose}
          className="w-full py-4 bg-[#4F8EF7] hover:bg-[#4F8EF7]/90 text-white rounded-xl font-black uppercase tracking-widest transition-all active:scale-[0.98]"
        >
          Acknowledge Protocol
        </button>
      </motion.div>
    </div>
  );
};

const ProcessingHUD: React.FC<{ phase: AnalysisPhase }> = ({ phase }) => {
  const steps = [
    { id: 'parsing', label: 'VCF Normalization' },
    { id: 'mapping', label: 'Phenotype Alignment' },
    { id: 'reasoning', label: 'AI Synthesis' },
  ];

  const currentIdx = steps.findIndex(s => s.id === phase);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="flex flex-col items-center gap-10 p-16 bg-[#1A1D27] rounded-[40px] border border-[#2E3147] shadow-2xl"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-3xl bg-[#4F8EF7]/10 border border-[#4F8EF7]/20 flex items-center justify-center text-[#4F8EF7] mb-2">
          <Microscope size={32} className="animate-pulse" />
        </div>
        <h2 className="text-sm font-black text-[#8B90A7] uppercase tracking-[0.3em]">Analysis Pipeline Active</h2>
      </div>

      <div className="flex items-center justify-center gap-6 w-full max-w-md">
        {steps.map((step, idx) => {
          const isComplete = idx < currentIdx || phase === 'complete';
          const isCurrent = step.id === phase;

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                  isComplete ? "bg-[#22C55E] text-white" : 
                  isCurrent ? "bg-[#4F8EF7] text-white shadow-[0_0_20px_rgba(79,142,247,0.4)]" : 
                  "bg-[#222533] text-[#8B90A7] border border-[#2E3147]"
                )}>
                  {isComplete ? <Check size={20} strokeWidth={3} /> : <span className="text-sm font-black">{idx + 1}</span>}
                </div>
                <span className={cn(
                  "text-[9px] font-black uppercase tracking-widest text-center w-24 leading-tight",
                  isCurrent ? "text-[#4F8EF7]" : isComplete ? "text-[#22C55E]" : "text-[#8B90A7]"
                )}>
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className={cn("h-[2px] w-8 rounded-full transition-all duration-700", idx < currentIdx ? "bg-[#22C55E]" : "bg-[#2E3147]")}></div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </motion.div>
  );
};

const ActionHeader: React.FC<{ 
  results: PharmaGuardResult[]; 
  onReset: () => void; 
  onShowPrivacy: () => void;
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;
}> = ({ results, onReset, onShowPrivacy, viewMode, setViewMode }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-10 border-b border-[#2E3147] mb-10">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-[32px] font-black text-[#F0F2F8] tracking-tight leading-none uppercase">Clinical Diagnostic Report</h2>
          <div className="flex items-center gap-4 mt-3">
            <span className="font-mono text-[11px] bg-[#222533] text-[#8B90A7] px-3 py-1 rounded border border-[#2E3147] tracking-widest">
              ID: {results[0].patient_id}
            </span>
            <span className="text-[#8B90A7] text-xs font-bold uppercase tracking-widest">{new Date(results[0].timestamp).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex bg-[#1A1D27] p-1 rounded-xl border border-[#2E3147]">
          <button 
            onClick={() => setViewMode('clinician')}
            className={cn(
              "px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
              viewMode === 'clinician' ? "bg-[#4F8EF7] text-white shadow-lg shadow-[#4F8EF7]/20" : "text-[#8B90A7] hover:text-[#F0F2F8]"
            )}
          >
            Clinician
          </button>
          <button 
            onClick={() => setViewMode('patient')}
            className={cn(
              "px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
              viewMode === 'patient' ? "bg-[#4F8EF7] text-white shadow-lg shadow-[#4F8EF7]/20" : "text-[#8B90A7] hover:text-[#F0F2F8]"
            )}
          >
            Patient
          </button>
        </div>
        <button 
          onClick={onReset}
          className="px-5 py-2 text-[10px] font-black uppercase tracking-widest text-[#EF4444] hover:bg-red-500/10 rounded-xl transition-all"
        >
          Reset Analysis
        </button>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [selectedDrugs, setSelectedDrugs] = useState<string[]>([]);
  const [phase, setPhase] = useState<AnalysisPhase>('idle');
  const [results, setResults] = useState<PharmaGuardResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('clinician');
  const [drugSearch, setDrugSearch] = useState('');
  const shouldReduceMotion = useReducedMotion();

  const filteredDrugs = useMemo(() => 
    SUPPORTED_DRUGS.filter(d => d.toLowerCase().includes(drugSearch.toLowerCase()))
  , [drugSearch]);

  const handleAnalyze = async () => {
    if (!file || selectedDrugs.length === 0) {
      setError("Analysis protocol requires both a VCF sequence and selected target drugs.");
      return;
    }

    setPhase('parsing');
    setError(null);

    try {
      const text = await file.text();
      const { variants, metrics } = parseVCF(text);
      
      setPhase('mapping');
      const timestamp = new Date().toISOString();
      const patientId = `PAT_RIFT_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      const drugResults: PharmaGuardResult[] = selectedDrugs.map(drug => {
        const primaryGene = DRUG_GENE_MAP[drug] || 'Unknown';
        const phenoResult = getPhenotypeForGene(primaryGene, variants);
        const phenotype = phenoResult.phenotype;
        const diplotype = getDiplotypeForGene(primaryGene, variants);
        const recData = getRecommendation(drug, phenotype, phenoResult.confidence);

        return {
          patient_id: patientId,
          drug: drug,
          timestamp: timestamp,
          risk_assessment: {
            risk_label: recData.risk_label,
            confidence_score: recData.confidence_score,
            severity: recData.severity,
          },
          pharmacogenomic_profile: {
            primary_gene: primaryGene,
            diplotype: diplotype,
            phenotype: phenotype as Phenotype,
            assumed_wildtype: phenoResult.assumed_wildtype,
            confidence_note: phenoResult.confidence_note,
            confidence: phenoResult.confidence,
            detected_variants: variants
              .filter(v => v.gene === primaryGene)
              .map(v => ({ 
                rsid: v.id, 
                is_causal: phenoResult.causalVariantIds.includes(v.id),
                rawLine: v.rawLine
              })),
          },
          clinical_recommendation: {
            summary: recData.recommendation_text,
          },
          llm_generated_explanation: { 
            summary: "Generating structured reasoning via Gemini Flash-3...",
            clinical_caveats: "Pending validation."
          },
          quality_metrics: metrics
        };
      });

      setPhase('reasoning');
      const explanations = await generateExplanations(drugResults);
      
      const finalResults = drugResults.map(res => ({
        ...res,
        llm_generated_explanation: explanations[res.drug] || buildFallbackExplanation(
          res.drug,
          res.pharmacogenomic_profile.primary_gene,
          res.pharmacogenomic_profile.phenotype,
          res.risk_assessment.risk_label
        )
      }));

      setResults(finalResults);
      setPhase('complete');
    } catch (err: any) {
      console.error(err);
      setError("Sequence mapping failed. Ensure VCF headers follow v4.2 standards.");
      setPhase('error');
    }
  };

  const handleReset = useCallback(() => {
    setResults(null);
    setFile(null);
    setSelectedDrugs([]);
    setPhase('idle');
  }, []);

  const isAnalyzing = phase !== 'idle' && phase !== 'complete' && phase !== 'error';

  return (
    <Layout>
      <AnimatePresence>
        {showPrivacy && <PrivacyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />}
      </AnimatePresence>
      
      <div className="max-w-6xl mx-auto py-12 px-6 pb-24">
        <AnimatePresence mode="wait">
          {!results ? (
            <motion.div 
              key="onboarding"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="max-w-3xl mx-auto space-y-12"
            >
              <div className="text-center space-y-4">
                <h1 className="text-5xl font-black text-[#F0F2F8] tracking-tighter uppercase leading-none">
                  Precision <span className="text-[#4F8EF7]">Guard</span>
                </h1>
                <p className="text-[#8B90A7] text-lg max-w-xl mx-auto leading-relaxed">
                  Advanced pharmacogenomic risk synthesis. Transform raw sequence data into actionable clinical insights.
                </p>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-5 bg-red-950/30 border border-red-800 text-red-400 rounded-2xl text-sm font-bold flex items-center gap-4 overflow-hidden"
                  >
                    <AlertCircle size={20} />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {isAnalyzing ? (
                  <ProcessingHUD phase={phase} />
                ) : (
                  <div className="space-y-8">
                    <section>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-[#222533] border border-[#2E3147] flex items-center justify-center text-[#4F8EF7]">
                          <Search size={14} />
                        </div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-[#8B90A7]">Sequence Input</h3>
                      </div>
                      <VCFUpload onFileSelect={setFile} onError={setError} />
                    </section>

                    <section>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#222533] border border-[#2E3147] flex items-center justify-center text-[#4F8EF7]">
                            <Microscope size={14} />
                          </div>
                          <h3 className="text-sm font-bold uppercase tracking-widest text-[#8B90A7]">Target Drug Panel</h3>
                        </div>
                        <div className="flex items-center gap-2 bg-[#1A1D27] px-3 py-1.5 rounded-lg border border-[#2E3147]">
                          <Search size={12} className="text-[#8B90A7]" />
                          <input 
                            type="text" 
                            placeholder="Search..."
                            className="bg-transparent text-[10px] font-bold outline-none text-[#F0F2F8] uppercase tracking-wider w-24"
                            value={drugSearch}
                            onChange={(e) => setDrugSearch(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {filteredDrugs.map(drug => {
                          const isSelected = selectedDrugs.includes(drug);
                          return (
                            <motion.button
                              whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                              key={drug}
                              onClick={() => {
                                setSelectedDrugs(prev => prev.includes(drug) ? prev.filter(d => d !== drug) : [...prev, drug]);
                              }}
                              className={cn(
                                "flex items-center justify-between px-5 py-4 rounded-2xl border-2 transition-all font-black text-[11px] uppercase tracking-wider group",
                                isSelected 
                                  ? "bg-[#4F8EF7]/10 border-[#4F8EF7] text-[#4F8EF7]" 
                                  : "bg-[#1A1D27] border-[#2E3147] text-[#8B90A7] hover:border-[#F0F2F8] hover:text-[#F0F2F8]"
                              )}
                            >
                              {drug}
                              {isSelected ? <Check size={14} /> : <div className="w-3.5 h-3.5 rounded-full border border-[#2E3147] group-hover:border-[#F0F2F8]" />}
                            </motion.button>
                          );
                        })}
                      </div>
                    </section>

                    <div className="relative group">
                      <motion.button
                        whileHover={shouldReduceMotion ? {} : { scale: 1.01 }}
                        whileTap={shouldReduceMotion ? {} : { scale: 0.99 }}
                        onClick={handleAnalyze}
                        disabled={!file || selectedDrugs.length === 0}
                        className={cn(
                          "w-full py-6 rounded-3xl font-black text-lg uppercase tracking-[0.2em] shadow-2xl transition-all transform",
                          "bg-[#4F8EF7] text-white hover:bg-[#4F8EF7]/90 shadow-[#4F8EF7]/20",
                          "disabled:bg-[#222533] disabled:text-[#8B90A7] disabled:cursor-not-allowed disabled:border-[#2E3147]"
                        )}
                      >
                        Initialize Analysis
                      </motion.button>
                      {!file || selectedDrugs.length === 0 ? (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 px-4 py-2 bg-[#222533] border border-[#2E3147] text-[10px] text-[#8B90A7] font-bold uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                           Sequence Upload & Drug Selection Required
                        </div>
                      ) : null}
                    </div>

                    <button 
                      onClick={() => setShowPrivacy(true)}
                      className="w-full flex items-center justify-center gap-2 text-[10px] font-bold text-[#8B90A7] hover:text-[#F0F2F8] transition-colors uppercase tracking-[0.2em]"
                    >
                      <ShieldAlert size={12} /> Privacy & Compliance Protocols
                    </button>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="space-y-4"
            >
              <ActionHeader 
                results={results} 
                onReset={handleReset} 
                onShowPrivacy={() => setShowPrivacy(true)}
                viewMode={viewMode}
                setViewMode={setViewMode}
              />
              <ResultDashboard results={results} viewMode={viewMode} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default App;