
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { SampleJob, Staff } from '../types';
import { 
  Calendar, 
  Trash2, 
  Truck,
  Search,
  Box,
  User,
  AlertCircle,
  X,
  UserCheck,
  ClipboardList
} from 'lucide-react';

interface Props {
  jobs: SampleJob[];
  staff: Staff[];
}

const DeadlineList: React.FC<Props> = ({ jobs, staff }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [processingJob, setProcessingJob] = useState<SampleJob | null>(null);
  
  // Modal Form State
  const [exitStaff, setExitStaff] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const now = Date.now();

  // Handle Scroll Lock when modal is open
  useEffect(() => {
    if (processingJob) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [processingJob]);

  // Filter: Show only PENDING jobs that have reached or passed their deadlineDate
  const readyToProcess = jobs.filter(j => 
    j.status === 'PENDING' && 
    j.deadlineDate <= now
  );

  const filtered = readyToProcess.filter(j => 
    j.jobNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (job: SampleJob) => {
    setProcessingJob(job);
    setExitStaff('');
    setNotes('');
  };

  const handleSubmitRemoval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!processingJob || !exitStaff) {
      alert('กรุณาเลือกรายชื่อพนักงานที่ดำเนินการ');
      return;
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, "jobs", processingJob.id), {
        status: 'COMPLETED',
        exitDate: Date.now(),
        exitStaff: exitStaff,
        recipient: '-', 
        notes: notes || 'จัดการตามกำหนด 12 วัน'
      });
      setProcessingJob(null);
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">รายการที่ต้องจัดการวันนี้</h2>
          <p className="text-gray-500">พักครบ 12 วันแล้ว ({readyToProcess.length} รายการ)</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="ค้นหาเลขที่ใบงาน..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl outline-none w-full md:w-64 shadow-sm"
          />
        </div>
      </header>

      {readyToProcess.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3 text-amber-800">
          <AlertCircle size={20} className="animate-pulse" />
          <span className="text-sm font-bold">กรุณาจัดการเพื่อเพิ่มพื้นที่ในคลัง</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {filtered.length === 0 ? (
          <div className="bg-white p-24 rounded-3xl border border-dashed text-center flex flex-col items-center justify-center space-y-4">
            <Calendar className="text-gray-200" size={48} />
            <div className="text-gray-400 font-bold">ไม่มีรายการที่ต้องจัดการ</div>
          </div>
        ) : (
          filtered
            .sort((a, b) => a.deadlineDate - b.deadlineDate)
            .map(job => {
              const daysDiff = Math.floor((now - job.deadlineDate) / (1000 * 60 * 60 * 24));
              const isCriticallyOverdue = daysDiff > 0;

              return (
                <div 
                  key={job.id} 
                  className={`bg-white rounded-2xl shadow-sm border p-6 transition-all flex flex-col md:flex-row gap-6 items-center ${
                    isCriticallyOverdue ? 'border-red-200 bg-red-50/10' : 'border-gray-100'
                  }`}
                >
                  <div className="flex-1 w-full space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`px-3 py-1 rounded-lg text-xs font-black text-white ${
                        job.action === 'DISPOSE' ? 'bg-red-500' : 'bg-blue-600'
                      }`}>
                        {job.action === 'DISPOSE' ? 'ทิ้ง' : 'ส่งคืน'}
                      </span>
                      <span className="font-mono font-black text-gray-900 text-2xl tracking-tight">{job.jobNo}</span>
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-900 rounded-full text-xs font-bold text-white shadow-sm">
                        <Box size={14} className="text-blue-400" /> ช่อง: {job.slotId}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <User size={14} /> {job.staffName}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} /> {new Date(job.entryDate).toLocaleDateString('th-TH')}
                      </div>
                    </div>
                  </div>

                  <div className="w-full md:w-auto flex flex-col items-center md:items-end gap-2">
                    <div className="text-center md:text-right">
                      <div className={`text-sm font-black ${isCriticallyOverdue ? 'text-red-600' : 'text-green-600'}`}>
                        {isCriticallyOverdue ? `เกินกำหนด ${daysDiff} วัน` : 'ถึงกำหนดวันนี้'}
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenModal(job)}
                      className={`w-full md:w-52 flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-black text-white transition-all active:scale-95 ${
                        job.action === 'DISPOSE' ? 'bg-red-600 shadow-red-100' : 'bg-blue-600 shadow-blue-100'
                      } shadow-lg`}
                    >
                      {job.action === 'DISPOSE' ? <Trash2 size={20} /> : <Truck size={20} />}
                      <span>จัดการนำออก</span>
                    </button>
                  </div>
                </div>
              );
            })
        )}
      </div>

      {/* Modal - Fixed to Viewport independently from content scroll */}
      {processingJob && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden animate-slideUp">
            <div className={`p-8 text-white ${processingJob.action === 'DISPOSE' ? 'bg-red-600' : 'bg-blue-600'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-white/20 rounded-2xl">
                  <ClipboardList size={28} />
                </div>
                <button onClick={() => setProcessingJob(null)} className="text-white/60 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              <h3 className="text-2xl font-black tracking-tight">ยืนยันนำ {processingJob.jobNo} ออก</h3>
            </div>

            <form onSubmit={handleSubmitRemoval} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
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
                className={`w-full py-4 text-white rounded-2xl font-black text-lg shadow-xl active:scale-95 disabled:opacity-50 ${
                  processingJob.action === 'DISPOSE' ? 'bg-red-600 shadow-red-100' : 'bg-blue-600 shadow-blue-100'
                }`}
              >
                {loading ? 'กำลังบันทึก...' : 'บันทึกการจัดการ'}
              </button>
            </form>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
        .animate-slideUp { animation: slideUp 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default DeadlineList;
