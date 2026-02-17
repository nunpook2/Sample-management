
import React, { useState, useMemo, useEffect } from 'react';
import { updateJob } from '../storage';
import { SampleJob, ActionType, Staff } from '../types';
import { 
  Trash2, 
  RotateCcw, 
  Box, 
  Search, 
  ExternalLink, 
  X, 
  ClipboardList, 
  Info, 
  History,
  CheckCircle,
  Clock,
  UserCheck,
  AlertTriangle,
  FileText
} from 'lucide-react';

interface Props {
  jobs: SampleJob[];
  staff: Staff[];
}

const SlotGrid: React.FC<Props> = ({ jobs, staff }) => {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingJob, setProcessingJob] = useState<SampleJob | null>(null);
  const [viewHistoryJob, setViewHistoryJob] = useState<SampleJob | null>(null);
  
  // Management Form State
  const [exitStaff, setExitStaff] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const now = Date.now();

  // Handle Scroll Lock when modal is open
  useEffect(() => {
    if (processingJob || viewHistoryJob) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [processingJob, viewHistoryJob]);

  const pendingJobs = useMemo(() => jobs.filter(j => j.status === 'PENDING'), [jobs]);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return { storage: [], history: [] };

    const matched = jobs.filter(j => 
      j.jobNo.toLowerCase().includes(query) || 
      (j.notes && j.notes.toLowerCase().includes(query)) ||
      (j.staffName && j.staffName.toLowerCase().includes(query)) ||
      (j.exitStaff && j.exitStaff.toLowerCase().includes(query))
    );

    return {
      storage: matched.filter(j => j.status === 'PENDING'),
      history: matched.filter(j => j.status === 'COMPLETED')
    };
  }, [searchQuery, jobs]);

  const slotsWithSearch = useMemo(() => {
    return new Set(searchResults.storage.map(j => j.slotId));
  }, [searchResults.storage]);

  const getJobsInSlot = (slotId: string) => {
    return pendingJobs.filter(j => j.slotId === slotId);
  };

  const handleProcessJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!processingJob || !exitStaff) {
      alert('กรุณาเลือกรายชื่อพนักงานที่ดำเนินการ');
      return;
    }

    setLoading(true);
    try {
      await updateJob(processingJob.id, {
        status: 'COMPLETED',
        exitDate: Date.now(),
        exitStaff: exitStaff,
        recipient: '-', 
        notes: notes || 'จัดการปกติ'
      });
      setProcessingJob(null);
      setExitStaff('');
      setNotes('');
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const SlotCard: React.FC<{ type: ActionType; num: number }> = ({ type, num }) => {
    const slotId = `${type === 'DISPOSE' ? 'D' : 'R'}${num}`;
    const slotJobs = getJobsInSlot(slotId);
    const count = slotJobs.length;
    const isSelected = selectedSlot === slotId;
    const hasSearchMatch = slotsWithSearch.has(slotId);
    const hasOverdue = slotJobs.some(j => j.deadlineDate <= now);

    return (
      <button
        onClick={() => setSelectedSlot(isSelected ? null : slotId)}
        className={`relative p-4 rounded-xl border transition-all text-left flex flex-col h-32 ${
          isSelected 
            ? 'border-blue-500 ring-4 ring-blue-100 bg-blue-50 z-10 shadow-lg' 
            : hasOverdue
              ? 'border-amber-500 bg-amber-50 border-dashed border-2 animate-pulse-subtle'
              : hasSearchMatch
                ? 'border-amber-400 bg-amber-50 ring-4 ring-amber-100 shadow-lg scale-105 z-10'
                : 'border-gray-200 bg-white hover:border-gray-300 shadow-sm'
        }`}
      >
        <div className="flex justify-between items-start mb-auto">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            type === 'DISPOSE' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {type === 'DISPOSE' ? 'ทิ้ง' : 'ส่งคืน'}
          </span>
          <div className="flex items-center gap-1">
            {hasOverdue && (
              <div className="bg-amber-500 p-1 rounded-full animate-bounce">
                <AlertTriangle size={12} className="text-white" />
              </div>
            )}
            <span className="text-lg font-black text-gray-300">#{num}</span>
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div className="flex flex-col">
            <span className={`text-2xl font-bold ${hasOverdue ? 'text-amber-600' : 'text-gray-800'}`}>
              {count}
            </span>
            <span className="text-[10px] text-gray-400 font-medium">ใบงาน / 10</span>
          </div>
          <div className="flex -space-x-1">
            {[...Array(10)].map((_, i) => (
              <div 
                key={i} 
                className={`w-1 h-3 rounded-full ${i < count ? (type === 'DISPOSE' ? 'bg-red-500' : 'bg-blue-500') : 'bg-gray-100'}`}
              />
            ))}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">ผังที่เก็บ & สืบค้นประวัติ</h2>
          <p className="text-gray-500">ตรวจสอบตำแหน่งปัจจุบันและค้นหาประวัติการจัดการย้อนหลัง</p>
        </div>

        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="ค้นหาเลขที่ใบงาน / ชื่อพนักงาน / หมายเหตุ..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none shadow-sm transition-all"
          />
        </div>
      </header>

      {/* Prefix Legend */}
      <div className="flex flex-wrap gap-4 px-2">
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm text-xs font-bold">
          <span className="w-5 h-5 flex items-center justify-center bg-red-100 text-red-600 rounded">D</span>
          <span className="text-gray-500">= Dispose (ทิ้งตัวอย่าง)</span>
        </div>
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm text-xs font-bold">
          <span className="w-5 h-5 flex items-center justify-center bg-blue-100 text-blue-600 rounded">R</span>
          <span className="text-gray-500">= Return (ส่งคืนลูกค้า)</span>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 shadow-sm text-xs font-bold animate-pulse">
          <AlertTriangle size={14} className="text-amber-500" />
          <span className="text-amber-700">มีรายการครบกำหนด/เกินเวลา</span>
        </div>
      </div>

      {/* Search Results Display */}
      {searchQuery.trim() && (
        <div className="space-y-6 bg-slate-100 p-6 rounded-3xl border border-gray-200">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-black text-gray-600 uppercase tracking-widest text-xs flex items-center gap-2">
              <Search size={14} /> ผลการค้นหาสำหรับ "{searchQuery}"
            </h3>
            <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600 text-xs font-bold">ล้างการค้นหา</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-gray-500 px-2 flex items-center gap-2">
                <Box size={16} className="text-blue-500" /> อยู่ในที่เก็บ ({searchResults.storage.length})
              </h4>
              <div className="space-y-2">
                {searchResults.storage.map(job => (
                  <div key={job.id} className="bg-white p-4 rounded-xl shadow-sm border border-blue-100 flex items-center justify-between hover:border-blue-300 transition-all">
                    <div>
                      <div className="font-mono font-black text-blue-600 text-lg">{job.jobNo}</div>
                      <div className="text-xs text-gray-500 font-bold uppercase mt-0.5">ช่อง: {job.slotId} | คีย์โดย: {job.staffName}</div>
                    </div>
                    <button 
                      onClick={() => setProcessingJob(job)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <ExternalLink size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold text-gray-500 px-2 flex items-center gap-2">
                <History size={16} className="text-gray-400" /> ประวัติการจัดการ ({searchResults.history.length})
              </h4>
              <div className="space-y-2">
                {searchResults.history.map(job => (
                  <div key={job.id} className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between shadow-sm">
                    <div className="flex-1 min-w-0">
                      <div className="font-mono font-black text-gray-800 text-lg line-through decoration-1 truncate">{job.jobNo}</div>
                      <div className="text-xs text-gray-600 font-bold mt-0.5">
                        ออกเมื่อ: {new Date(job.exitDate!).toLocaleDateString('th-TH')} | โดย: <span className="text-gray-900">{job.exitStaff}</span>
                      </div>
                      <div className="text-xs text-blue-700 font-bold mt-1.5 flex items-start gap-1">
                        <FileText size={14} className="shrink-0 mt-0.5" />
                        <span className="truncate max-w-full">หมายเหตุ: {job.notes || '-'}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setViewHistoryJob(job)}
                      className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors shrink-0 ml-2"
                    >
                      <Info size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-red-600 font-bold px-2">
            <Trash2 size={20} /> โซนตัวอย่างรอทิ้ง (D)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[...Array(10)].map((_, i) => (
              <SlotCard key={`D-${i}`} type="DISPOSE" num={i + 1} />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-blue-600 font-bold px-2">
            <RotateCcw size={20} /> โซนตัวอย่างรอส่งคืน (R)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[...Array(10)].map((_, i) => (
              <SlotCard key={`R-${i}`} type="RETURN" num={i + 1} />
            ))}
          </div>
        </section>
      </div>

      {selectedSlot && (
        <div className="mt-8 bg-white p-8 rounded-3xl border border-gray-100 shadow-2xl overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 text-white rounded-2xl">
                <Box size={24} />
              </div>
              <div>
                <h3 className="font-black text-2xl text-gray-800 tracking-tight">ช่องเก็บ {selectedSlot}</h3>
              </div>
            </div>
            <button onClick={() => setSelectedSlot(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
              <X size={24} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] text-gray-400 uppercase font-black tracking-[0.2em]">
                  <th className="py-4 px-2">เลขที่ใบงาน</th>
                  <th className="py-4 px-2">วันที่เข้า</th>
                  <th className="py-4 px-2">วันครบกำหนด</th>
                  <th className="py-4 px-2 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {getJobsInSlot(selectedSlot).map(job => (
                  <tr key={job.id} className="text-sm hover:bg-gray-50/80 transition-colors">
                    <td className="py-5 px-2">
                      <span className="font-mono font-black text-lg text-gray-800">{job.jobNo}</span>
                    </td>
                    <td className="py-5 px-2 text-gray-500">
                      {new Date(job.entryDate).toLocaleDateString('th-TH')}
                    </td>
                    <td className="py-5 px-2">
                      <span className={`font-bold ${job.deadlineDate <= now ? 'text-red-500' : 'text-gray-700'}`}>
                        {new Date(job.deadlineDate).toLocaleDateString('th-TH')}
                      </span>
                    </td>
                    <td className="py-5 px-2 text-right">
                      <button 
                        onClick={() => setProcessingJob(job)}
                        className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold"
                      >
                        <ExternalLink size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Processing Modal */}
      {processingJob && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden animate-slideUp">
            <div className="bg-blue-600 p-8 text-white">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-white/20 rounded-2xl">
                  <ClipboardList size={28} />
                </div>
                <button onClick={() => setProcessingJob(null)} className="text-white/60 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              <h3 className="text-2xl font-black tracking-tight">จัดการใบงาน {processingJob.jobNo}</h3>
            </div>

            <form onSubmit={handleProcessJob} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                  <UserCheck size={16} className="text-blue-500" /> พนักงานที่ดำเนินการ
                </label>
                <select 
                  value={exitStaff}
                  onChange={(e) => setExitStaff(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none bg-white font-medium"
                  required
                >
                  <option value="">-- เลือกรายชื่อพนักงาน --</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">หมายเหตุ (ถ้ามี)</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none font-medium min-h-[100px]"
                  placeholder="รายละเอียดเพิ่มเติม..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg active:scale-95 disabled:opacity-50"
              >
                {loading ? 'กำลังบันทึก...' : 'ยืนยันการนำออก'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* History Detail Modal */}
      {viewHistoryJob && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden animate-slideUp">
            <div className="bg-slate-800 p-8 text-white">
              <div className="flex justify-between items-center mb-4">
                <div className="p-3 bg-white/10 rounded-2xl">
                  <History size={28} />
                </div>
                <button onClick={() => setViewHistoryJob(null)} className="text-white/40 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              <h3 className="text-2xl font-black tracking-tight">ประวัติสืบกลับ {viewHistoryJob.jobNo}</h3>
            </div>

            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">สถานะ</p>
                  <p className={`font-bold ${viewHistoryJob.action === 'DISPOSE' ? 'text-red-500' : 'text-blue-500'}`}>
                    {viewHistoryJob.action === 'DISPOSE' ? 'ทิ้ง' : 'ส่งคืน'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">ช่อง</p>
                  <p className="font-bold text-gray-800">{viewHistoryJob.slotId}</p>
                </div>
              </div>

              <div className="space-y-4 border-t pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Clock size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase">นำเข้า</p>
                    <p className="text-sm font-semibold text-gray-700">{new Date(viewHistoryJob.entryDate).toLocaleString('th-TH')}</p>
                    <p className="text-xs text-gray-500">โดย: {viewHistoryJob.staffName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                    <CheckCircle size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase">นำออก</p>
                    <p className="text-sm font-semibold text-gray-700">{new Date(viewHistoryJob.exitDate!).toLocaleString('th-TH')}</p>
                    <p className="text-xs text-gray-500">โดย: {viewHistoryJob.exitStaff}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-2xl space-y-3 border">
                <div className="flex items-center gap-2 text-gray-400 uppercase text-xs font-black">
                  <FileText size={16} /> หมายเหตุ
                </div>
                <p className="text-base text-gray-700 italic">{viewHistoryJob.notes || '-'}</p>
              </div>

              <button onClick={() => setViewHistoryJob(null)} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black">ปิด</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse-subtle {
          0%, 100% { border-color: rgba(245, 158, 11, 0.4); }
          50% { border-color: rgba(245, 158, 11, 1); }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default SlotGrid;
