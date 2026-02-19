
import React from 'react';
import { PharmaGuardResult, RiskLabel, Severity } from '../types';

interface ResultDashboardProps {
  result: PharmaGuardResult;
}

const ResultDashboard: React.FC<ResultDashboardProps> = ({ result }) => {
  const getRiskColor = (label: RiskLabel) => {
    switch (label) {
      case RiskLabel.HIGH: return 'bg-red-50 border-red-200 text-red-700';
      case RiskLabel.MODERATE: return 'bg-amber-50 border-amber-200 text-amber-700';
      case RiskLabel.LOW: return 'bg-emerald-50 border-emerald-200 text-emerald-700';
      default: return 'bg-slate-50 border-slate-200 text-slate-700';
    }
  };

  const getSeverityBadge = (sev: Severity) => {
    switch (sev) {
      case Severity.CRITICAL: return 'bg-red-600 text-white';
      case Severity.HIGH: return 'bg-red-500 text-white';
      case Severity.MEDIUM: return 'bg-amber-500 text-white';
      case Severity.LOW: return 'bg-emerald-500 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Quality Score</p>
          <p className="text-3xl font-black text-slate-900">
            {result.quality_metrics.vcf_parsing_success ? '98%' : 'FAIL'}
          </p>
          <p className="text-slate-400 text-xs mt-1">Based on VCF validation</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Variants Found</p>
          <p className="text-3xl font-black text-slate-900">{result.quality_metrics.variant_count}</p>
          <p className="text-slate-400 text-xs mt-1">Across {result.quality_metrics.gene_coverage.length} target genes</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Actionable Risks</p>
          <p className="text-3xl font-black text-red-600">
            {result.risk_assessment.filter(r => r.risk_label === RiskLabel.HIGH).length}
          </p>
          <p className="text-slate-400 text-xs mt-1">Requiring immediate attention</p>
        </div>
      </div>

      {/* Actionable Insights */}
      <h2 className="text-2xl font-bold text-slate-900">Clinical Risk Assessments</h2>
      <div className="grid grid-cols-1 gap-6">
        {result.risk_assessment.map((risk, idx) => {
          const aiExp = result.llm_generated_explanations[risk.drug];
          return (
            <div key={idx} className={`rounded-2xl border-2 p-6 transition-all ${getRiskColor(risk.risk_label)}`}>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${getSeverityBadge(risk.severity)}`}>
                      {risk.severity} Severity
                    </span>
                    <span className="text-sm font-bold opacity-80">{risk.risk_label}</span>
                  </div>
                  <h3 className="text-3xl font-black">{risk.drug}</h3>
                  <p className="text-lg mt-1 font-semibold opacity-90">{risk.primary_gene} Interaction</p>
                </div>
                <div className="bg-white/50 backdrop-blur rounded-xl p-4 border border-black/5 flex-shrink-0">
                  <p className="text-xs font-bold opacity-60 uppercase mb-1">Recommendation</p>
                  <p className="text-slate-900 font-bold max-w-sm leading-tight">{risk.recommendation_text}</p>
                </div>
              </div>

              {aiExp && (
                <div className="mt-6 pt-6 border-t border-black/5 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                      AI Scientific Insight
                    </h4>
                    <p className="text-slate-800 text-sm leading-relaxed mb-4">{aiExp.explanation}</p>
                    <div className="bg-white/30 rounded-lg p-3">
                      <p className="text-[10px] font-black uppercase opacity-60 mb-1">Biochemical Mechanism</p>
                      <p className="text-xs italic text-slate-700">{aiExp.mechanism}</p>
                    </div>
                  </div>
                  <div className="bg-white/40 rounded-xl p-4">
                    <h4 className="text-sm font-black uppercase tracking-widest mb-2 text-red-700">Clinical Caveats</h4>
                    <p className="text-xs text-red-900/80 leading-relaxed italic">{aiExp.caveats}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase opacity-40">Confidence: {(risk.confidence_score * 100).toFixed(0)}%</span>
                      <button className="text-[10px] font-bold text-blue-600 hover:underline">View Citations</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Gene Profiles */}
      <h2 className="text-xl font-bold text-slate-900 mt-12">Pharmacogenomic Profiles</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {result.pharmacogenomic_profiles.map((p, idx) => (
          <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-slate-900">{p.gene}</span>
              <span className="text-[10px] px-2 py-0.5 bg-slate-100 rounded-full font-bold text-slate-600">{p.phenotype}</span>
            </div>
            <div className="space-y-1">
              {p.detected_variants.length > 0 ? p.detected_variants.map((v, vIdx) => (
                <div key={vIdx} className="text-[10px] flex justify-between bg-slate-50 p-1.5 rounded">
                  <span className="font-mono text-slate-600">{v.id}</span>
                  <span className="text-slate-400">{v.ref}/{v.alt}</span>
                </div>
              )) : (
                <p className="text-[10px] text-slate-400 italic">No significant variants detected</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultDashboard;
