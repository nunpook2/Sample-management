
import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { SampleJob, Staff, ActionType } from '../types';
import { AlertCircle, CheckCircle2, Package, Trash2, Zap, ArrowRight, Lock, Key } from 'lucide-react';

interface Props { staff: Staff[]; jobs: SampleJob[]; onComplete: () => void; }

const SampleEntry: React.FC<Props> = ({ staff, jobs, onComplete }) => {
  const [jobNo, setJobNo] = useState('');
  const [action, setAction] = useState<ActionType>('DISPOSE');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);
  const [showDevOptions, setShowDevOptions] = useState(false);
  const [headerClicks, setHeaderClicks] = useState(0);
  const [successData, setSuccessData] = useState<any>(null);

  const handleHeaderClick = () => {
    if (headerClicks + 1 >= 5) { setShowDevOptions(!showDevOptions); setHeaderClicks(0); }
    else { setHeaderClicks(headerClicks + 1); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobNo || !selectedStaff) { setError('กรุณาระบุข้อมูลให้ครบถ้วน'); return; }

    const prefix = action === 'DISPOSE' ? 'D' : 'R';
    const pendingJobs = jobs.filter(j => j.status === 'PENDING');
    let assignedSlotId = null;

    for (let i = 1; i <= 10; i++) {
      const sid = `${prefix}${i}`;
      if (pendingJobs.filter(j => j.slotId === sid).length < 10) { assignedSlotId = sid; break; }
    }

    if (!assignedSlotId) { setError('พื้นที่จัดเก็บเต็มทุกช่องแล้ว'); return; }

    setLoading(true);
    try {
      const now = Date.now();
      await addDoc(collection(db, "jobs"), {
        jobNo: jobNo.trim().toUpperCase(),
        action, slotId: assignedSlotId,
        entryDate: isTestMode ? now - (13 * 86400000) : now,
        deadlineDate: isTestMode ? now - 60000 : now + (12 * 86400000),
        staffName: selectedStaff, status: 'PENDING'
      });
      setSuccessData({ jobNo, slotId: assignedSlotId, action });
    } catch (err) { setError('ระบบขัดข้อง กรุณาลองใหม่'); }
    finally { setLoading(false); }
  };

  if (successData) return (
    <div className="max-w-sm mx-auto animate-reveal">
      <div className="bg-white rounded-[3rem] shadow-2xl p-10 text-center border border-slate-100">
        <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-8 ${successData.action === 'DISPOSE' ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-indigo-500'}`}>
          <CheckCircle2 size={48} strokeWidth={2.5} />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-2">เรียบร้อย!</h2>
        <p className="text-slate-400 text-sm font-bold mb-10 uppercase tracking-widest">ระบบจัดเก็บในตำแหน่ง:</p>
        
        <div className={`text-7xl font-black mb-10 tracking-tighter ${successData.action === 'DISPOSE' ? 'text-rose-600' : 'text-indigo-600'}`}>
          {successData.slotId}
        </div>

        <button onClick={() => { setJobNo(''); setSuccessData(null); }} className="w-full py-5 bg-slate-900 text-white rounded-[1.8rem] font-black text-lg shadow-xl shadow-slate-200 active:scale-95 transition-all">
          บันทึกรายการถัดไป
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto space-y-8">
      <div className="text-center" onClick={handleHeaderClick}>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">บันทึกใบงาน</h2>
        <div className="h-1 w-10 bg-indigo-600 mx-auto rounded-full"></div>
      </div>

      <div className="bg-white/70 backdrop-blur-2xl rounded-[3rem] shadow-2xl shadow-indigo-100/50 p-8 border border-white">
        <form onSubmit={handleSubmit} className="space-y-7">
          {error && <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl flex items-center gap-3 border border-rose-100 text-xs font-bold animate-pulse"><AlertCircle size={16}/> {error}</div>}

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Job Number</label>
              <input type="text" value={jobNo} onChange={e => setJobNo(e.target.value)} placeholder="00000000" className="w-full px-6 py-5 text-2xl font-black rounded-[1.8rem] bg-slate-50 border-none focus:ring-4 focus:ring-indigo-100 transition-all outline-none" required inputMode="numeric"/>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Authorizer</label>
              <select value={selectedStaff} onChange={e => setSelectedStaff(e.target.value)} className="w-full px-6 py-5 rounded-[1.8rem] bg-slate-50 font-bold text-slate-700 appearance-none border-none focus:ring-4 focus:ring-indigo-100 transition-all outline-none" required>
                <option value="">เลือกพนักงาน</option>
                {staff.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Process Type</label>
            <div className="grid grid-cols-2 gap-4">
              <button type="button" onClick={() => setAction('DISPOSE')} className={`py-6 rounded-[1.8rem] border-2 transition-all flex flex-col items-center gap-1 ${action === 'DISPOSE' ? 'bg-rose-600 border-rose-600 text-white shadow-xl shadow-rose-200' : 'bg-white border-slate-100 text-slate-300'}`}>
                <Trash2 size={20} /> <span className="text-[10px] font-black uppercase">ทิ้ง (D)</span>
              </button>
              <button type="button" onClick={() => setAction('RETURN')} className={`py-6 rounded-[1.8rem] border-2 transition-all flex flex-col items-center gap-1 ${action === 'RETURN' ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200' : 'bg-white border-slate-100 text-slate-300'}`}>
                <Package size={20} /> <span className="text-[10px] font-black uppercase">ส่งคืน (R)</span>
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className={`w-full py-6 rounded-[2rem] text-white font-black text-xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl ${loading ? 'bg-slate-300' : 'bg-slate-900 hover:bg-black shadow-slate-200'}`}>
            {loading ? <Zap className="animate-spin"/> : 'ยืนยันบันทึก'} <ArrowRight size={20} />
          </button>

          {showDevOptions && (
            <div className="pt-4 animate-reveal">
              <label className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 text-slate-500 cursor-pointer">
                <input type="checkbox" checked={isTestMode} onChange={e => setIsTestMode(e.target.checked)} className="w-4 h-4 rounded-full accent-indigo-600" />
                <span className="text-[10px] font-black uppercase tracking-widest flex-1">Engineering Mode (Skip 12d)</span>
                <Lock size={12} onClick={() => setShowDevOptions(false)}/>
              </label>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default SampleEntry;
