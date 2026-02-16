
import React from 'react';
import { SampleJob } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertCircle, Trash2, RotateCcw, Box } from 'lucide-react';

interface Props {
  jobs: SampleJob[];
}

const Dashboard: React.FC<Props> = ({ jobs }) => {
  const pending = jobs.filter(j => j.status === 'PENDING');
  const now = Date.now();
  const overdue = pending.filter(j => j.deadlineDate < now);
  const disposePending = pending.filter(j => j.action === 'DISPOSE');
  const returnPending = pending.filter(j => j.action === 'RETURN');

  const chartData = [
    { name: 'รอทิ้ง', count: disposePending.length, color: '#ef4444' },
    { name: 'รอส่งคืน', count: returnPending.length, color: '#3b82f6' },
    { name: 'ครบกำหนด', count: overdue.length, color: '#f59e0b' }
  ];

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-gray-800">แผงควบคุมหลัก</h2>
        <p className="text-gray-500">สรุปสถานะการจัดการตัวอย่างล่าสุด</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          label="รอดำเนินการทั้งหมด" 
          value={pending.length} 
          icon={Box} 
          color="bg-white text-gray-800"
          subtext="ใบงานที่อยู่ในแล็บ"
        />
        <StatCard 
          label="รอทิ้ง" 
          value={disposePending.length} 
          icon={Trash2} 
          color="bg-red-50 text-red-600"
          subtext="รอครบ 12 วัน"
        />
        <StatCard 
          label="รอส่งคืน" 
          value={returnPending.length} 
          icon={RotateCcw} 
          color="bg-blue-50 text-blue-600"
          subtext="รอครบ 12 วัน"
        />
        <StatCard 
          label="ครบกำหนดแล้ว" 
          value={overdue.length} 
          icon={AlertCircle} 
          color="bg-amber-50 text-amber-600"
          subtext="ต้องจัดการด่วน"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-6 text-center">สัดส่วนตัวอย่างที่ยังคงค้าง</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-4">ใบงานที่ใกล้ครบกำหนดจัดการ</h3>
          <div className="space-y-3">
            {pending
              .sort((a, b) => a.deadlineDate - b.deadlineDate)
              .slice(0, 5)
              .map(job => {
                const isOverdue = job.deadlineDate < now;
                const daysLeft = Math.ceil((job.deadlineDate - now) / (1000 * 60 * 60 * 24));
                return (
                  <div key={job.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-50 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${job.action === 'DISPOSE' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                      <div className="font-mono font-bold text-gray-900 text-lg">{job.jobNo}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${isOverdue ? 'text-red-600' : 'text-amber-600'}`}>
                        {isOverdue ? 'ครบกำหนดแล้ว' : `อีก ${daysLeft} วัน`}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-gray-400 font-black">ช่อง: {job.slotId}</div>
                    </div>
                  </div>
                );
              })}
            {pending.length === 0 && (
              <div className="text-center py-20 text-gray-300 italic flex flex-col items-center gap-2">
                <Box size={40} className="opacity-20" />
                <span>ไม่มีข้อมูลรอดำเนินการ</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color, subtext }: any) => (
  <div className={`p-6 rounded-2xl border border-gray-100 shadow-sm ${color}`}>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium opacity-80">{label}</p>
        <h4 className="text-3xl font-black mt-1 tracking-tight">{value}</h4>
        <p className="text-[10px] mt-2 font-black opacity-60 uppercase tracking-widest">{subtext}</p>
      </div>
      <div className="p-2 bg-white/50 rounded-lg shadow-inner">
        <Icon size={24} />
      </div>
    </div>
  </div>
);

export default Dashboard;
