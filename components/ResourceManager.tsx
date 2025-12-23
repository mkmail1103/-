
import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { RESOURCE_CONFIGS, SOLDIER_RESOURCE_RATIOS } from '../constants';
import { ResourceType } from '../types';
import { Calculator, AlertTriangle, TrendingDown, Scale, ArrowDown, Medal, ArrowRight, Info, ChevronDown, ChevronUp, Swords, Activity, Stethoscope, Camera, Loader2 } from 'lucide-react';

const ResourceManager: React.FC = () => {
  // State for current holdings (string to allow "1.5m" inputs) for all resources
  const [holdings, setHoldings] = useState<Record<ResourceType, string>>(() => {
    try {
      const saved = localStorage.getItem('kingshot_resources');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch(e) {
      // ignore error
    }
    return {
      food: '',
      wood: '',
      stone: '',
      iron: ''
    };
  });

  // Healing Target Level State (Moved to bottom section)
  const [healingTargetLevel, setHealingTargetLevel] = useState<number>(() => {
    try {
        const saved = localStorage.getItem('kingshot_resource_healing_level');
        return saved ? parseInt(saved) : 10;
    } catch {
        return 10;
    }
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    localStorage.setItem('kingshot_resources', JSON.stringify(holdings));
  }, [holdings]);

  useEffect(() => {
    localStorage.setItem('kingshot_resource_healing_level', healingTargetLevel.toString());
  }, [healingTargetLevel]);

  const [isComposing, setIsComposing] = useState(false);
  const [isInstructionOpen, setIsInstructionOpen] = useState(false);

  // --- Helper: Full-width to Half-width Conversion ---
  const toHalfWidth = (str: string): string => {
    return str
      .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
      .replace(/．/g, '.')
      .replace(/，/g, ',');
  };

  // --- Smart Parsing Logic ---
  const parseSmartNumber = (val: string): number => {
    if (!val) return 0;
    const normalized = toHalfWidth(val);
    const lower = normalized.toLowerCase().replace(/,/g, '').trim();
    const num = parseFloat(lower);
    if (isNaN(num)) return 0;

    if (lower.endsWith('k')) return num * 1000;
    if (lower.endsWith('m')) return num * 1000000;
    if (lower.endsWith('g')) return num * 1000000000;
    return num;
  };

  const handleHoldingChange = (id: ResourceType, val: string) => {
    if (isComposing) {
      setHoldings(prev => ({ ...prev, [id]: val }));
      return;
    }
    const normalized = toHalfWidth(val);
    setHoldings(prev => ({ ...prev, [id]: normalized }));
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>, id: ResourceType) => {
    setIsComposing(false);
    const normalized = toHalfWidth(e.currentTarget.value);
    setHoldings(prev => ({ ...prev, [id]: normalized }));
  };

  const applyMultiplier = (id: ResourceType, mult: string) => {
    const current = holdings[id];
    if (!current) {
        setHoldings(prev => ({ ...prev, [id]: mult }));
        return;
    }
    const base = toHalfWidth(current).replace(/[kmg]$/i, '');
    setHoldings(prev => ({ ...prev, [id]: base + mult }));
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => e.target.select();
  
  // Format Number Helper
  const formatNumber = (num: number) => {
    if (num >= 1000000000) return (num / 1000000000).toLocaleString(undefined, { maximumFractionDigits: 2 }) + 'G';
    if (num >= 1000000) return (num / 1000000).toLocaleString(undefined, { maximumFractionDigits: 2 }) + 'M';
    if (num >= 1000) return (num / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 }) + 'K';
    return num.toLocaleString();
  };

  // --- Image Analysis ---
  const handleImageAnalysis = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Data = reader.result as string;
        const base64Content = base64Data.split(',')[1];
        
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType: file.type,
                    data: base64Content
                  }
                },
                {
                  text: `Analyze this game screenshot to extract the Total Resources amounts.
Look specifically for:
1. Food/Bread (パン)
2. Wood (木材)
3. Stone (石材)
4. Iron (鉄鉱)

Ignore capacity limits or hourly production rates. I need the current owned amount.
Return ONLY a JSON object with keys: "food", "wood", "stone", "iron".
The values should be STRINGS exactly as they appear in the image (e.g., "551.45M", "100K"). Do not convert "M" or "K" to zeros. If a resource is not visible, use null.`
                }
              ]
            },
            config: {
              responseMimeType: "application/json"
            }
          });
          
          const resultText = response.text;
          if (resultText) {
             const data = JSON.parse(resultText);
             setHoldings(prev => ({
               ...prev,
               food: data.food !== null && data.food !== undefined ? String(data.food) : prev.food,
               wood: data.wood !== null && data.wood !== undefined ? String(data.wood) : prev.wood,
               stone: data.stone !== null && data.stone !== undefined ? String(data.stone) : prev.stone,
               iron: data.iron !== null && data.iron !== undefined ? String(data.iron) : prev.iron,
             }));
          }
        } catch (err) {
          console.error("AI Analysis Error:", err);
          alert("画像の解析に失敗しました。もう一度試すか、手動で入力してください。");
        } finally {
          setIsAnalyzing(false);
          // Reset input so same file can be selected again if needed
          e.target.value = '';
        }
      };
    } catch (error) {
       console.error("File Processing Error:", error);
       setIsAnalyzing(false);
    }
  };

  // --- STANDARD ANALYSIS (20:20:4:1) ---
  // This is now fixed and always calculated based on constants
  const standardAnalysisData = useMemo(() => {
    const data = RESOURCE_CONFIGS.map(config => {
      const val = parseSmartNumber(holdings[config.id]);
      const ratio = config.ratio; // Always 20, 20, 4, 1
      
      let score = 0;
      if (ratio > 0) {
          score = val / ratio;
      } else {
          score = Number.POSITIVE_INFINITY; 
      }

      return {
        ...config,
        val,
        ratio,
        score,
        hasInput: val > 0,
        isNotNeeded: ratio === 0
      };
    });

    // Sort by score ascending (Lowest score = #1 Priority)
    return [...data].sort((a, b) => {
      if (a.score === b.score) return 0;
      return a.score - b.score;
    });
  }, [holdings]);

  // --- HEALING ANALYSIS (Dynamic) ---
  const healingAnalysisData = useMemo(() => {
     const ratioData = SOLDIER_RESOURCE_RATIOS.find(r => r.level === healingTargetLevel);
     const ratios = ratioData ? ratioData.ratios : { food: 20, wood: 20, stone: 4, iron: 1 };
     
     const data = RESOURCE_CONFIGS.map(config => {
        const val = parseSmartNumber(holdings[config.id]);
        const ratio = ratios[config.id as ResourceType] || 0;
        
        let score = 0;
        if (ratio > 0) {
            score = val / ratio;
        } else {
            score = Number.POSITIVE_INFINITY; 
        }

        return {
            ...config,
            val,
            ratio,
            score,
            isNotNeeded: ratio === 0
        };
     });

     return [...data].sort((a, b) => a.score - b.score);
  }, [holdings, healingTargetLevel]);

  const healingLevelInfo = useMemo(() => 
    SOLDIER_RESOURCE_RATIOS.find(r => r.level === healingTargetLevel), 
  [healingTargetLevel]);

  const hasAnyInput = standardAnalysisData.some(d => d.val > 0);
  const finiteScores = standardAnalysisData.filter(d => isFinite(d.score)).map(d => d.score);
  const maxScore = finiteScores.length > 0 ? Math.max(...finiteScores) : 1;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Standard Ratios Banner */}
      <div className="bg-[#0F172A]/80 backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-xl">
         <div className="flex items-center gap-2 mb-3 px-2">
            <Scale className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-200">標準バランス (20 : 20 : 4 : 1)</h3>
         </div>
         <div className="grid grid-cols-4 gap-2 text-center bg-slate-800/50 p-3 rounded-xl border border-white/5">
            {RESOURCE_CONFIGS.map(config => (
                <div key={config.id} className="flex flex-col items-center justify-center p-1">
                    <span className={`text-[10px] font-bold uppercase ${config.color} mb-1 opacity-70`}>{config.name}</span>
                    <span className="text-lg sm:text-xl font-mono font-bold text-slate-200">
                        {config.ratio}
                    </span>
                </div>
            ))}
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Inputs */}
        <div className="space-y-6">
          <div className="bg-[#0F172A]/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl relative overflow-hidden">
            
            <div className="mb-6 bg-slate-800/50 -mx-6 -mt-6 p-4 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-slate-300 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                総資源入力
              </h3>

              <label className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all
                ${isAnalyzing 
                   ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                   : 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/30'
                }
              `}>
                 <input 
                   type="file" 
                   accept="image/*" 
                   className="hidden" 
                   onChange={handleImageAnalysis}
                   disabled={isAnalyzing}
                 />
                 {isAnalyzing ? (
                    <>
                       <Loader2 className="w-3.5 h-3.5 animate-spin" />
                       解析中...
                    </>
                 ) : (
                    <>
                       <Camera className="w-3.5 h-3.5" />
                       画像から自動入力
                    </>
                 )}
              </label>
            </div>

            {/* Instruction Toggle - Moved to top */}
            <div className="mb-6">
                <button 
                    onClick={() => setIsInstructionOpen(!isInstructionOpen)}
                    className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                    <Info className="w-3 h-3" />
                    <span>総資源の確認方法</span>
                    {isInstructionOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                
                {isInstructionOpen && (
                    <div className="mt-4 bg-slate-900/50 rounded-xl p-4 border border-white/5 animate-in slide-in-from-top-2">
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs font-medium text-slate-400">
                           <span className="bg-slate-800 px-2 py-1 rounded border border-slate-700">バッグ</span>
                           <ArrowRight className="w-3 h-3 rotate-90 sm:rotate-0" />
                           <span className="bg-slate-800 px-2 py-1 rounded border border-slate-700">右上のグラフアイコン</span>
                           <ArrowRight className="w-3 h-3 rotate-90 sm:rotate-0" />
                           <span className="text-amber-400">スクショまたは入力</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-6">
              {RESOURCE_CONFIGS.map((config) => (
                <div key={config.id} className="space-y-2">
                   <div className="flex justify-between items-center px-1">
                      <label className={`text-sm font-bold flex items-center gap-2 ${config.color}`}>
                         {config.name}
                      </label>
                      {holdings[config.id] && (
                        <span className="text-xs text-slate-500 font-mono">
                          {parseSmartNumber(holdings[config.id]).toLocaleString()}
                        </span>
                      )}
                   </div>
                   
                   <div className="flex gap-1.5">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={holdings[config.id]}
                        onChange={(e) => handleHoldingChange(config.id, e.target.value)}
                        onCompositionStart={() => setIsComposing(true)}
                        onCompositionEnd={(e) => handleCompositionEnd(e, config.id)}
                        onFocus={handleFocus}
                        placeholder="0"
                        className={`min-w-0 flex-1 bg-[#1E293B] border border-slate-700 hover:border-slate-500 rounded-xl px-3 py-3 text-lg font-mono text-white focus:ring-2 focus:${config.ringColor} outline-none shadow-inner transition-colors placeholder:text-slate-600`}
                      />
                      <div className="flex gap-0.5 shrink-0">
                        {['k', 'm', 'g'].map((unit) => (
                          <button
                            key={unit}
                            onClick={() => applyMultiplier(config.id, unit)}
                            className={`w-9 rounded-lg font-bold text-sm transition-all border border-slate-700 hover:border-slate-500 active:scale-95 flex items-center justify-center uppercase
                              ${holdings[config.id].toLowerCase().endsWith(unit) 
                                ? `${config.bgColor} text-white shadow-lg` 
                                : 'bg-[#1E293B] text-slate-400 hover:text-white hover:bg-slate-700'
                              }
                            `}
                          >
                            {unit}
                          </button>
                        ))}
                      </div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Standard Analysis Results */}
        <div className="space-y-6">
           {hasAnyInput ? (
             <div className="bg-[#0F172A]/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl h-full flex flex-col">
                <h3 className="text-slate-300 text-sm font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" />
                  採取優先度 (標準比率 20:20:4:1)
                </h3>

                <div className="space-y-4 flex-1">
                   {standardAnalysisData.map((data, index) => {
                     let percentage = 100;
                     if (data.ratio > 0 && maxScore > 0) {
                         percentage = (data.score / maxScore) * 100;
                     }
                     
                     const isTopPriority = index === 0 && data.ratio > 0 && isFinite(data.score);

                     return (
                       <div key={data.id} className={`relative p-4 rounded-xl border transition-all duration-500 ${
                         isTopPriority 
                           ? 'bg-gradient-to-r from-slate-800 to-slate-800/50 border-rose-500/50 shadow-lg shadow-rose-900/10' 
                           : 'bg-slate-800/30 border-slate-700/50'
                       }`}>
                          {isTopPriority && (
                            <div className="absolute -top-3 -right-3">
                               <div className="bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 animate-bounce">
                                 <AlertTriangle className="w-3 h-3 fill-white" />
                                 最優先
                               </div>
                            </div>
                          )}

                          <div className="flex justify-between items-end mb-2 relative z-10">
                             <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-lg ${
                                   isTopPriority ? 'bg-rose-500 text-white' : 'bg-slate-700 text-slate-400'
                                }`}>
                                   {index + 1}
                                </div>
                                <div>
                                   <div className={`font-bold text-lg leading-none ${data.color}`}>{data.name}</div>
                                   <div className="text-[10px] text-slate-500 mt-1">比率: {data.ratio}</div>
                                </div>
                             </div>
                             
                             <div className="text-right">
                                {isTopPriority ? (
                                   <div className="text-rose-400 text-xs font-bold flex items-center justify-end gap-1">
                                      <ArrowDown className="w-3 h-3" /> 不足
                                   </div>
                                ) : (
                                   <div className="text-emerald-400 text-xs font-bold">充足気味</div>
                                )}
                             </div>
                          </div>

                          {/* Visualization Bar */}
                          <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden relative">
                             <div 
                                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                   isTopPriority ? 'bg-rose-500' : data.bgColor
                                }`}
                                style={{ width: `${Math.max(percentage, 2)}%` }}
                             ></div>
                          </div>
                       </div>
                     );
                   })}
                </div>
                
                <div className="mt-6 pt-4 border-t border-white/5 text-center">
                    {standardAnalysisData[0] && standardAnalysisData[0].ratio > 0 ? (
                        <p className="text-sm text-slate-400">
                           標準バランスでは <span className="font-bold text-rose-400">{standardAnalysisData[0].name}</span> が不足しています。
                        </p>
                    ) : null}
                </div>
             </div>
           ) : (
             <div className="bg-[#0F172A]/50 rounded-xl border border-white/5 h-full flex flex-col items-center justify-center p-10 text-slate-600">
                <Medal className="w-16 h-16 mb-4 opacity-20" />
                <p>数値を入力すると<br/>ランキングが表示されます</p>
             </div>
           )}
        </div>
      </div>

      {/* BOTTOM SECTION: SOLDIER HEALING (Extra) - Permanently Open */}
      <div className="pt-8 border-t border-white/5">
        <div className="bg-slate-900/40 rounded-2xl border border-white/5 overflow-hidden ring-1 ring-indigo-500/30">
             {/* Static Header */}
             <div className="w-full flex items-center justify-between p-4 bg-slate-800/30 border-b border-white/5">
                 <div className="flex items-center gap-3">
                     <div className="p-2 rounded-lg bg-indigo-500 text-white">
                        <Stethoscope className="w-5 h-5" />
                     </div>
                     <div className="text-left">
                         <h3 className="text-sm font-bold text-white">兵士治療シミュレーター</h3>
                         <p className="text-[10px] text-slate-500">兵士レベルごとの治療コスト比率を確認</p>
                     </div>
                 </div>
             </div>

             <div className="p-4 sm:p-6">
                 
                 {/* Level Selector */}
                 <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                    <label className="text-sm font-bold text-indigo-300">対象の兵士レベル</label>
                    <div className="relative w-full sm:w-auto">
                        <select 
                            value={healingTargetLevel} 
                            onChange={(e) => setHealingTargetLevel(parseInt(e.target.value))}
                            className="w-full sm:w-64 appearance-none bg-slate-900 border border-slate-700 hover:border-slate-500 text-white pl-4 pr-10 py-3 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                        >
                            {SOLDIER_RESOURCE_RATIOS.map((s) => (
                                <option key={s.level} value={s.level}>
                                    Lv.{s.level} {s.name} (T{s.level})
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <ChevronDown className="w-4 h-4" />
                        </div>
                    </div>
                 </div>

                 {/* Ratios for Selected Level - FIXED ORDER (Food, Wood, Stone, Iron) */}
                 <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
                     <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase">Lv.{healingTargetLevel} {healingLevelInfo?.name} の治療資源比率</h4>
                     <div className="grid grid-cols-4 gap-2 text-center">
                        {RESOURCE_CONFIGS.map(config => {
                            // Find ratio for this specific resource in the selected level
                            const ratioData = SOLDIER_RESOURCE_RATIOS.find(r => r.level === healingTargetLevel);
                            const ratios = ratioData ? ratioData.ratios : { food: 20, wood: 20, stone: 4, iron: 1 };
                            const ratio = ratios[config.id as ResourceType] || 0;

                            return (
                                <div key={config.id} className="p-2 bg-slate-900 rounded-lg border border-slate-700/50">
                                    <div className={`text-[10px] font-bold ${config.color} opacity-80`}>{config.name}</div>
                                    <div className="text-sm font-mono font-bold text-white mt-1">
                                        {ratio.toFixed(2)}
                                    </div>
                                    {ratio === 0 && <div className="text-[9px] text-slate-500 mt-0.5">不要</div>}
                                </div>
                            );
                        })}
                     </div>
                 </div>

                 {/* Shortage Analysis for Healing */}
                 {hasAnyInput && (
                     <div>
                         <h4 className="text-xs font-bold text-indigo-300 mb-3 flex items-center gap-2">
                            <Activity className="w-3 h-3" />
                            治療時の不足資源予測 (入力値に基づく)
                         </h4>
                         <div className="space-y-2">
                             {healingAnalysisData.map((data, index) => {
                                 // Skip resources with 0 ratio
                                 if (data.isNotNeeded) return null;
                                 
                                 const isShortest = index === 0; // First item is shortest because we sorted by score

                                 return (
                                     <div key={data.id} className={`flex items-center justify-between p-2 rounded-lg border ${
                                         isShortest 
                                            ? 'bg-indigo-900/20 border-indigo-500/30' 
                                            : 'bg-slate-900/30 border-slate-800'
                                     }`}>
                                         <div className="flex items-center gap-2">
                                             <div className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${isShortest ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                                 {index + 1}
                                             </div>
                                             <div className={`text-sm font-bold ${data.color}`}>{data.name}</div>
                                         </div>
                                         <div className="text-right">
                                             {isShortest ? (
                                                 <span className="text-xs text-rose-400 font-bold flex items-center gap-1">
                                                     <ArrowDown className="w-3 h-3" /> 最も不足
                                                 </span>
                                             ) : (
                                                 <span className="text-xs text-slate-500">充足</span>
                                             )}
                                         </div>
                                     </div>
                                 );
                             })}
                         </div>
                     </div>
                 )}
             </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceManager;
