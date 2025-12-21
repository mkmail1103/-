import React, { useState, useMemo } from 'react';
import { CalculationResult } from '../types';
import { BUILDINGS, TROOP_DATA } from '../constants';
import { Clock, Zap, Calculator as CalcIcon, AlertCircle, ArrowRight, TrendingUp, Hammer, FlaskConical, Swords, Info, Users, ChevronsUp, Gauge, Timer, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

type Mode = 'building' | 'research' | 'troop';
type TroopSubMode = 'train' | 'promote';

const Calculator: React.FC = () => {
  const [mode, setMode] = useState<Mode>('building');

  // Building State
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>(BUILDINGS[0].id);
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  
  // Research State (Manual)
  const [manualPowerStr, setManualPowerStr] = useState<string>('');

  // Troop State
  const [troopSubMode, setTroopSubMode] = useState<TroopSubMode>('train');
  const [troopTargetLevel, setTroopTargetLevel] = useState<number>(10);
  const [troopSourceLevel, setTroopSourceLevel] = useState<number>(9);
  const [troopCount, setTroopCount] = useState<string>('');

  // Time Input State
  const [days, setDays] = useState<string>('0');
  const [hours, setHours] = useState<string>('0');
  const [minutes, setMinutes] = useState<string>('0');

  // --- Derived Values ---

  const selectedBuilding = useMemo(() => 
    BUILDINGS.find(b => b.id === selectedBuildingId) || BUILDINGS[0], 
  [selectedBuildingId]);

  // Determine Power Increase based on Mode
  const powerIncrease = useMemo(() => {
    if (mode === 'building') {
      const levelData = selectedBuilding.levels.find(l => l.level === selectedLevel);
      return levelData ? levelData.powerIncrease : 0;
    } 
    else if (mode === 'research') {
      return parseInt(manualPowerStr.replace(/,/g, '')) || 0;
    }
    else if (mode === 'troop') {
      const count = parseInt(troopCount.replace(/,/g, '')) || 0;
      const target = TROOP_DATA.find(t => t.level === troopTargetLevel)?.power || 0;
      
      if (troopSubMode === 'train') {
        // Training: Full power of the unit * count
        return target * count;
      } else {
        // Promotion: (Target Power - Source Power) * count
        const source = TROOP_DATA.find(t => t.level === troopSourceLevel)?.power || 0;
        // Ensure positive gain
        const diff = Math.max(0, target - source);
        return diff * count;
      }
    }
    return 0;
  }, [mode, selectedBuilding, selectedLevel, manualPowerStr, troopSubMode, troopTargetLevel, troopSourceLevel, troopCount]);

  // Points Multipliers
  // Building/Research: 1 Power = 30 Points
  // Troop: 1 Power = 20 Points
  const eventPointsPerPower = mode === 'troop' ? 20 : 30;
  const speedupPointsPerMinute = 300;

  // Threshold Calculation
  const thresholdMinutes = useMemo(() => {
    return powerIncrease * (eventPointsPerPower / speedupPointsPerMinute);
  }, [powerIncrease, eventPointsPerPower]);
  
  const currentTotalMinutes = useMemo(() => {
    const d = parseInt(days) || 0;
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    return (d * 1440) + (h * 60) + m;
  }, [days, hours, minutes]);

  // Points calculation for display
  const pointsEvent1 = powerIncrease * eventPointsPerPower;
  const pointsEvent2 = currentTotalMinutes * speedupPointsPerMinute;

  // Efficiency Calculation (Points per Minute)
  const efficiencyEvent1 = currentTotalMinutes > 0 ? pointsEvent1 / currentTotalMinutes : 0;
  const efficiencyEvent2 = speedupPointsPerMinute; // Always 300

  let result: CalculationResult = CalculationResult.EQUAL;
  if (currentTotalMinutes === 0 && powerIncrease === 0) {
    // No input
  } else if (currentTotalMinutes < thresholdMinutes) {
    result = CalculationResult.ACCELERATE_NOW;
  } else if (currentTotalMinutes > thresholdMinutes) {
    result = CalculationResult.WAIT_FOR_SPEEDUP;
  }

  const chartData = [
    {
      name: '今加速 (イベントP)',
      points: pointsEvent1,
      fill: '#fbbf24', // amber-400
      stroke: '#f59e0b',
    },
    {
      name: '後で加速 (加速P)',
      points: pointsEvent2,
      fill: '#60a5fa', // blue-400
      stroke: '#3b82f6',
    },
  ];

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => e.target.select();

  // Mode Display Info
  const modeInfo = {
    building: { label: '建造', icon: Hammer, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    research: { label: '研究', icon: FlaskConical, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    troop: { label: '兵士', icon: Swords, color: 'text-rose-400', bg: 'bg-rose-400/10' },
  };

  const CurrentIcon = modeInfo[mode].icon;

  // Helper to format minutes into D H M
  const formatThresholdTime = (minutes: number) => {
    const d = Math.floor(minutes / 1440);
    const h = Math.floor((minutes % 1440) / 60);
    const m = Math.round(minutes % 60);

    if (d > 0) return `${d}日 ${h}時間 ${m}分`;
    if (h > 0) return `${h}時間 ${m}分`;
    return `${m}分`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      
      {/* Input Section */}
      <div className="relative group">
        <div className={`absolute -inset-0.5 bg-gradient-to-r rounded-3xl opacity-30 group-hover:opacity-50 blur transition duration-500
          ${mode === 'building' ? 'from-amber-500 to-orange-600' : 
            mode === 'research' ? 'from-purple-500 to-indigo-600' : 
            'from-rose-500 to-red-600'}`}
        ></div>
        <div className="relative bg-[#0F172A]/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6 md:p-10 shadow-2xl">
          
          {/* Tabs */}
          <div className="flex p-1 bg-slate-800/50 rounded-xl mb-8 border border-white/5 overflow-x-auto">
            {(Object.keys(modeInfo) as Mode[]).map((m) => {
              const info = modeInfo[m];
              const isActive = mode === m;
              const Icon = info.icon;
              return (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-bold transition-all duration-300 whitespace-nowrap
                    ${isActive 
                      ? 'bg-slate-700 text-white shadow-lg ring-1 ring-white/10' 
                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                    }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? info.color : ''}`} />
                  {info.label}
                </button>
              );
            })}
          </div>

          <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-8">
            <div className={`p-2 rounded-lg ${modeInfo[mode].bg} ${modeInfo[mode].color} transition-colors duration-300`}>
              <CurrentIcon className="w-6 h-6" />
            </div>
            {mode === 'building' && '建造データの入力'}
            {mode === 'research' && '研究データの入力'}
            {mode === 'troop' && '訓練・昇格データの入力'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* --- BUILDING MODE --- */}
            {mode === 'building' && (
              <>
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-300 uppercase tracking-wider">施設の種類</label>
                  <div className="relative">
                    <select
                      value={selectedBuildingId}
                      onChange={(e) => {
                        setSelectedBuildingId(e.target.value);
                        setSelectedLevel(1); 
                      }}
                      className="w-full appearance-none bg-[#1E293B] border border-slate-700 hover:border-slate-500 rounded-xl px-4 py-4 text-slate-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none shadow-inner text-base"
                    >
                      {BUILDINGS.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ArrowRight className="w-4 h-4 rotate-90" />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-300 uppercase tracking-wider">強化後のレベル (目標)</label>
                  <div className="relative">
                    <select
                      value={selectedLevel}
                      onChange={(e) => setSelectedLevel(parseInt(e.target.value))}
                      className="w-full appearance-none bg-[#1E293B] border border-slate-700 hover:border-slate-500 rounded-xl px-4 py-4 text-slate-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none shadow-inner text-base"
                    >
                      {selectedBuilding.levels.map((l) => (
                        <option key={l.level} value={l.level}>
                          Lv. {l.level} (上昇値: {l.powerIncrease.toLocaleString()})
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ArrowRight className="w-4 h-4 rotate-90" />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* --- RESEARCH MODE (Manual) --- */}
            {mode === 'research' && (
              <div className="md:col-span-2 space-y-3">
                <div className="flex justify-between items-baseline">
                  <label className="text-sm font-semibold text-slate-300 uppercase tracking-wider">総力の上昇値</label>
                  <span className="text-xs text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded">手動入力モード</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    placeholder="例: 12000"
                    value={manualPowerStr}
                    onFocus={handleFocus}
                    onChange={(e) => setManualPowerStr(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 hover:border-slate-500 rounded-xl pl-4 pr-12 py-4 text-xl font-mono text-white focus:ring-2 focus:ring-amber-500 outline-none shadow-inner transition-colors"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 font-bold">
                    UP
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  研究完了時に増加する戦力値を入力してください
                </p>
              </div>
            )}

            {/* --- TROOP MODE (Training/Promotion) --- */}
            {mode === 'troop' && (
              <div className="md:col-span-2 space-y-6">
                
                {/* Troop Sub-Mode Toggle */}
                <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                  <button
                    onClick={() => setTroopSubMode('train')}
                    className={`flex-1 py-4 px-4 rounded-xl border-2 font-bold flex items-center justify-center gap-2 transition-all ${
                      troopSubMode === 'train' 
                        ? 'border-rose-500 bg-rose-500/10 text-rose-100' 
                        : 'border-slate-700 bg-[#1E293B] text-slate-500 hover:border-slate-600'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    訓練 (新規作成)
                  </button>
                  <button
                    onClick={() => setTroopSubMode('promote')}
                    className={`flex-1 py-4 px-4 rounded-xl border-2 font-bold flex items-center justify-center gap-2 transition-all ${
                      troopSubMode === 'promote' 
                        ? 'border-rose-500 bg-rose-500/10 text-rose-100' 
                        : 'border-slate-700 bg-[#1E293B] text-slate-500 hover:border-slate-600'
                    }`}
                  >
                    <ChevronsUp className="w-4 h-4" />
                    昇格 (レベルアップ)
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-800/30 rounded-xl border border-white/5">
                  
                  {troopSubMode === 'promote' && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-400">元のレベル (昇格前)</label>
                      <select
                        value={troopSourceLevel}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setTroopSourceLevel(val);
                          // Ensure target is always higher
                          if (val >= troopTargetLevel) setTroopTargetLevel(Math.min(10, val + 1));
                        }}
                        className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-3 text-slate-200 outline-none focus:ring-2 focus:ring-rose-500"
                      >
                        {TROOP_DATA.slice(0, 9).map((t) => (
                          <option key={t.level} value={t.level}>Lv.{t.level} {t.name} (総力: {t.power})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className={`space-y-2 ${troopSubMode === 'train' ? 'md:col-span-2' : ''}`}>
                    <label className="text-xs font-semibold text-slate-400">
                      {troopSubMode === 'train' ? '訓練する兵士のレベル' : '目標レベル (昇格後)'}
                    </label>
                    <select
                      value={troopTargetLevel}
                      onChange={(e) => setTroopTargetLevel(parseInt(e.target.value))}
                      className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-3 text-slate-200 outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      {TROOP_DATA.filter(t => troopSubMode === 'train' || t.level > troopSourceLevel).map((t) => (
                        <option key={t.level} value={t.level}>Lv.{t.level} {t.name} (総力: {t.power})</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-semibold text-slate-400">
                      {troopSubMode === 'train' ? '訓練人数' : '昇格させる人数'}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        placeholder="例: 1000"
                        value={troopCount}
                        onFocus={handleFocus}
                        onChange={(e) => setTroopCount(e.target.value)}
                        className="w-full bg-[#1E293B] border border-slate-700 rounded-lg pl-4 pr-12 py-3 font-mono text-lg text-white focus:ring-2 focus:ring-rose-500 outline-none"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">人</span>
                    </div>
                  </div>
                </div>

                {/* Calculation Preview */}
                <div className="text-center text-sm text-slate-400">
                  {troopSubMode === 'train' ? (
                     <span>総力 {TROOP_DATA.find(t => t.level === troopTargetLevel)?.power} × {parseInt(troopCount || '0').toLocaleString()}人</span>
                  ) : (
                    <span>(目標 {TROOP_DATA.find(t => t.level === troopTargetLevel)?.power} - 元 {TROOP_DATA.find(t => t.level === troopSourceLevel)?.power}) × {parseInt(troopCount || '0').toLocaleString()}人</span>
                  )}
                  <span className="mx-2">=</span>
                  <span className="text-rose-400 font-bold text-lg">+{powerIncrease.toLocaleString()} 総力UP</span>
                </div>
              </div>
            )}
          </div>

          {/* Threshold Banner (New) */}
          {powerIncrease > 0 && (
            <div className="mt-8 p-0.5 rounded-xl bg-gradient-to-r from-amber-500/50 to-blue-500/50 relative overflow-hidden group shadow-lg">
              <div className="absolute inset-0 bg-white/5 blur-xl group-hover:bg-white/10 transition-colors"></div>
              <div className="relative bg-[#0F172A] rounded-[10px] p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                
                <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto justify-center md:justify-start">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 shrink-0">
                    <Timer className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">お得ライン (境目)</span>
                      <span className="bg-slate-700 text-[10px] px-1.5 py-0.5 rounded text-slate-300 whitespace-nowrap hidden sm:inline-block">入力不要で確認可能</span>
                    </div>
                    {/* Adjusted text size for mobile optimization */}
                    <div className="text-2xl md:text-3xl font-black text-white font-mono tracking-tight leading-none">
                      {formatThresholdTime(thresholdMinutes)}
                    </div>
                  </div>
                </div>

                <div className="text-center md:text-right w-full md:w-auto bg-white/5 md:bg-transparent p-3 md:p-0 rounded-lg">
                  <div className="flex flex-col items-center md:items-end gap-0.5">
                    <p className="text-xs md:text-sm text-slate-300 leading-snug">
                      残り時間がこれより<span className="text-amber-400 font-bold text-sm md:text-base mx-1">短ければ</span>今加速！
                    </p>
                    <p className="text-xs md:text-sm text-slate-300 leading-snug">
                      <span className="text-blue-400 font-bold text-sm md:text-base mr-1">長ければ</span>待機推奨
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Time Input */}
          <div className={`pt-8 border-t border-white/5 ${powerIncrease > 0 ? 'mt-8' : 'mt-8'}`}>
            <label className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 block">残り時間 (加速する時間)</label>
            <div className="grid grid-cols-3 gap-4 md:gap-6">
              {[
                { label: '日', value: days, setter: setDays },
                { label: '時間', value: hours, setter: setHours },
                { label: '分', value: minutes, setter: setMinutes }
              ].map((field, idx) => (
                <div key={idx} className="relative">
                  <input
                    type="number"
                    min="0"
                    value={field.value}
                    onFocus={handleFocus}
                    onChange={(e) => field.setter(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 hover:border-slate-500 rounded-xl pl-4 pr-12 py-4 text-xl font-mono text-white focus:ring-2 focus:ring-amber-500 outline-none shadow-inner transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">{field.label}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4 items-baseline gap-2">
              <span className="text-slate-400 text-sm">合計時間:</span>
              <span className="text-2xl font-bold text-white tabular-nums tracking-tight">
                {currentTotalMinutes.toLocaleString()} 
                <span className="text-base font-normal text-slate-500 ml-1">分</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Result Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        
        {/* Verdict Card */}
        <div className={`relative overflow-hidden rounded-2xl p-1 transition-all duration-500 shadow-2xl group ${
            result === CalculationResult.ACCELERATE_NOW ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
            result === CalculationResult.WAIT_FOR_SPEEDUP ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
            'bg-slate-800'
          }`}>
          <div className="h-full bg-[#0F172A] rounded-xl p-8 flex flex-col justify-center items-center text-center relative overflow-hidden">
            
            {/* Background Glow */}
            <div className={`absolute top-0 left-0 w-full h-full opacity-20 blur-3xl transition-colors duration-500 ${
              result === CalculationResult.ACCELERATE_NOW ? 'bg-amber-500' :
              result === CalculationResult.WAIT_FOR_SPEEDUP ? 'bg-blue-500' :
              'bg-transparent'
            }`}></div>

            {currentTotalMinutes > 0 || (powerIncrease > 0 && mode !== 'building') ? (
              <div className="relative z-10 w-full space-y-6">
                <div className="inline-block">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-2 bg-slate-800/50 px-4 py-1.5 rounded-full backdrop-blur">
                    Analysis Result
                  </h3>
                </div>
                
                {result === CalculationResult.ACCELERATE_NOW && (
                  <div className="animate-in fade-in zoom-in duration-500">
                    <div className="w-24 h-24 mx-auto bg-amber-500/20 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-amber-500/20 ring-1 ring-amber-500/50">
                      <Zap className="w-12 h-12 text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                    </div>
                    <div className="text-5xl md:text-6xl font-black text-white mb-3 tracking-tight drop-shadow-lg">
                      <span className="text-transparent bg-clip-text bg-gradient-to-b from-amber-300 to-amber-500">今すぐ</span>加速
                    </div>
                    <p className="text-amber-200/80 font-medium text-lg mb-8">
                      {modeInfo[mode].label}ポイントデーの方が効率的です
                    </p>
                    
                    {/* Embedded Threshold Info (Optional Confirmation) */}
                    <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-amber-500/30 mx-auto max-w-sm">
                      <div className="flex items-center justify-center gap-2 text-amber-100 text-xs font-semibold uppercase tracking-wider mb-1">
                        <CheckCircle2 className="w-3 h-3" />
                        判定基準
                      </div>
                      <div className="text-sm text-amber-100/80">
                         お得ライン {formatThresholdTime(thresholdMinutes)} ＞ 今回の時間
                      </div>
                    </div>
                  </div>
                )}
                
                {result === CalculationResult.WAIT_FOR_SPEEDUP && (
                  <div className="animate-in fade-in zoom-in duration-500">
                    <div className="w-24 h-24 mx-auto bg-blue-500/20 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20 ring-1 ring-blue-500/50">
                      <Clock className="w-12 h-12 text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    </div>
                    <div className="text-5xl md:text-6xl font-black text-white mb-3 tracking-tight drop-shadow-lg">
                      <span className="text-transparent bg-clip-text bg-gradient-to-b from-blue-300 to-blue-500">待機</span>推奨
                    </div>
                    <p className="text-blue-200/80 font-medium text-lg mb-8">加速消費デーまで温存しましょう</p>

                    <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-blue-500/30 mx-auto max-w-sm">
                      <div className="flex items-center justify-center gap-2 text-blue-100 text-xs font-semibold uppercase tracking-wider mb-1">
                         <CheckCircle2 className="w-3 h-3" />
                         判定基準
                      </div>
                      <div className="text-sm text-blue-100/80">
                         お得ライン {formatThresholdTime(thresholdMinutes)} ＜ 今回の時間
                      </div>
                    </div>
                  </div>
                )}
                
                {result === CalculationResult.EQUAL && (
                  <div className="animate-in fade-in zoom-in duration-500">
                    <div className="w-24 h-24 mx-auto bg-slate-700/30 rounded-full flex items-center justify-center mb-6">
                      <AlertCircle className="w-12 h-12 text-slate-400" />
                    </div>
                    <div className="text-4xl font-bold text-slate-200 mb-3">どちらでも同じ</div>
                    <p className="text-slate-400">獲得ポイントは同等です</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-slate-600 flex flex-col items-center py-10">
                <CalcIcon className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-sm font-medium tracking-wide">データを入力して分析を開始</p>
              </div>
            )}
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-[#0F172A]/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6 md:p-8 flex flex-col justify-between shadow-xl">
          <div>
            <h3 className="text-white font-bold mb-6 flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-amber-500" />
              詳細データ ({modeInfo[mode].label})
            </h3>
            <div className="space-y-5">
              
              {/* Efficiency Comparison Section */}
              <div className="group bg-white/5 rounded-xl p-4 border border-white/5">
                <div className="flex items-center gap-2 mb-3 text-sm text-slate-300 font-semibold">
                  <Gauge className="w-4 h-4 text-emerald-400" />
                  加速効率 (1分あたりの獲得Pt)
                </div>
                
                {/* Current Efficiency */}
                <div className="flex justify-between items-center mb-2">
                   <span className="text-slate-400 text-xs">今回の効率 ({modeInfo[mode].label}デー)</span>
                   <span className={`text-base font-bold font-mono ${efficiencyEvent1 > 300 ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {Math.round(efficiencyEvent1).toLocaleString()} <span className="text-[10px]">pt/分</span>
                   </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-3">
                  <div className={`h-full rounded-full ${efficiencyEvent1 > 300 ? 'bg-emerald-500' : 'bg-slate-600'}`} style={{ width: `${Math.min(100, (efficiencyEvent1 / Math.max(efficiencyEvent1, 400)) * 100)}%` }}></div>
                </div>

                {/* Speedup Event Efficiency (Fixed) */}
                <div className="flex justify-between items-center mb-2">
                   <span className="text-slate-400 text-xs">加速消費デー (固定)</span>
                   <span className="text-base font-bold font-mono text-blue-400">
                      300 <span className="text-[10px]">pt/分</span>
                   </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (300 / Math.max(efficiencyEvent1, 400)) * 100)}%` }}></div>
                </div>
              </div>

              <div className="group p-3 -mx-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 text-sm">入力された残り時間</span>
                  <span className={`text-xl font-bold font-mono ${
                    currentTotalMinutes > thresholdMinutes ? 'text-blue-400' : 'text-amber-400'
                  }`}>
                    {currentTotalMinutes.toLocaleString()} <span className="text-xs text-slate-500">分</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Comparison Chart */}
          <div className="mt-8 pt-6 border-t border-white/5">
             <div className="h-32 w-full">
               <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                 <BarChart 
                    data={chartData} 
                    layout="vertical" 
                    margin={{ top: 0, right: 80, left: 0, bottom: 0 }} 
                    barSize={20}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.5} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={110} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 500}} axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{fill: 'rgba(255,255,255,0.05)'}}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                      formatter={(value: number) => [value.toLocaleString() + ' pts', '獲得ポイント']}
                      itemStyle={{ color: '#e2e8f0' }}
                    />
                    <Bar dataKey="points" radius={[0, 4, 4, 0]} animationDuration={1000}>
                      <LabelList 
                        dataKey="points" 
                        position="right" 
                        fill="#cbd5e1" 
                        fontSize={13} 
                        fontWeight="bold"
                        formatter={(value: number) => value.toLocaleString()} 
                      />
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.stroke} strokeWidth={1} fillOpacity={0.8} />
                      ))}
                    </Bar>
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 bg-blue-900/20 rounded-xl p-4 border border-blue-500/20 text-sm text-blue-200/80 backdrop-blur-sm">
        <div className="shrink-0 mt-0.5">
          <Info className="w-5 h-5 text-blue-400" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-blue-300">計算ロジックと戦略メモ</h4>
          <p className="mb-2">
            境目となる時間（分） = 上昇する総力 × (イベント倍率 ÷ 300) <br/>
            建造・研究は倍率30（÷10）、兵士は倍率20（÷15）で計算されます。
          </p>
          {mode === 'troop' && (
            <p className="text-amber-200/90 font-medium bg-amber-900/30 p-2 rounded border border-amber-500/30">
              ⚡ <strong>兵士訓練のヒント:</strong><br/>
              高レベル兵士（T6以上など）は、作成にかかる時間に対して上昇する総力が非常に高いため、
              <strong>加速消費イベント（固定300pt/分）で加速を使うと損をする</strong>ケースがほとんどです。<br/>
              「加速効率」が300を超えている場合、総力アップイベントで加速を使い切りましょう。
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calculator;