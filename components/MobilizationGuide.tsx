
import React, { useState, useMemo, useEffect } from 'react';
import { MOBILIZATION_QUESTS } from '../constants';
import { Timer, Hammer, Hexagon, Gem, ArrowRight, TrendingUp, AlertTriangle, CheckCircle2, Clock, Lock, ArrowDown, Zap, Calculator, ChevronDown, ChevronUp, BarChart3, Coins, SlidersHorizontal, MousePointerClick } from 'lucide-react';

// Type definitions for user inventory
interface Inventory {
  speedup_general_mins: number;
  speedup_troop_mins: number;
  speedup_building_mins: number;
  speedup_research_mins: number;
  diamonds: number;
  hammer: number;
  hero_shards: number;
  stamina: number;
}

type StrategyMode = 'efficiency' | 'power';

// Specific handler for time inputs (minutes only) - Moved outside to prevent re-render focus loss
const TimeInput = ({ 
  label, 
  value, 
  onChange, 
  colorClass 
}: { 
  label: string, 
  value: number, 
  onChange: (mins: number) => void,
  colorClass?: string
}) => {
  return (
    <div className="bg-[#1E293B] border border-slate-700 rounded-xl p-3 flex items-center justify-between gap-3">
       <label className={`block text-xs font-bold uppercase ${colorClass || 'text-slate-300'}`}>{label}</label>
       <div className="relative w-32">
          <input 
            type="number" min="0" placeholder="0" 
            value={value || ''} 
            onChange={e => onChange(parseInt(e.target.value)||0)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-3 pr-8 py-2 text-right text-sm text-white focus:ring-1 focus:ring-slate-500 outline-none font-mono"
          />
          <span className="absolute right-8 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 pointer-events-none opacity-0"></span>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none">分</span>
       </div>
    </div>
  );
};

const MobilizationGuide: React.FC = () => {
  // Initial default values
  const defaultInventory: Inventory = {
    speedup_general_mins: 0,
    speedup_troop_mins: 0,
    speedup_building_mins: 0,
    speedup_research_mins: 0,
    diamonds: 0,
    hammer: 0,
    hero_shards: 0,
    stamina: 0,
  };

  // Inventory state with localStorage persistence
  const [inventory, setInventory] = useState<Inventory>(() => {
    try {
      const saved = localStorage.getItem('kingshot_mobilization_inventory');
      return saved ? JSON.parse(saved) : defaultInventory;
    } catch (e) {
      return defaultInventory;
    }
  });

  // Strategy Mode State: 'efficiency' (Save items/Active) vs 'power' (Save time/Whale)
  const [strategyMode, setStrategyMode] = useState<StrategyMode>('efficiency');
  
  const [isSimulationOpen, setIsSimulationOpen] = useState(true);
  const [isImpossibleOpen, setIsImpossibleOpen] = useState(false);

  // Save to localStorage whenever inventory changes
  useEffect(() => {
    localStorage.setItem('kingshot_mobilization_inventory', JSON.stringify(inventory));
  }, [inventory]);

  // Helper for inputs
  const handleInventoryChange = (field: keyof Inventory, value: string) => {
    const num = parseInt(value.replace(/[^0-9]/g, '')) || 0;
    setInventory(prev => ({ ...prev, [field]: num }));
  };
  
  // --- Quest Strategy Simulation ---
  const simulation = useMemo(() => {
    let totalPoints = 0;
    let totalQuests = 0;
    
    const breakdown: { 
      id: string; 
      label: string; 
      questCount: number;
      points: number; 
      details: string[]; 
      icon: any; 
      color: string;
      remaining: number;
      unit: string;
    }[] = [];

    // Track remainders from specific speedups to use in "Total Speedup" later
    let remainderBuilding = 0;
    let remainderTroop = 0;
    let remainderResearch = 0;

    // Helper to calculate using the selected strategy
    const calculateForResource = (
      initialInv: number,
      questTypes: string[], 
      label: string, 
      Icon: any, 
      color: string,
      unit: string,
      saveRemainder: (rem: number) => void
    ) => {
      let currentInv = initialInv;
      let subPoints = 0;
      let subQuests = 0;
      let subDetails: string[] = [];

      // 1. Get all relevant variants
      const allVariants = MOBILIZATION_QUESTS
        .filter(q => questTypes.includes(q.type))
        .flatMap(q => q.variants.map(v => ({
          ...v, 
          questLabel: q.label
        })));

      if (allVariants.length === 0) {
          saveRemainder(currentInv);
          return;
      }

      // 2. Sort variants based on Strategy Mode
      if (strategyMode === 'efficiency') {
         // Efficiency Mode: Prioritize Lowest Cost per Point (Blue > Purple > Yellow)
         // Low cost means doing many small quests to save resources.
         allVariants.sort((a, b) => {
            const effA = a.cost / a.points;
            const effB = b.cost / b.points;
            return effA - effB; // Ascending: Smaller ratio is better (Cost efficient)
         });
      } else {
         // Power Mode: Prioritize Highest Points per Slot (Yellow > Purple > Blue)
         // High points means doing big quests to save time/slots.
         allVariants.sort((a, b) => {
            return b.points - a.points; // Descending: Higher points is better
         });
      }

      // 3. Consume Inventory greedily based on sorted variants
      for (const variant of allVariants) {
          if (currentInv >= variant.cost) {
              const count = Math.floor(currentInv / variant.cost);
              if (count > 0) {
                  subPoints += count * variant.points;
                  subQuests += count;
                  currentInv %= variant.cost;
                  subDetails.push(`${variant.rank}：${variant.questLabel} (${variant.cost.toLocaleString()}${unit}/${variant.points}pt) × ${count}回`);
              }
          }
      }

      saveRemainder(currentInv);

      if (subQuests > 0) {
        totalPoints += subPoints;
        totalQuests += subQuests;
        breakdown.push({
          id: label,
          label,
          questCount: subQuests,
          points: subPoints,
          details: subDetails,
          icon: Icon,
          color,
          remaining: currentInv,
          unit
        });
      }
    };

    // 1. Execute calculation for Standard Resources
    calculateForResource(inventory.diamonds, ['diamonds'], 'ダイヤ消費', Gem, 'text-indigo-400', '個', () => {});
    calculateForResource(inventory.hammer, ['hammer'], 'ハンマー', Hammer, 'text-amber-500', '個', () => {});
    calculateForResource(inventory.hero_shards, ['hero_shards'], '英雄の欠片', Hexagon, 'text-purple-400', '個', () => {});
    calculateForResource(inventory.stamina, ['wild_beast'], '体力 (野獣)', Zap, 'text-emerald-400', '', () => {});
    
    // 2. Execute calculation for Specific Speedups (Saving remainders)
    calculateForResource(inventory.speedup_troop_mins, ['speedup_troop'], '兵士加速', Clock, 'text-rose-400', '分', (rem) => remainderTroop = rem);
    calculateForResource(inventory.speedup_building_mins, ['speedup_building'], '建築加速', Clock, 'text-amber-400', '分', (rem) => remainderBuilding = rem);
    calculateForResource(inventory.speedup_research_mins, ['speedup_research'], '研究加速', Clock, 'text-blue-400', '分', (rem) => remainderResearch = rem);

    // 3. Execute calculation for Total Speedup (Using General Items + Specific Remainders)
    const pooledSpeedup = inventory.speedup_general_mins + remainderTroop + remainderBuilding + remainderResearch;
    calculateForResource(pooledSpeedup, ['speedup_general'], '合計加速', Clock, 'text-slate-200', '分', () => {});

    return { totalPoints, totalQuests, breakdown };
  }, [inventory, strategyMode]);


  // --- Strategy Analysis Logic ---
  const strategy = useMemo(() => {
     const EVENT_DAYS = 6;
     const questsPerDay = simulation.totalQuests / EVENT_DAYS;
     
     let recommendedTier = '';
     let tierColor = '';
     let advice = '';
     let diamondCostPerDay = 0;

     if (questsPerDay <= 1.5) {
         recommendedTier = '無料枠のみ';
         tierColor = 'text-slate-400';
         diamondCostPerDay = 0;
         advice = '在庫がかなり少ないです。無理に枠を追加せず、無料分だけ消化しましょう。';
     } else if (questsPerDay <= 4.5) {
         recommendedTier = '50ダイヤ枠まで (計4回/日)';
         tierColor = 'text-emerald-400';
         diamondCostPerDay = 150;
         advice = '50ダイヤの枠（3つ）まで購入するのが最適です。200ダイヤ枠を買うと在庫が尽きます。';
     } else if (questsPerDay <= 7.5) {
         recommendedTier = '200ダイヤ枠まで (計7回/日)';
         tierColor = 'text-indigo-400';
         diamondCostPerDay = 750;
         advice = '最もコスパの良い「7枠回し」が可能な在庫量です！200ダイヤ枠まで全て購入しましょう。';
     } else {
         recommendedTier = '1000ダイヤ枠も検討 (計8回以上/日)';
         tierColor = 'text-amber-400';
         diamondCostPerDay = 750 + ((questsPerDay - 7) * 1000); 
         if (strategyMode === 'efficiency') {
             advice = '在庫が潤沢です。しかし「資源効率重視」で小さなクエストを回す場合、クエスト枠が足りなくなる恐れがあります。1000ダイヤ枠を買うか、戦略を「スコア重視」に切り替えて大きなクエストを回すことを検討してください。';
         } else {
             advice = '在庫が潤沢です。大きなクエストを中心に回すため、消化ペースは早いでしょう。ダイヤに余裕があれば1000ダイヤ枠も積極的に活用しましょう。';
         }
     }

     return {
         questsPerDay,
         recommendedTier,
         tierColor,
         diamondCostPerDay,
         advice
     };
  }, [simulation.totalQuests, strategyMode]);


  // Logic: Split quests into Possible and Impossible, then Sort (Existing logic kept for list view)
  const { possible, impossible } = useMemo(() => {
    let possibleList: any[] = [];
    let impossibleList: any[] = [];

    MOBILIZATION_QUESTS.forEach(questType => {
      let displayLabel = questType.label;
      if (questType.type === 'speedup_general') { displayLabel = '合計加速'; }

      questType.variants.forEach(variant => {
        let currentInv = 0;
        let isPossible = false;
        let unit = questType.unit || '分';
        let invKey: keyof Inventory | null = null;

        if (questType.type === 'speedup_general') {
             currentInv = inventory.speedup_general_mins + inventory.speedup_troop_mins + inventory.speedup_building_mins + inventory.speedup_research_mins;
             isPossible = currentInv >= variant.cost;
        } else if (questType.type === 'speedup_troop') {
             currentInv = inventory.speedup_troop_mins + inventory.speedup_general_mins;
             isPossible = currentInv >= variant.cost;
        } else if (questType.type === 'speedup_building') {
             currentInv = inventory.speedup_building_mins + inventory.speedup_general_mins;
             isPossible = currentInv >= variant.cost;
        } else if (questType.type === 'speedup_research') {
             currentInv = inventory.speedup_research_mins + inventory.speedup_general_mins;
             isPossible = currentInv >= variant.cost;
        } else {
            if (questType.type === 'hammer') { invKey = 'hammer'; }
            else if (questType.type === 'diamonds') { invKey = 'diamonds'; }
            else if (questType.type === 'hero_shards') { invKey = 'hero_shards'; }
            else if (questType.type === 'wild_beast') { invKey = 'stamina'; }
            if (invKey) {
                currentInv = inventory[invKey];
                isPossible = currentInv >= variant.cost;
            }
        }

        let efficiencyScore = variant.cost / variant.points;
        const item = { ...variant, label: displayLabel, category: questType.category, currentInv, efficiencyScore, unit, typeCode: questType.type };

        if (isPossible) { possibleList.push(item); } else { impossibleList.push(item); }
      });
    });

    const getRankScore = (rank: string) => {
        if (rank === '青') return 1;
        if (rank === '紫') return 2;
        if (rank === '黄') return 3;
        return 4;
    };
    // List display sort also respects strategy roughly
    const sortFn = (a: any, b: any) => {
        if (strategyMode === 'efficiency') {
            // Efficiency: Blue first
            const scoreA = getRankScore(a.rank);
            const scoreB = getRankScore(b.rank);
            if (scoreA !== scoreB) return scoreA - scoreB;
            return a.efficiencyScore - b.efficiencyScore;
        } else {
             // Power: High points first
             return b.points - a.points;
        }
    };

    return { possible: possibleList.sort(sortFn), impossible: impossibleList.sort(sortFn) };
  }, [inventory, strategyMode]);

  const getRankBadgeStyle = (rank: string) => {
      switch (rank) {
          case '黄': return 'bg-yellow-500 text-black border-yellow-400';
          case '紫': return 'bg-purple-600 text-white border-purple-500';
          case '青': return 'bg-blue-600 text-white border-blue-500';
          default: return 'bg-slate-700 text-slate-400 border-slate-600';
      }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      
      {/* Strategy Header */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 border border-indigo-500/50 rounded-2xl p-6 relative overflow-hidden shadow-lg">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2 relative z-10">
          <TrendingUp className="w-6 h-6 text-indigo-400" />
          イベント基本戦略 (6日間)
        </h3>
        
        <div className="relative z-10">
          {/* Optimization Highlight Box */}
          <div className="bg-indigo-500/10 border border-indigo-500/50 rounded-xl p-4 mb-4 backdrop-blur-sm">
             <h4 className="text-indigo-200 font-bold flex items-center gap-2 mb-2">
                <SlidersHorizontal className="w-4 h-4" />
                プレイスタイルに合わせた最適化
             </h4>
             <p className="text-white text-sm leading-relaxed">
                在庫が少ない方は<strong className="text-emerald-300 mx-1">「資源効率」</strong>を重視し、
                在庫が潤沢で時間がない方は<strong className="text-amber-300 mx-1">「時短・高得点」</strong>を重視してください。
             </p>
          </div>

          <div className="text-sm text-slate-300 space-y-2">
             <p>
               <span className="text-white font-bold border-b border-indigo-500/50">クエスト枠の購入について</span><br/>
               自然回復分だけでは不十分です。在庫量に応じて、ダイヤで枠を追加購入して完走を目指します。
             </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Inventory Inputs */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#0F172A]/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl sticky top-24">
            <h3 className="text-slate-300 text-sm font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
               あなたの在庫を入力
            </h3>

            <div className="space-y-4">
              {/* Diamonds */}
              <div className="flex items-center gap-3 bg-[#1E293B] p-3 rounded-xl border border-slate-700">
                 <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center shrink-0">
                    <Gem className="w-5 h-5 text-indigo-400" />
                 </div>
                 <div className="flex-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">所持ダイヤ</label>
                    <input 
                       type="number" min="0" placeholder="0"
                       value={inventory.diamonds || ''}
                       onChange={e => handleInventoryChange('diamonds', e.target.value)}
                       className="w-full bg-transparent text-white font-mono text-lg outline-none placeholder:text-slate-600"
                    />
                 </div>
              </div>

              {/* Items */}
              <div className="grid grid-cols-2 gap-3">
                 <div className="bg-[#1E293B] p-3 rounded-xl border border-slate-700">
                    <label className="text-xs font-bold text-amber-500 uppercase flex items-center gap-1 mb-1">
                       <Hammer className="w-3 h-3" /> ハンマー
                    </label>
                    <input 
                       type="number" min="0" placeholder="0"
                       value={inventory.hammer || ''}
                       onChange={e => handleInventoryChange('hammer', e.target.value)}
                       className="w-full bg-slate-900 rounded-lg px-2 py-1 text-white font-mono outline-none"
                    />
                 </div>
                 <div className="bg-[#1E293B] p-3 rounded-xl border border-slate-700">
                    <label className="text-xs font-bold text-purple-400 uppercase flex items-center gap-1 mb-1">
                       <Hexagon className="w-3 h-3" /> 英雄の欠片
                    </label>
                    <input 
                       type="number" min="0" placeholder="0"
                       value={inventory.hero_shards || ''}
                       onChange={e => handleInventoryChange('hero_shards', e.target.value)}
                       className="w-full bg-slate-900 rounded-lg px-2 py-1 text-white font-mono outline-none"
                    />
                 </div>
              </div>

              {/* Stamina Input */}
              <div className="flex items-center gap-3 bg-[#1E293B] p-3 rounded-xl border border-slate-700">
                 <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5 text-emerald-400" />
                 </div>
                 <div className="flex-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">体力</label>
                    <input 
                       type="number" min="0" placeholder="0"
                       value={inventory.stamina || ''}
                       onChange={e => handleInventoryChange('stamina', e.target.value)}
                       className="w-full bg-transparent text-white font-mono text-lg outline-none placeholder:text-slate-600"
                    />
                 </div>
              </div>

              {/* Speedups */}
              <div className="space-y-3 pt-2 border-t border-white/5">
                 <div className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                    <Clock className="w-3 h-3" /> 加速アイテム (分)
                 </div>
                 
                 <TimeInput label="一般加速" colorClass="text-purple-300" 
                    value={inventory.speedup_general_mins} 
                    onChange={v => setInventory(prev => ({...prev, speedup_general_mins: v}))} 
                 />
                 <TimeInput label="兵士訓練加速" colorClass="text-rose-400" 
                    value={inventory.speedup_troop_mins} 
                    onChange={v => setInventory(prev => ({...prev, speedup_troop_mins: v}))} 
                 />
                 <TimeInput label="建築加速" colorClass="text-amber-400" 
                    value={inventory.speedup_building_mins} 
                    onChange={v => setInventory(prev => ({...prev, speedup_building_mins: v}))} 
                 />
                 <TimeInput label="研究加速" colorClass="text-blue-400" 
                    value={inventory.speedup_research_mins} 
                    onChange={v => setInventory(prev => ({...prev, speedup_research_mins: v}))} 
                 />
              </div>

            </div>
          </div>
        </div>

        {/* Right: Recommendations */}
        <div className="lg:col-span-7 space-y-6">
           
           {/* Quest Strategy Planner */}
           <div className="bg-gradient-to-br from-[#1e1b4b] to-[#312e81] rounded-2xl border border-indigo-500/30 shadow-2xl overflow-hidden">
             
             {/* Strategy Mode Toggle Header */}
             <div className="bg-[#0F172A]/50 p-4 border-b border-indigo-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-indigo-200">
                   <SlidersHorizontal className="w-4 h-4" />
                   <span className="text-xs font-bold uppercase tracking-wider">戦略設定:</span>
                </div>
                <div className="flex bg-slate-900/80 p-1 rounded-lg border border-white/5">
                   <button
                     onClick={() => setStrategyMode('efficiency')}
                     className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                        strategyMode === 'efficiency' 
                        ? 'bg-emerald-600 text-white shadow-lg' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                     }`}
                   >
                     <Zap className="w-3 h-3" />
                     資源効率 (アクティブ)
                   </button>
                   <button
                     onClick={() => setStrategyMode('power')}
                     className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                        strategyMode === 'power' 
                        ? 'bg-amber-600 text-white shadow-lg' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                     }`}
                   >
                     <MousePointerClick className="w-3 h-3" />
                     スコア・時短 (重課金)
                   </button>
                </div>
             </div>

             <div 
               className="p-4 sm:p-6 cursor-pointer flex justify-between items-center bg-white/5 hover:bg-white/10 transition-colors"
               onClick={() => setIsSimulationOpen(!isSimulationOpen)}
             >
                <div className="flex items-center gap-3">
                   <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
                     <BarChart3 className="w-6 h-6 text-white" />
                   </div>
                   <div>
                      <h3 className="text-white font-bold text-lg sm:text-xl whitespace-nowrap">クエスト計画シミュレーション</h3>
                      <p className="text-indigo-200 text-xs sm:text-sm mt-0.5">
                        {strategyMode === 'efficiency' 
                           ? <span className="text-emerald-300">青・紫クエスト(低コスト)</span> 
                           : <span className="text-amber-300">黄クエスト(高得点)</span>
                        }
                        を優先して計算
                      </p>
                   </div>
                </div>
                {isSimulationOpen ? <ChevronUp className="text-indigo-300" /> : <ChevronDown className="text-indigo-300" />}
             </div>

             {isSimulationOpen && (
               <div className="bg-[#0B1120]/30 border-t border-indigo-500/20 p-6 animate-in slide-in-from-top-2 duration-300">
                  
                  {/* Experimental Warning */}
                  <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl mb-6 flex items-start gap-3">
                     <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0" />
                     <div>
                        <h4 className="font-bold text-rose-200 text-sm flex items-center gap-2">⚠️ 試験運用中 ⚠️</h4>
                        <p className="text-rose-200/80 text-xs font-bold mt-1 leading-relaxed">
                           これはまだ試験段階です。絶対に参考にしないでください。
                        </p>
                     </div>
                  </div>

                  {simulation.totalQuests > 0 ? (
                    <div className="space-y-6">
                      
                      {/* Top Summary Stats */}
                      <div className="grid grid-cols-2 gap-4">
                         <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 flex flex-col justify-between h-full">
                            <div className="text-xs text-slate-400 mb-1">消化可能クエスト数 (合計)</div>
                            <div className="text-2xl sm:text-3xl font-black text-white flex items-baseline gap-1">{simulation.totalQuests} <span className="text-sm font-normal text-slate-500">回</span></div>
                         </div>
                         <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 flex flex-col justify-between h-full">
                            <div className="text-xs text-slate-400 mb-1">獲得予定ポイント</div>
                            <div className="text-2xl sm:text-3xl font-black text-white flex items-baseline gap-1">{simulation.totalPoints.toLocaleString()} <span className="text-sm font-normal text-indigo-300">pt</span></div>
                         </div>
                      </div>

                      {/* Strategy Advice Block */}
                      <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                         <div className="flex items-center gap-2 mb-3">
                             <Coins className="w-5 h-5 text-amber-400" />
                             <span className="font-bold text-slate-200">推奨プラン: <span className={`${strategy.tierColor} text-lg`}>{strategy.recommendedTier}</span></span>
                         </div>
                         
                         {/* Visual Progress Bar */}
                         <div className="relative h-4 bg-slate-800 rounded-full mb-2 overflow-hidden">
                             {/* Markers */}
                             <div className="absolute top-0 bottom-0 left-[14%] w-0.5 bg-slate-600 z-10" title="無料のみ (6回)"></div>
                             <div className="absolute top-0 bottom-0 left-[57%] w-0.5 bg-slate-600 z-10" title="50ダイヤ枠 (24回)"></div>
                             <div className="absolute top-0 bottom-0 left-[100%] w-0.5 bg-slate-600 z-10" title="200ダイヤ枠 (42回)"></div>
                             
                             {/* Progress */}
                             <div 
                               className={`absolute top-0 left-0 bottom-0 transition-all duration-1000 ${
                                 strategy.questsPerDay >= 7 ? 'bg-indigo-500' : 
                                 strategy.questsPerDay >= 4 ? 'bg-emerald-500' : 'bg-slate-500'
                               }`}
                               style={{ width: `${Math.min((simulation.totalQuests / 42) * 100, 100)}%` }}
                             ></div>
                         </div>
                         <div className="flex justify-between text-[10px] text-slate-500 font-mono mb-3">
                             <span>0</span>
                             <span>24回 (4/日)</span>
                             <span>42回 (7/日)</span>
                         </div>

                         <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/40 p-3 rounded-lg border border-white/5">
                            {strategy.advice}
                         </p>
                      </div>

                      {/* Breakdown List */}
                      <div className="space-y-3 pt-2">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">クエスト内訳 ({strategyMode === 'efficiency' ? '効率重視' : '得点重視'})</div>
                        {simulation.breakdown.map((item) => (
                          <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/50 p-3 rounded-lg border border-indigo-500/10">
                             <div className="flex items-start gap-3">
                                <item.icon className={`w-5 h-5 mt-0.5 ${item.color}`} />
                                <div>
                                  <div className={`text-sm font-bold ${item.color} flex items-center gap-2`}>
                                     {item.label}
                                     <span className="text-xs text-white bg-slate-700 px-1.5 rounded">{item.questCount}回</span>
                                  </div>
                                  <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                    {item.details.map((d, i) => (
                                      <span key={i} className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">{d}</span>
                                    ))}
                                  </div>
                                </div>
                             </div>
                             <div className="text-right shrink-0 pl-8 sm:pl-0">
                                <div className="text-lg font-bold text-white tabular-nums">
                                  +{item.points.toLocaleString()} pt
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  余り: {item.remaining.toLocaleString()}{item.unit}
                                </div>
                             </div>
                          </div>
                        ))}
                      </div>

                    </div>
                  ) : (
                    <div className="text-center py-6 text-indigo-200/50 flex flex-col items-center gap-2">
                      <Calculator className="w-10 h-10 opacity-30" />
                      <p>在庫を入力すると計算されます</p>
                    </div>
                  )}
               </div>
             )}
           </div>

           {/* Possible Quests List */}
           <div className="bg-[#0F172A]/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl">
              <h3 className="text-slate-300 text-sm font-bold uppercase tracking-wider mb-6 flex items-center justify-between">
                 <span>推奨クエスト一覧</span>
                 <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded border border-emerald-500/20">
                    {possible.length} 件 達成可能
                 </span>
              </h3>
              
              <div className="space-y-3">
                 {possible.length > 0 ? (
                    possible.map((rec, idx) => (
                       <div key={idx} className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all hover:translate-x-1 ${
                          rec.rank === '青' ? 'bg-indigo-900/20 border-indigo-500/50 shadow-lg shadow-indigo-900/10' :
                          'bg-slate-800/50 border-slate-700'
                       }`}>
                          <div className="flex items-center gap-4">
                             <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center shrink-0 font-bold text-lg border shadow-inner ${getRankBadgeStyle(rec.rank)}`}>
                                <span>{rec.rank}</span>
                             </div>
                             
                             <div>
                                <h4 className={`font-bold text-base ${rec.color} flex items-center gap-2`}>
                                   {rec.label}
                                   {rec.rank === '青' && <span className="text-[10px] bg-indigo-500 text-white px-1.5 py-0.5 rounded-full">高効率</span>}
                                </h4>
                                <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                                   <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                                      コスト: {rec.cost.toLocaleString()}{rec.unit}
                                   </span>
                                   <ArrowRight className="w-3 h-3" />
                                   <span className="text-white font-bold">{rec.points} pt</span>
                                </div>
                             </div>
                          </div>

                          <div className="text-right shrink-0">
                             <div className="text-xs text-slate-500 mb-1">残り在庫(合算)</div>
                             <div className="text-sm font-mono text-slate-300">
                                {(rec.currentInv - rec.cost).toLocaleString()} {rec.unit}
                             </div>
                          </div>
                       </div>
                    ))
                 ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-4">
                       <CheckCircle2 className="w-12 h-12 opacity-20" />
                       <p className="text-center text-sm">
                          在庫を入力すると、<br/>達成可能なクエストが表示されます。
                       </p>
                    </div>
                 )}
              </div>
           </div>

           {/* Impossible Quests */}
           <div className="bg-[#0F172A]/50 backdrop-blur-sm rounded-2xl border border-white/5 overflow-hidden transition-all">
              <div 
                 className="p-6 cursor-pointer hover:bg-white/5 transition-colors flex items-center justify-between select-none"
                 onClick={() => setIsImpossibleOpen(!isImpossibleOpen)}
              >
                 <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider flex items-center gap-3">
                    <div className="flex items-center gap-2"><Lock className="w-4 h-4" /> 達成不可能なクエスト</div>
                    <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-500">
                       不足: {impossible.length} 件
                    </span>
                 </h3>
                 <div className="text-slate-500">
                   {isImpossibleOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                 </div>
              </div>
              
              {isImpossibleOpen && (
                <div className="px-6 pb-6 space-y-3 animate-in slide-in-from-top-2 duration-300">
                   {impossible.length > 0 ? (
                      impossible.map((rec, idx) => (
                         <div key={idx} className="p-3 rounded-lg border border-slate-800 bg-slate-900/30 flex items-center justify-between gap-4 grayscale hover:grayscale-0 transition-all">
                            <div className="flex items-center gap-4 opacity-60">
                               <div className={`w-10 h-10 rounded flex flex-col items-center justify-center shrink-0 font-bold text-sm border ${getRankBadgeStyle(rec.rank)}`}>
                                  <span>{rec.rank}</span>
                               </div>
                               <div>
                                  <h4 className="font-bold text-sm text-slate-400">
                                     {rec.label}
                                  </h4>
                                  <div className="text-[10px] text-slate-500 mt-0.5">
                                     {rec.points} pt / {rec.cost.toLocaleString()}{rec.unit}
                                  </div>
                               </div>
                            </div>
                            <div className="text-right shrink-0">
                               <div className="text-[10px] text-rose-500/70 font-bold mb-0.5 flex items-center justify-end gap-1">
                                  <AlertTriangle className="w-3 h-3" /> 不足
                               </div>
                               <div className="text-xs font-mono text-rose-400">
                                  -{(rec.cost - rec.currentInv).toLocaleString()} {rec.unit}
                               </div>
                            </div>
                         </div>
                      ))
                   ) : (
                      <div className="text-center py-4 text-xs text-slate-600">
                         現在、在庫不足のクエストはありません。
                      </div>
                   )}
                </div>
              )}
           </div>

        </div>

      </div>
    </div>
  );
};

export default MobilizationGuide;
