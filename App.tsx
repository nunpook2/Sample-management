
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { SampleJob, Staff } from './types';
import Dashboard from './components/Dashboard';
import SampleEntry from './components/SampleEntry';
import SlotGrid from './components/SlotGrid';
import DeadlineList from './components/DeadlineList';
import Settings from './components/Settings';
import { LayoutGrid, Plus, Layout, History, Settings as SettingsIcon, ShieldCheck } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'entry' | 'slots' | 'deadlines' | 'settings'>('entry');
  const [jobs, setJobs] = useState<SampleJob[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qJobs = query(collection(db, "jobs"), orderBy("entryDate", "desc"));
    const unsubJobs = onSnapshot(qJobs, (snapshot) => {
      setJobs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SampleJob)));
      setLoading(false);
    });
    const unsubStaff = onSnapshot(query(collection(db, "staff")), (snapshot) => {
      setStaff(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff)));
    });
    return () => { unsubJobs(); unsubStaff(); };
  }, []);

  const overdueCount = jobs.filter(j => j.status === 'PENDING' && j.deadlineDate < Date.now()).length;

  const NavButton = ({ id, icon: Icon, label, badge }: any) => {
    const isActive = activeTab === id;
    return (
      <button onClick={() => setActiveTab(id)} className={`relative flex flex-col items-center justify-center flex-1 transition-all duration-500 ${isActive ? 'text-indigo-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}>
        <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'drop-shadow-md' : ''} />
        <span className={`text-[9px] mt-1 font-extrabold uppercase tracking-tighter transition-all ${isActive ? 'opacity-100' : 'opacity-40'}`}>{label}</span>
        {badge > 0 && <span className="absolute top-0 right-1/2 translate-x-4 bg-rose-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">{badge}</span>}
      </button>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 px-6 py-5 bg-white/60 backdrop-blur-xl border-b border-slate-200/50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 rotate-3 transition-transform hover:rotate-0">
            <ShieldCheck size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight leading-none uppercase">LabMaster</h1>
            <span className="text-[10px] text-indigo-500 font-bold tracking-widest uppercase">Premium Edition</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 rounded-full text-[9px] font-black text-white uppercase tracking-widest shadow-lg shadow-slate-200">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
          Live Control
        </div>
      </header>

      <main className="flex-1 pb-32 pt-6 px-4 max-w-5xl mx-auto w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Secure Handshaking...</p>
          </div>
        ) : (
          <div className="animate-reveal">
            {activeTab === 'dashboard' && <Dashboard jobs={jobs} />}
            {activeTab === 'entry' && <SampleEntry staff={staff} jobs={jobs} onComplete={() => setActiveTab('dashboard')} />}
            {activeTab === 'slots' && <SlotGrid jobs={jobs} staff={staff} />}
            {activeTab === 'deadlines' && <DeadlineList jobs={jobs} staff={staff} />}
            {activeTab === 'settings' && <Settings staff={staff} />}
          </div>
        )}
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md h-20 bg-slate-900/95 backdrop-blur-2xl rounded-[2.5rem] flex items-center px-4 shadow-2xl z-50 border border-white/10 overflow-visible">
        <NavButton id="dashboard" icon={Layout} label="Stat" />
        <NavButton id="slots" icon={LayoutGrid} label="Slots" />
        
        <div className="relative -top-8 px-2">
          <button onClick={() => setActiveTab('entry')} className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center transition-all duration-500 shadow-2xl ${activeTab === 'entry' ? 'bg-white text-indigo-600 rotate-90 scale-110 shadow-indigo-500/30' : 'bg-indigo-600 text-white hover:scale-110 shadow-indigo-600/40'}`}>
            <Plus size={36} strokeWidth={3} />
          </button>
        </div>

        <NavButton id="deadlines" icon={History} label="Queue" badge={overdueCount} />
        <NavButton id="settings" icon={SettingsIcon} label="Prefs" />
      </nav>

      <style>{`
        @keyframes reveal { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .animate-reveal { animation: reveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

export default App;
