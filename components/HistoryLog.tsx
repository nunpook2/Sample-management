import React, { useState, useMemo } from 'react';
import { SampleJob } from '../types';
import { Search, Calendar, ArrowRight, Clock, FileText, CheckCircle2 } from 'lucide-react';

interface Props {
  jobs: SampleJob[];
}

const HistoryLog: React.FC<Props> = ({ jobs }) => {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');
  const [search, setSearch] = useState('');

  const filteredJobs = useMemo(() => {
    return jobs
      .filter(j => {
        if (filter === 'PENDING') return j.status === 'PENDING';
        if (filter === 'COMPLETED') return j.status === 'COMPLETED';
        return true;
      })
      .filter(j => 
        j.jobNo.toLowerCase().includes(search.toLowerCase()) ||
        j.staffName.toLowerCase().includes(search.toLowerCase()) ||
        (j.exitStaff && j.exitStaff.toLowerCase().includes(search.toLowerCase())) ||
        (j.notes && j.notes.toLowerCase().includes(search.toLowerCase()))
      )
      .sort((a, b) => {
        // Sort by exit date if completed, otherwise entry date (newest first)
        const dateA = a.exitDate || a.entryDate;
        const dateB = b.exitDate || b.entryDate;
        return dateB - dateA;
      });
  }, [jobs, filter, search]);

  return (
    <div className="space-y-6 pb-20">
      {/* Header & Controls */}
      <div className="space-y-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">ประวัติการดำเนินงาน</h2>
           <p className="text-gray-500">บันทึกรายการเข้า-ออกทั้งหมด {jobs.length} รายการ</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="ค้นหาเลขที่ใบงาน, พนักงาน, หมายเหตุ..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <div className="flex bg-gray-100 p-1 rounded-xl shrink-0">
            {(['ALL', 'PENDING', 'COMPLETED'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  filter === f ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {f === 'ALL' ? 'ทั้งหมด' : f === 'PENDING' ? 'กำลังดำเนินการ' : 'เสร็จสิ้น'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredJobs.map(job => (
          <div key={job.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4 hover:border-blue-200 transition-colors">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-sm ${
                  job.action === 'DISPOSE' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                }`}>
                  {job.action === 'DISPOSE' ? 'D' : 'R'}
                </div>
                <div>
                  <div className="font-mono font-black text-lg text-gray-800 tracking-tight">{job.jobNo}</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    {job.status === 'PENDING' ? `อยู่ที่ช่อง: ${job.slotId}` : `เคยอยู่ช่อง: ${job.slotId}`}
                  </div>
                </div>
              </div>
              <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase flex items-center gap-1 ${
                job.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {job.status === 'COMPLETED' ? <CheckCircle2 size={12}/> : <Clock size={12}/>}
                {job.status === 'COMPLETED' ? 'Completed' : 'Pending'}
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3 text-xs bg-gray-50 p-3 rounded-xl border border-gray-100">
               <div className="flex-1">
                 <div className="text-gray-400 font-bold mb-1 flex items-center gap-1"><Calendar size={12}/> รับเข้า</div>
                 <div className="font-medium text-gray-700">{new Date(job.entryDate).toLocaleDateString('th-TH, { hour: "2-digit", minute: "2-digit" }')}</div>
                 <div className="text-[10px] text-gray-400 mt-0.5">โดย: {job.staffName}</div>
               </div>
               
               <div className="hidden md:flex items-center justify-center px-2">
                 <ArrowRight size={16} className="text-gray-300" />
               </div>

               <div className="flex-1 md:text-right">
                 <div className="text-gray-400 font-bold mb-1 flex items-center md:justify-end gap-1">
                    {job.status === 'COMPLETED' ? 'นำออก' : 'กำหนด'} <Clock size={12}/>
                 </div>
                 {job.status === 'COMPLETED' ? (
                   <>
                     <div className="font-medium text-green-600">{new Date(job.exitDate!).toLocaleDateString('th-TH, { hour: "2-digit", minute: "2-digit" }')}</div>
                     <div className="text-[10px] text-gray-400 mt-0.5">โดย: {job.exitStaff}</div>
                   </>
                 ) : (
                   <div className="font-medium text-amber-600">{new Date(job.deadlineDate).toLocaleDateString('th-TH')}</div>
                 )}
               </div>
            </div>

            {job.notes && (
               <div className="flex gap-2 items-start text-xs text-gray-500 italic px-1">
                  <FileText size={14} className="shrink-0 mt-0.5" />
                  <span>{job.notes}</span>
               </div>
            )}
          </div>
        ))}

        {filteredJobs.length === 0 && (
          <div className="text-center py-12 text-gray-300 italic flex flex-col items-center gap-2">
            <FileText size={48} className="opacity-20" />
            <span>ไม่พบข้อมูลบันทึก</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryLog;