
import React, { useState, useEffect } from 'react';
import { getJobs, getStaff, storageEvent } from './storage';
import { SampleJob, Staff } from './types';
import Dashboard from './components/Dashboard';
import SampleEntry from './components/SampleEntry';
import SlotGrid from './components/SlotGrid';
import DeadlineList from './components/DeadlineList';
import Settings from './components/Settings';
import HistoryLog from './components/HistoryLog';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Package, 
  Clock, 
  Settings as SettingsIcon,
  FileText
} from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'entry' | 'slots' | 'deadlines' | 'settings' | 'history'>('entry');
  const [jobs, setJobs] = useState<SampleJob[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setJobs(getJobs());
    setStaff(getStaff());
    setLoading(false);
  };

  useEffect(() => {
    // Initial fetch
    fetchData();

    // Listen for changes from storage.ts
    const handleDataChange = () => fetchData();
    storageEvent.addEventListener('data-change', handleDataChange);

    return () => {
      storageEvent.removeEventListener('data-change', handleDataChange);
    };
  }, []);

  const pendingJobs = jobs.filter(j => j.status === 'PENDING');
  const overdueCount = pendingJobs.filter(j => j.deadlineDate < Date.now()).length;

  const NavItem = ({ id, icon: Icon, label, badge }: { id: any, icon: any, label: string, badge?: number }) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        className={`flex flex-col items-center justify-center flex-1 py-2 transition-all relative ${
          isActive ? 'text-blue-600' : 'text-gray-400'
        }`}
      >
        <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-blue-50' : ''}`}>
          <Icon size={isActive ? 24 : 22} strokeWidth={isActive ? 2.5 : 2} />
        </div>
        <span className={`text-[10px] mt-1 font-bold ${isActive ? 'opacity-100' : 'opacity-70'}`}>
          {label}
        </span>
        {badge !== undefined && badge > 0 && (
          <span className="absolute top-1 right-1/2 translate-x-4 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white min-w-[18px]">
            {badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-20 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg text-white shadow-lg shadow-blue-100">
            <Package size={18} />
          </div>
          <h1 className="text-lg font-black text-gray-800 tracking-tight">LabMaster (Local)</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {activeTab === 'entry' && (
             <div className="text-[10px] px-2 py-1 bg-green-50 text-green-600 rounded-full font-bold uppercase tracking-widest mr-2">
               Ready
             </div>
          )}
          <button 
            onClick={() => setActiveTab('settings')}
            className={`p-2 rounded-full transition-colors ${activeTab === 'settings' ? 'bg-gray-100 text-gray-800' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <SettingsIcon size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-24 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : (
          <div className="p-4 md:p-8 animate-fadeIn max-w-4xl mx-auto">
            {activeTab === 'dashboard' && <Dashboard jobs={jobs} />}
            {activeTab === 'entry' && <SampleEntry staff={staff} jobs={jobs} onComplete={() => setActiveTab('dashboard')} />}
            {activeTab === 'slots' && <SlotGrid jobs={jobs} staff={staff} />}
            {activeTab === 'deadlines' && <DeadlineList jobs={jobs} staff={staff} />}
            {activeTab === 'history' && <HistoryLog jobs={jobs} />}
            {activeTab === 'settings' && <Settings staff={staff} />}
          </div>
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-100 px-2 pb-safe-area flex items-center h-20 z-30 shadow-[0_-5px_20px_-10px_rgba(0,0,0,0.1)]">
        <NavItem id="dashboard" icon={LayoutDashboard} label="แผงควบคุม" />
        <NavItem id="slots" icon={Package} label="ผังที่เก็บ" />
        
        <div className="flex flex-col items-center justify-center flex-1 -mt-8">
           <button 
             onClick={() => setActiveTab('entry')}
             className={`w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center transition-all active:scale-90 ${
               activeTab === 'entry' ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-white text-gray-400 border border-gray-100'
             }`}
           >
             <PlusCircle size={32} />
           </button>
           <span className={`text-[10px] mt-2 font-bold ${activeTab === 'entry' ? 'text-blue-600' : 'text-gray-400'}`}>เพิ่มใบงาน</span>
        </div>
        
        <NavItem id="deadlines" icon={Clock} label="รอจัดการ" badge={overdueCount} />
        <NavItem id="history" icon={FileText} label="ประวัติ" />
      </nav>

      <style>{`
        .pb-safe-area {
          padding-bottom: env(safe-area-inset-bottom);
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default App;
