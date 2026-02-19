
import React, { useState, useCallback } from 'react';
import Layout from './components/Layout';
import VCFUpload from './components/VCFUpload';
import DrugSelector from './components/DrugSelector';
import ResultDashboard from './components/ResultDashboard';
import { PharmaGuardResult, Phenotype } from './types';
import { parseVCF } from './services/vcfParser';
import { getPhenotypeForGene, getDiplotypeForGene } from './services/phenotypeEngine';
import { getRecommendation } from './services/ruleEngine';
import { generateExplanations, buildFallbackExplanation } from './services/geminiService';
import { DRUG_GENE_MAP } from './constants';

type AnalysisPhase = 'idle' | 'parsing' | 'mapping' | 'reasoning' | 'complete' | 'error';
type ViewMode = 'clinician' | 'patient';

const PrivacyModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">Privacy Transparency</h3>
        </div>
        
        <div className="space-y-4 mb-8">
          <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-zinc-300">
            <span className="text-emerald-500 mt-1 font-bold">✓</span>
            <p>VCF file is processed locally in-browser; genomic sequences never leave your device.</p>
          </div>
          <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-zinc-300">
            <span className="text-emerald-500 mt-1 font-bold">✓</span>
            <p>Only calculated phenotype summaries are sent to the AI model for interpretation.</p>
          </div>
          <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-zinc-300">
            <span className="text-emerald-500 mt-1 font-bold">✓</span>
            <p>Patient identity is anonymized as <strong>PAT_RIFT_...</strong> across all external calls.</p>
          </div>
          <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-zinc-300">
            <span className="text-emerald-500 mt-1 font-bold">✓</span>
            <p>No raw genomic data is stored, cached, or logged by the LLM service.</p>
          </div>
        </div>

        <p className="text-[10px] text-slate-400 dark:text-zinc-500 text-center mb-6 px-4">
          For decision-support use only. This tool is not a substitute for clinical judgment or diagnostic genetic counseling.
        </p>

        <button 
          onClick={onClose}
          className="w-full py-3 bg-slate-900 dark:bg-blue-600 text-white rounded-xl font-bold hover:opacity-90 transition-all active:scale-95"
        >
          Acknowledge & Close
        </button>
      </div>
    </div>
  );
};

const ProcessingHUD: React.FC<{ phase: AnalysisPhase }> = ({ phase }) => {
  const steps = [
    { id: 'parsing', label: 'VCF Parsing' },
    { id: 'mapping', label: 'Phenotype Mapping' },
    { id: 'reasoning', label: 'AI Reasoning' },
  ];

  const currentIdx = steps.findIndex(s => s.id === phase);

  return (
    <div className="flex flex-col items-center gap-6 p-10 bg-slate-900 rounded-3xl shadow-2xl border border-slate-700 animate-in zoom-in duration-300">
      <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-widest text-xs">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
        Analysis Pipeline Active
      </div>
      <div className="flex items-center justify-center gap-4 w-full">
        {steps.map((step, idx) => {
          const isComplete = idx < currentIdx || phase === 'complete';
          const isCurrent = step.id === phase;

          return (
            <React.Fragment key={step.id}>
              <div className={`flex flex-col items-center gap-2 transition-all duration-500 ${isCurrent ? 'scale-110' : 'scale-100'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black transition-all ${
                  isComplete ? 'bg-emerald-500 text-white' : 
                  isCurrent ? 'bg-blue-600 animate-pulse text-white shadow-lg shadow-blue-500/50' : 
                  'bg-slate-800 text-slate-500'
                }`}>
                  {isComplete ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                  ) : idx + 1}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-wider ${isCurrent ? 'text-blue-400' : isComplete ? 'text-emerald-400' : 'text-slate-600'}`}>
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`h-0.5 w-12 rounded-full transition-all duration-700 ${idx < currentIdx ? 'bg-emerald-500' : 'bg-slate-800'}`}></div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

const ActionHeader: React.FC<{ 
  results: PharmaGuardResult[]; 
  onReset: () => void; 
  onShowPrivacy: () => void;
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;
}> = ({ results, onReset, onShowPrivacy, viewMode, setViewMode }) => {
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(JSON.stringify(results, null, 2));
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  }, [results]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PharmaGuard_${results[0].patient_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [results]);

  return (
    <div className="flex flex-col gap-6 pb-6 border-b border-slate-200 mb-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Clinical Report</h2>
          <div className="flex items-center gap-3 mt-2">
            <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded font-mono text-xs font-bold tracking-widest">#{results[0].patient_id}</span>
            <span className="text-slate-400 text-sm">{new Date(results[0].timestamp).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl self-start">
          <button 
            onClick={() => setViewMode('clinician')}
            className={`px-4 py-1.5 text-xs font-black uppercase rounded-lg transition-all ${viewMode === 'clinician' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            🩺 Clinician
          </button>
          <button 
            onClick={() => setViewMode('patient')}
            className={`px-4 py-1.5 text-xs font-black uppercase rounded-lg transition-all ${viewMode === 'patient' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            👤 Patient
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button 
          onClick={onShowPrivacy}
          className="px-5 py-2.5 rounded-xl font-bold text-sm bg-emerald-50 border-2 border-emerald-100 text-emerald-700 hover:bg-emerald-100 transition-all flex items-center gap-2"
        >
          🛡 Privacy
        </button>
        <button 
          onClick={handleCopy}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 border-2 ${
            copySuccess ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          {copySuccess ? (
            <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg> Copied</>
          ) : (
            <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg> Copy JSON</>
          )}
        </button>
        <button 
          onClick={handleDownload}
          className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Download .json
        </button>
        <button 
          onClick={onReset} 
          className="px-5 py-2.5 text-sm font-bold text-blue-600 hover:bg-blue-50 transition-all rounded-xl ml-auto"
        >
          New Analysis
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

  const handleAnalyze = async () => {
    if (!file || selectedDrugs.length === 0) {
      setError("Please ensure a VCF file is uploaded and drugs are selected.");
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
            summary: "Generating clinical reasoning via Gemini AI...",
            clinical_caveats: "Standard monitoring required."
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
      setError("Pipeline Error: Failed to analyze genomic sequence. Please check connectivity.");
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
      <PrivacyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
      
      <div className="space-y-10 py-10 max-w-5xl mx-auto">
        {!results ? (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-5xl font-black text-slate-900 tracking-tight">Precision Guard</h1>
              <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">
                Analyze VCF data against CPIC guidelines with explainable AI. 
                Secure, deterministic, and medically grounded.
              </p>
            </div>
            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-2xl text-sm font-bold border border-red-100 flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600">!</div>
                {error}
              </div>
            )}
            {isAnalyzing ? (
              <ProcessingHUD phase={phase} />
            ) : (
              <>
                <VCFUpload onFileSelect={setFile} onError={setError} />
                <DrugSelector selectedDrugs={selectedDrugs} onChange={setSelectedDrugs} />
                <button
                  onClick={handleAnalyze}
                  disabled={!file || selectedDrugs.length === 0}
                  className={`w-full py-5 rounded-2xl font-black text-xl shadow-2xl transition-all transform active:scale-95 bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed`}
                >
                  Run Clinical Analysis
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4 pb-20">
            <ActionHeader 
              results={results} 
              onReset={handleReset} 
              onShowPrivacy={() => setShowPrivacy(true)}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
            <ResultDashboard results={results} viewMode={viewMode} />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default App;
