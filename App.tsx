import React, { useState } from 'react';
import Calculator from './components/Calculator';
import ResourceManager from './components/ResourceManager';
import { Crown, Zap, Pickaxe } from 'lucide-react';

type ViewMode = 'speedup' | 'resource';

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>('speedup');

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 relative overflow-hidden selection:bg-amber-500/30">
      
      {/* Background Decorations */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '7s' }}></div>
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-600/10 rounded-full blur-[100px] mix-blend-screen"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0B1120]/70 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 group cursor-pointer" onClick={() => setView('speedup')}>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 group-hover:rotate-3">
              <Crown className="text-white w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-100 tracking-tight leading-none group-hover:text-white transition-colors">Kingshot <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">Optimizer</span></h1>
              <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-500 font-semibold mt-0.5 sm:mt-1">Unofficial Strategy Tool</p>
            </div>
          </div>

          {/* View Switcher */}
          <div className="flex bg-slate-800/50 p-1 rounded-lg border border-white/5 shrink-0">
             <button
                onClick={() => setView('speedup')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-bold transition-all ${
                  view === 'speedup' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
             >
               <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
               <span>加速<span className="hidden sm:inline">計算</span></span>
             </button>
             <button
                onClick={() => setView('resource')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-bold transition-all ${
                  view === 'resource' ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
             >
               <Pickaxe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
               <span>資源<span className="hidden sm:inline">バランス</span></span>
             </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto py-8 sm:py-12 px-4 md:px-6">
        
        {view === 'speedup' && (
          <>
            <div className="text-center mb-8 sm:mb-12 max-w-3xl mx-auto relative animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-white/5 border border-white/10 text-amber-300 text-xs font-medium mb-4 sm:mb-6 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-2 animate-pulse"></span>
                最強領主イベント攻略
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 sm:mb-6 tracking-tight drop-shadow-2xl">
                加速アイテム
              </h2>
              <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto px-2">
                「総力上昇イベント」の日と「加速消費」の日。<br className="hidden md:block"/>
                建造・研究・訓練、それぞれの効率を瞬時に計算します。
              </p>
            </div>
            <Calculator />
          </>
        )}

        {view === 'resource' && (
          <>
            <div className="text-center mb-8 sm:mb-12 max-w-3xl mx-auto relative animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-white/5 border border-white/10 text-blue-300 text-xs font-medium mb-4 sm:mb-6 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-2 animate-pulse"></span>
                資源最適化ツール
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 sm:mb-6 tracking-tight drop-shadow-2xl">
                資源バランス診断
              </h2>
              <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto px-2">
                統計画面の「総資源」を入力して、比率（20:20:4:1）をチェック。<br />
                相対的に不足している資源を見つけ出し、<br className="hidden sm:block" />効率的な採取計画を立てましょう。
              </p>
            </div>
            <ResourceManager />
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#0B1120]/50 backdrop-blur-sm py-8 mt-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-slate-600 text-sm">© 2026 Kingshot Optimizer. Unofficial Tool. v0.16</p>
        </div>
      </footer>
    </div>
  );
};

export default App;