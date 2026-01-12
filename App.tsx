import React, { useState, useEffect } from 'react';
import { Lighthouse } from './components/Lighthouse';
import { ControlPanel } from './components/ControlPanel';
import { EarthquakeLogInput } from './components/EarthquakeLogInput';
import { HistoryList } from './components/HistoryList';
import { IntensityLevel, SeismicLog, LevelConfig } from './types';

// Simple UUID generator
const generateId = () => Math.random().toString(36).substr(2, 9);

function App() {
  const [logs, setLogs] = useState<SeismicLog[]>([]);
  const [currentLevel, setCurrentLevel] = useState<IntensityLevel | null>(null);
  const [isInputting, setIsInputting] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'logs'>('home');
  const [isLoading, setIsLoading] = useState(true);

  // Load from API
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch('/api/logs');
        if (response.ok) {
          const data = await response.json();
          setLogs(data);
        } else {
          // Fallback to localstorage if API fails (e.g. local dev without functions)
          const saved = localStorage.getItem('seismo-logs');
          if (saved) setLogs(JSON.parse(saved));
        }
      } catch (e) {
        console.error("Failed to fetch logs, using local storage");
        const saved = localStorage.getItem('seismo-logs');
        if (saved) setLogs(JSON.parse(saved));
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, []);

  // Sync to LocalStorage as backup
  useEffect(() => {
    localStorage.setItem('seismo-logs', JSON.stringify(logs));
  }, [logs]);

  // Handle visual Level 1 Alarm
  useEffect(() => {
    // If it's Level 1, we might want to play a sound in a real app, 
    // but here we just ensure the visual state is consistent.
    if (currentLevel === IntensityLevel.Level1) {
        document.body.style.backgroundColor = '#1a0505';
    } else {
        document.body.style.backgroundColor = '#f0f4f8';
    }
    
    return () => {
        document.body.style.backgroundColor = '#f0f4f8';
    }
  }, [currentLevel]);

  const handleLevelSelect = (level: IntensityLevel) => {
    setCurrentLevel(level);
    setIsInputting(true);
    
    // Scroll to input if needed, simple implementation
    setTimeout(() => {
        window.scrollTo({ top: 300, behavior: 'smooth' });
    }, 100);
  };

  const handleLogSubmit = async (content: string, isAftershock: boolean) => {
    if (!currentLevel) return;

    const newLog: SeismicLog = {
      id: generateId(),
      intensity: currentLevel,
      content,
      isAftershock,
      timestamp: Date.now(),
    };

    // Optimistic update
    setLogs([newLog, ...logs]);
    setIsInputting(false);
    setCurrentLevel(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLog),
      });
    } catch (e) {
      console.error("Failed to sync log to server");
    }
  };

  const handleCancel = () => {
    setIsInputting(false);
    setCurrentLevel(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    const oldLogs = [...logs];
    setLogs(logs.filter(l => l.id !== id));

    try {
      const response = await fetch(`/api/logs/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error("Delete failed");
    } catch (e) {
      console.error("Failed to delete log from server, reverting");
      setLogs(oldLogs);
    }
  };

  // Determine dynamic background gradient based on current level
  const bgGradient = currentLevel 
    ? LevelConfig[currentLevel].bgGradient 
    : 'from-blue-200 to-white';

  return (
    <div className={`min-h-screen transition-colors duration-1000 ${currentLevel === IntensityLevel.Level1 ? 'bg-black' : 'bg-slate-50'}`}>
      
      {/* Level 1 Overlay Effects */}
      {currentLevel === IntensityLevel.Level1 && (
         <div className="fixed inset-0 pointer-events-none z-50">
             <div className="absolute inset-0 bg-red-900 mix-blend-overlay opacity-50 animate-pulse"></div>
             <div className="scanlines opacity-30"></div>
             <div className="absolute top-10 left-0 w-full text-center">
                <h1 className="text-6xl font-black text-red-600 opacity-20 animate-ping">WARNING</h1>
             </div>
         </div>
      )}

      {/* Main Container */}
      <div className={`max-w-md mx-auto min-h-screen relative flex flex-col shadow-2xl overflow-hidden bg-gradient-to-b ${bgGradient} transition-all duration-1000`}>
        
        {/* Header / Lighthouse Area */}
        <header className="relative z-10">
           <Lighthouse level={currentLevel} />
           
           <div className="absolute top-6 left-6 z-20">
              <h1 className={`text-2xl font-black tracking-tight ${currentLevel === IntensityLevel.Level1 ? 'text-red-500' : 'text-slate-800'}`}>
                Seismo-Mind
              </h1>
              <p className={`text-xs font-bold opacity-60 ${currentLevel === IntensityLevel.Level1 ? 'text-red-400' : 'text-slate-600'}`}>
                心理震感记录仪
              </p>
           </div>
        </header>

        {/* Dynamic Content Area */}
        <main className="flex-1 relative z-20 -mt-10 pb-24">
          
          {isInputting && currentLevel ? (
            <EarthquakeLogInput 
                level={currentLevel} 
                onSubmit={handleLogSubmit} 
                onCancel={handleCancel} 
            />
          ) : (
            <div className="px-4">
              {activeTab === 'home' ? (
                <ControlPanel 
                  onSelectLevel={handleLevelSelect} 
                  selectedLevel={currentLevel} 
                />
              ) : (
                <div className="mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h2 className="text-xl font-bold text-slate-800 mb-4 px-2">观测日志</h2>
                  {isLoading ? (
                    <div className="flex justify-center py-10">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <HistoryList logs={logs} onDelete={handleDelete} />
                  )}
                </div>
              )}
            </div>
          )}

        </main>

        {/* Bottom Navigation */}
        {!isInputting && (
          <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/80 backdrop-blur-lg border-t border-slate-200 flex justify-around items-center py-3 px-6 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <button 
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'home' ? 'text-blue-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              <span className="text-[10px] font-bold uppercase tracking-wider">记录</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('logs')}
              className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'logs' ? 'text-blue-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span className="text-[10px] font-bold uppercase tracking-wider">日志</span>
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}

export default App;
