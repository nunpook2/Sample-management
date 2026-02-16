
import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, getDocs, writeBatch, updateDoc } from 'firebase/firestore';
import { Staff } from '../types';
import { UserPlus, Trash2, Users, Info, ShieldAlert, RefreshCw, Edit2, Check, X, AlertCircle } from 'lucide-react';

interface Props { staff: Staff[]; }

const Settings: React.FC<Props> = ({ staff }) => {
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  
  // State for editing staff
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Inline Confirmation States
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClearStage, setConfirmClearStage] = useState(0); // 0: Normal, 1: First Click, 2: Final Warning

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);
    try {
      await addDoc(collection(db, "staff"), { name: newName.trim() });
      setNewName('');
    } catch (err) {
      alert('ไม่สามารถเพิ่มรายชื่อได้');
    } finally { setLoading(false); }
  };

  const startEdit = (s: Staff) => {
    setEditingId(s.id);
    setEditValue(s.name);
    setConfirmDeleteId(null);
  };

  const handleUpdateStaff = async (id: string) => {
    if (!editValue.trim()) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "staff", id), { name: editValue.trim() });
      setEditingId(null);
    } catch (err) {
      alert('แก้ไขไม่สำเร็จ');
    } finally { setLoading(false); }
  };

  const handleDeleteStaff = async (id: string) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, "staff", id));
      setConfirmDeleteId(null);
    } catch (err) {
      alert('ลบไม่สำเร็จ');
    } finally { setLoading(false); }
  };

  const handleClearAllJobs = async () => {
    setClearing(true);
    try {
      const querySnapshot = await getDocs(collection(db, "jobs"));
      if (querySnapshot.empty) {
        alert('ไม่มีข้อมูลใบงานในระบบ');
        setConfirmClearStage(0);
        setClearing(false);
        return;
      }

      const docs = querySnapshot.docs;
      const chunkSize = 100; 
      for (let i = 0; i < docs.length; i += chunkSize) {
        const batch = writeBatch(db);
        const chunk = docs.slice(i, i + chunkSize);
        chunk.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
      
      alert(`ล้างข้อมูลสำเร็จแล้ว ${docs.length} รายการ`);
      setConfirmClearStage(0);
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <header className="px-2">
        <h2 className="text-2xl font-bold text-gray-800">การตั้งค่าระบบ</h2>
        <p className="text-gray-500">จัดการรายชื่อเจ้าหน้าที่และล้างข้อมูลระบบ</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
              <Users size={20} className="text-blue-500" /> รายชื่อเจ้าหน้าที่
            </h3>
            <span className="text-xs bg-white border border-gray-200 px-3 py-1 rounded-full text-gray-500 font-bold">
              {staff.length} รายชื่อ
            </span>
          </div>
          
          <div className="p-6 space-y-6">
            <form onSubmit={handleAddStaff} className="flex gap-2">
              <input 
                type="text" 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="ระบุชื่อพนักงานใหม่"
                className="flex-1 px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none font-medium text-lg"
              />
              <button 
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-5 rounded-2xl active:scale-90 shadow-lg"
              >
                <UserPlus size={24} />
              </button>
            </form>

            <div className="space-y-3">
              {staff.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm font-medium italic">ยังไม่มีรายชื่อ</div>
              ) : (
                staff.map(s => (
                  <div key={s.id} className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between">
                    {editingId === s.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input 
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1 px-3 py-2 border-2 border-blue-500 rounded-xl outline-none font-bold"
                          autoFocus
                        />
                        <button onClick={() => handleUpdateStaff(s.id)} className="p-3 text-green-600 bg-green-50 rounded-xl"><Check size={20}/></button>
                        <button onClick={() => setEditingId(null)} className="p-3 text-gray-400 bg-gray-50 rounded-xl"><X size={20}/></button>
                      </div>
                    ) : (
                      <>
                        <span className="text-gray-700 font-bold text-lg">{s.name}</span>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => startEdit(s)}
                            className="text-blue-500 p-4 rounded-xl active:bg-blue-50"
                          >
                            <Edit2 size={22} />
                          </button>
                          
                          {confirmDeleteId === s.id ? (
                            <div className="flex items-center gap-1 animate-fadeIn">
                              <button 
                                onClick={() => handleDeleteStaff(s.id)}
                                className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase"
                              >
                                ยืนยันลบ?
                              </button>
                              <button onClick={() => setConfirmDeleteId(null)} className="p-2 text-gray-400"><X size={20}/></button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => setConfirmDeleteId(s.id)}
                              className="text-red-400 p-4 rounded-xl active:bg-red-50"
                            >
                              <Trash2 size={22} />
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-2xl">
            <h3 className="font-black text-xl flex items-center gap-2 mb-4 uppercase tracking-tight">
              <Info size={24} /> เกี่ยวกับระบบ
            </h3>
            <ul className="space-y-3 text-sm font-bold opacity-90">
              <li className="bg-white/10 p-4 rounded-2xl">• ระยะพักตัวอย่าง 12 วัน</li>
              <li className="bg-white/10 p-4 rounded-2xl">• Prefix D = ทิ้ง (Dispose)</li>
              <li className="bg-white/10 p-4 rounded-2xl">• Prefix R = ส่งคืน (Return)</li>
              <li className="bg-white/10 p-4 rounded-2xl">• สูงสุด 10 ใบงานต่อช่อง</li>
            </ul>
          </div>

          <div className="bg-red-50 rounded-[2.5rem] p-8 border border-red-100">
            <h3 className="font-black text-red-700 flex items-center gap-2 mb-2 uppercase tracking-tight">
              <ShieldAlert size={24} /> โซนอันตราย
            </h3>
            <p className="text-xs text-red-600 mb-6 font-bold opacity-70">
              จะลบใบงาน "ทั้งหมด" รวมถึงประวัติการจัดการ ข้อมูลจะหายถาวร
            </p>
            
            <div className="space-y-3">
              {confirmClearStage === 0 && (
                <button
                  onClick={() => setConfirmClearStage(1)}
                  className="w-full py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 bg-red-600 text-white shadow-xl active:scale-95"
                >
                  <Trash2 size={24} /> ล้างข้อมูลใบงานทั้งหมด
                </button>
              )}

              {confirmClearStage === 1 && (
                <div className="space-y-3 animate-slideUp">
                  <div className="bg-white p-4 rounded-2xl border border-red-200 flex items-center gap-3 text-red-600">
                    <AlertCircle size={24} />
                    <span className="text-sm font-black">คุณแน่ใจหรือไม่? ข้อมูลจะหายทั้งหมด</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setConfirmClearStage(2)}
                      className="py-4 bg-red-600 text-white rounded-xl font-black text-sm"
                    >
                      ใช่, ฉันแน่ใจ
                    </button>
                    <button
                      onClick={() => setConfirmClearStage(0)}
                      className="py-4 bg-gray-200 text-gray-700 rounded-xl font-black text-sm"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              )}

              {confirmClearStage === 2 && (
                <div className="space-y-3 animate-slideUp">
                  <div className="bg-red-600 p-4 rounded-2xl text-white flex items-center gap-3">
                    <ShieldAlert size={24} className="animate-pulse" />
                    <span className="text-sm font-black">ยืนยันครั้งสุดท้าย ข้อมูลย้อนกลับไม่ได้!</span>
                  </div>
                  <button
                    onClick={handleClearAllJobs}
                    disabled={clearing}
                    className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3"
                  >
                    {clearing ? <RefreshCw className="animate-spin" /> : <Trash2 />}
                    {clearing ? 'กำลังดำเนินการ...' : 'กดเพื่อลบข้อมูลเดี๋ยวนี้'}
                  </button>
                  <button onClick={() => setConfirmClearStage(0)} className="w-full py-2 text-gray-400 text-xs font-bold">ยกเลิกตอนนี้</button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm text-center">
            <div className="inline-flex items-center gap-2 text-green-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
              Cloud Database v1.1.2
            </div>
          </div>
        </section>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
        .animate-slideUp { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

export default Settings;
