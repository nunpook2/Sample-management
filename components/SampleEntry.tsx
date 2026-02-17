
import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { SampleJob, Staff, ActionType } from '../types';
import { PlusCircle, AlertTriangle, CheckCircle2, Box, Info, Trash2, FlaskConical, ChevronRight } from 'lucide-react';

interface Props {
  staff: Staff[];
  jobs: SampleJob[];
  onComplete: () => void;
}

const SampleEntry: React.FC<Props> = ({ staff, jobs, onComplete }) => {
  const [jobNo, setJobNo] = useState('');
  const [action, setAction] = useState<ActionType>('DISPOSE');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);
  const [successData, setSuccessData] = useState<{ jobNo: string, slotId: string, action: ActionType } | null>(null);

  const findAvailableSlot = (type: ActionType): string | null => {
    const prefix = type === 'DISPOSE' ? 'D' : 'R';
    const pendingJobs = jobs.filter(j => j.status === 'PENDING');

    for (let i = 1; i <= 10; i++) {
      const slotId = `${prefix}${i}`;
      const count = pendingJobs.filter(j => j.slotId === slotId).length;
      if (count < 10) {
        return slotId;
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!jobNo || !selectedStaff) {
      setError('กรุณากรอกเลขที่ใบงานและเลือกชื่อพนักงาน');
      return;
    }

    const assignedSlotId = findAvailableSlot(action);
    if (!assignedSlotId) {
      setError(`คลังเก็บสำหรับการ ${action === 'DISPOSE' ? 'ทิ้ง' : 'ส่งคืน'} เต็มทุกช่องแล้ว`);
      return;
    }

    setLoading(true);
    try {
      const entryDate = Date.now();
      const deadlineDate = isTestMode 
        ? entryDate - (1000 * 60 * 60 * 24)
        : entryDate + (12 * 24 * 60 * 60 * 1000);

      await addDoc(collection(db, "jobs"), {
        jobNo: jobNo.trim().toUpperCase(),
        customerName: '',
        action,
        returnAddress: '',
        slotId: assignedSlotId,
        entryDate: isTestMode ? entryDate - (13 * 24 * 60 * 60 * 1000) : entryDate,
        deadlineDate,
        staffName: selectedStaff,
        status: 'PENDING'
      });

      setSuccessData({ 
        jobNo: jobNo.trim().toUpperCase(), 
        slotId: assignedSlotId,
        action: action 
      });
    } catch (err) {
      console.error(err);
      setError('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setJobNo('');
    setSuccessData(null);
  };

  if (successData) {
    const isDispose = successData.action === 'DISPOSE';
    return (
      <div className="max-w-md mx-auto py-4 animate-fadeIn">
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden text-center">
          <div className={`${isDispose ? 'bg-red-500' : 'bg-blue-600'} p-12 text-white flex flex-col items-center`}>
            <div className="bg-white/20 p-4 rounded-3xl mb-4 backdrop-blur-md">
              <CheckCircle2 size={56} />
            </div>
            <h2 className="text-3xl font-black tracking-tight">บันทึกเรียบร้อย!</h2>
          </div>
          
          <div className="p-8 space-y-8">
            <div className="space-y-4">
              <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px]">
                วางใบงาน {successData.jobNo} ที่ช่อง
              </p>
              
              <div className={`mx-auto w-32 h-32 rounded-[2rem] flex flex-col items-center justify-center shadow-lg ${
                isDispose ? 'bg-red-50 text-red-600 shadow-red-100' : 'bg-blue-50 text-blue-600 shadow-blue-100'
              }`}>
                <span className="text-5xl font-black tracking-tighter">{successData.slotId}</span>
              </div>
              
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                isDispose ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
              }`}>
                {isDispose ? 'Dispose (โซนทิ้ง)' : 'Return (โซนส่งคืน)'}
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-3xl border border-gray-100 text-sm font-medium text-slate-500 leading-relaxed">
               ระบบคำนวณวันพักตัวอย่างให้ <span className="text-slate-900 font-bold">12 วัน</span> อัตโนมัติแล้ว
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={resetForm}
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-black transition-all shadow-xl active:scale-95"
              >
                บันทึกใบงานต่อไป
              </button>
              <button
                onClick={onComplete}
                className="w-full py-3 text-slate-400 font-bold text-sm hover:text-slate-600 flex items-center justify-center gap-1"
              >
                ดูความเคลื่อนไหวล่าสุด <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">รับตัวอย่างใหม่</h2>
        <p className="text-slate-500 text-sm font-medium">กรอกข้อมูลเพื่อรันเลขที่ช่องเก็บอัตโนมัติ</p>
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 border border-red-100">
              <AlertTriangle size={18} className="shrink-0" />
              <span className="text-xs font-bold">{error}</span>
            </div>
          )}

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">เลขที่ใบงาน (Job No.)</label>
              <input 
                type="text"
                value={jobNo}
                onChange={(e) => setJobNo(e.target.value)}
                className="w-full px-5 py-5 text-2xl font-mono font-black rounded-2xl border-2 border-slate-100 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all outline-none bg-slate-50/50"
                placeholder="2603XXXX"
                autoFocus
                required
                inputMode="numeric"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">พนักงานผู้คีย์</label>
              <select 
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="w-full px-5 py-5 rounded-2xl border-2 border-slate-100 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all outline-none bg-white font-bold text-lg text-slate-700 appearance-none shadow-sm"
                required
              >
                <option value="">-- เลือกชื่อพนักงาน --</option>
                {staff.map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">เลือกประเภทการจัดการ</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setAction('DISPOSE')}
                className={`py-6 rounded-[1.5rem] border-2 transition-all font-black flex flex-col items-center justify-center gap-2 ${
                  action === 'DISPOSE' 
                  ? 'bg-red-50 border-red-500 text-red-600 shadow-lg shadow-red-50 scale-[1.05]' 
                  : 'bg-white border-slate-100 text-slate-300 hover:border-slate-200'
                }`}
              >
                <Trash2 size={24} strokeWidth={3} /> 
                <span className="text-sm">ทิ้ง (D)</span>
              </button>
              <button
                type="button"
                onClick={() => setAction('RETURN')}
                className={`py-6 rounded-[1.5rem] border-2 transition-all font-black flex flex-col items-center justify-center gap-2 ${
                  action === 'RETURN' 
                  ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-lg shadow-blue-50 scale-[1.05]' 
                  : 'bg-white border-slate-100 text-slate-300 hover:border-slate-200'
                }`}
              >
                <Box size={24} strokeWidth={3} /> 
                <span className="text-sm">ส่งคืน (R)</span>
              </button>
            </div>
          </div>

          {/* Test Mode Toggle - Slightly smaller on mobile */}
          <div className="pt-2">
            <label className="flex items-center gap-4 cursor-pointer p-4 rounded-2xl bg-slate-900 text-white active:bg-black transition-colors">
              <input 
                type="checkbox" 
                checked={isTestMode}
                onChange={(e) => setIsTestMode(e.target.checked)}
                className="w-6 h-6 rounded-lg accent-blue-500"
              />
              <div className="flex-1">
                <div className="text-xs font-black flex items-center gap-2">
                  <FlaskConical size={14} className="text-blue-400" /> โหมดทดสอบระบบ
                </div>
                <div className="text-[9px] text-gray-400 uppercase font-black tracking-widest mt-0.5">
                  ข้ามวันพัก 12 วันทันที
                </div>
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-5 rounded-[1.5rem] text-white font-black text-xl shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-2 ${
              loading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'
            }`}
          >
            {loading ? 'กำลังบันทึก...' : <>บันทึกรับงาน <ChevronRight size={24} strokeWidth={3} /></>}
          </button>
        </form>
      </div>
      
      <div className="flex items-center justify-center gap-2 text-slate-400">
         <Info size={14} />
         <span className="text-[10px] font-bold uppercase tracking-widest">ความจุ: สูงสุด 10 ใบงานต่อช่อง</span>
      </div>
    </div>
  );
};

export default SampleEntry;
