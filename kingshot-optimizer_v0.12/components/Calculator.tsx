import React, { useState, useMemo } from 'react';
import { CalculationResult } from '../types';
import { BUILDINGS } from '../constants';
import { Clock, Zap, Calculator as CalcIcon, AlertCircle, ArrowRight, TrendingUp, Hammer, FlaskConical, Swords, Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

type Mode = 'building' | 'research' | 'troop';

const Calculator: React.FC = () => {
  const [mode, setMode] = useState<Mode>('building');

  // Building State
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>(BUILDINGS[0].id);
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  
  // Manual Input State (Research/Troop)
  const [manualPowerStr, setManualPowerStr] = useState<string>('');

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
    } else {
      // Research or Troop
      return parseInt(manualPowerStr.replace(/,/g, '')) || 0;
    }
  }, [mode, selectedBuilding, selectedLevel, manualPowerStr]);

  // Points Multipliers
  // Building/Research: 1 Power = 30 Points
  // Troop: 1 Power = 20 Points
  const eventPointsPerPower = mode === 'troop' ? 20 : 30;
  const speedupPointsPerMinute = 300;

  // Threshold Calculation
  // Cost (Speedup Points) = Minutes * 300
  // Gain (Event Points) = Power * (20 or 30)
  // Threshold (Minutes) happens when Cost = Gain
  // Minutes * 300 = Power * EventMultiplier
  // Minutes = Power * (EventMultiplier / 300)
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
          <div className="flex p-1 bg-slate-800/50 rounded-xl mb-8 border border-white/5">
            {(Object.keys(modeInfo) as Mode[]).map((m) => {
              const info = modeInfo[m];
              const isActive = mode === m;
              const Icon = info.icon;
              return (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all duration-300
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
            {mode === 'building' ? '建造データの入力' : 
             mode === 'research' ? '研究データの入力' : 
             '訓練データの入力'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Conditional Inputs */}
            {mode === 'building' ? (
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
            ) : (
              // Research & Troop Manual Input
              <div className="md:col-span-2 space-y-3">
                <div className="flex justify-between items-baseline">
                  <label className="text-sm font-semibold text-slate-300 uppercase tracking-wider">総力の上昇値</label>
                  {mode === 'troop' && <span className="text-xs text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded">データ収集中のため手動入力</span>}
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
                  {mode === 'research' ? '研究完了時に増加する戦力値を入力してください' : '訓練・昇格完了時に増加する戦力値を入力してください'}
                </p>
              </div>
            )}
          </div>

          {/* Time Input */}
          <div className="mt-8 pt-8 border-t border-white/5">
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
              <div className="relative z-10 space-y-6">
                <div className="inline-block">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-6 bg-slate-800/50 px-4 py-1.5 rounded-full backdrop-blur">
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
                    <p className="text-amber-200/80 font-medium text-lg">
                      {modeInfo[mode].label}ポイントデーの方が効率的です
                    </p>
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
                    <p className="text-blue-200/80 font-medium text-lg">加速消費デーまで温存しましょう</p>
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
              <div className="group">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-400 text-sm">上昇する総力</span>
                  <span className="text-lg font-bold text-white font-mono">{powerIncrease.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-slate-600 h-full w-full opacity-50"></div>
                </div>
              </div>

              <div className="group">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-400 text-sm">お得ライン (境目)</span>
                  <span className="text-lg font-bold text-amber-400 font-mono">
                    {thresholdMinutes.toLocaleString(undefined, { maximumFractionDigits: 1 })} <span className="text-xs text-amber-400/50">分</span>
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full w-1/2 opacity-80"></div>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 text-right">
                  1総力 = {eventPointsPerPower}pt / 1分加速 = 300pt
                </p>
              </div>

              <div className="group p-3 -mx-3 rounded-lg bg-white/5 border border-white/5">
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
             <div className="h-40 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart 
                    data={chartData} 
                    layout="vertical" 
                    margin={{ top: 0, right: 80, left: 0, bottom: 0 }} 
                    barSize={24}
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
          <h4 className="font-bold text-blue-300">計算ロジックについて</h4>
          <p>
            境目となる時間（分） = 上昇する総力 × (イベント倍率 ÷ 300) <br/>
            建造・研究は倍率30（÷10）、兵士は倍率20（÷15）で計算されます。<br/>
            残り時間がこの境目より<strong>短い</strong>場合、イベントP（今）の方がお得です。
          </p>
        </div>
      </div>
    </div>
  );
};

export default Calculator;