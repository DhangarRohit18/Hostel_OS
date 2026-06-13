import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { Home, FileClock, FileText, ClipboardList } from 'lucide-react';

export const ParentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState<any>(null);

  // Lists
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);

  const fetchParentData = async () => {
    try {
      const annRes = await apiRequest('/api/announcements');
      setAnnouncements(annRes.announcements);

      const leaveRes = await apiRequest('/api/leaves');
      setLeaves(leaveRes.leaves);
      const billRes = await apiRequest('/api/billing/all');
      setFees(billRes.fees || []);

      const compRes = await apiRequest('/api/complaints');
      setComplaints(compRes.complaints);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user?.parentProfile?.students && user.parentProfile.students.length > 0) {
      setStudent(user.parentProfile.students[0]);
    }
    fetchParentData();
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      
      {/* Student Overview Header */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Parent Portal: Tracking student progress</h2>
          {student ? (
            <p className="text-sm text-slate-400">
              Student Name: <strong>{student.user?.name}</strong> • Roll Number: {student.rollNumber} • Branch: {student.branch}
            </p>
          ) : (
            <p className="text-sm text-slate-400">No linked student account detected.</p>
          )}
        </div>
        
        {student?.bed && (
          <div className="flex items-center space-x-3 bg-slate-900/60 p-4 rounded-2xl border border-glassBorder/60 text-xs text-slate-200">
            <Home className="text-indigo-400" size={18} />
            <span>Room {student.bed.room.number} • {student.bed.room.floor.building.name}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Leaves, Passes & Dues */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Outing Leaves */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
              <FileClock size={20} className="text-indigo-400" />
              <span>Student Outing Leaves Tracker</span>
            </h3>
            {leaves.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No leaves logged.</p>
            ) : (
              <div className="space-y-3">
                {leaves.map((l) => (
                  <div key={l.id} className="p-4 rounded-2xl bg-slate-900/50 border border-glassBorder/40 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-semibold text-slate-200">{l.reason}</p>
                      <p className="text-slate-400 mt-1">Duration: {new Date(l.departureDate).toLocaleDateString()} to {new Date(l.returnDate).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full font-bold ${
                      l.status === 'APPROVED' ? 'bg-green-950 text-green-300' : 'bg-yellow-950 text-yellow-300'
                    }`}>{l.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fees Dues */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
              <FileText size={20} className="text-indigo-400" />
              <span>Billing & Fees Status</span>
            </h3>
            {fees.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No invoices generated.</p>
            ) : (
              <div className="space-y-3">
                {fees.map((f) => (
                  <div key={f.id} className="p-4 rounded-2xl bg-slate-900/50 border border-glassBorder/40 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-200">{f.type} Invoice</p>
                      <p className="text-slate-400 mt-1">Amount: ₹{f.amount} • Due Date: {new Date(f.dueDate).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full font-bold ${
                      f.status === 'PAID' ? 'bg-green-950 text-green-300' : 'bg-red-950 text-red-300'
                    }`}>{f.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Announcements & Complaints */}
        <div className="space-y-6">
          
          {/* Active complaints */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
              <ClipboardList size={20} className="text-indigo-400" />
              <span>Filed Complaints Logs</span>
            </h3>
            {complaints.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No complaints filed by student.</p>
            ) : (
              <div className="space-y-3">
                {complaints.map((c) => (
                  <div key={c.id} className="p-3.5 rounded-2xl bg-slate-900/50 border border-glassBorder/40 text-xs">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-indigo-300 uppercase">{c.category}</span>
                      <span className="text-slate-400 font-medium">{c.status}</span>
                    </div>
                    <p className="text-slate-300 mt-1.5">{c.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* System announcements */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Notice Circulars</h3>
            {announcements.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No active notice board bulletins.</p>
            ) : (
              <div className="space-y-3">
                {announcements.map((a) => (
                  <div key={a.id} className="p-3.5 rounded-2xl bg-slate-900/50 border border-glassBorder/40 text-xs">
                    <p className="font-semibold text-indigo-300">{a.title}</p>
                    <p className="text-slate-400 mt-1">{a.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
