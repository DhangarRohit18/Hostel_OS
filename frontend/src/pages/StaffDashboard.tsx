import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';


export const StaffDashboard: React.FC = () => {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [report, setReport] = useState('');
  const [selectedCompId, setSelectedCompId] = useState<string | null>(null);

  const fetchStaffData = async () => {
    try {
      const res = await apiRequest('/api/complaints');
      setComplaints(res.complaints || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, []);

  const updateStatus = async (complaintId: string, status: 'IN_PROGRESS' | 'RESOLVED') => {
    try {
      await apiRequest('/api/complaints/status', {
        method: 'PUT',
        body: JSON.stringify({
          complaintId,
          status,
          maintenanceReport: status === 'RESOLVED' ? report : undefined,
        }),
      });
      alert(`Ticket updated to ${status.replace('_', ' ')}!`);
      setSelectedCompId(null);
      setReport('');
      fetchStaffData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center space-x-2">
          <span>Assigned Work Tickets</span>
        </h2>
        <p className="text-sm text-slate-400">View and update repair jobs assigned to your department.</p>

        {complaints.length === 0 ? (
          <p className="text-sm text-slate-500 py-8 text-center">No jobs assigned to you at the moment.</p>
        ) : (
          <div className="space-y-4">
            {complaints.map((c) => (
              <div key={c.id} className="p-5 rounded-2xl bg-slate-900/50 border border-glassBorder/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-indigo-300 uppercase">{c.category}</span>
                    <span className="text-[10px] text-slate-400 font-mono">ID: {c.id.substring(0, 6)}</span>
                  </div>
                  <p className="text-sm text-slate-200 mt-1">{c.description}</p>
                  <p className="text-slate-400 mt-1">Student: {c.student.user.name} • Location: Room {c.student.bed?.room.number || 'N/A'}</p>
                </div>

                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full font-bold ${
                    c.status === 'RESOLVED' ? 'bg-green-950 text-green-300' : 'bg-yellow-950 text-yellow-300'
                  }`}>{c.status}</span>

                  {c.status !== 'RESOLVED' && (
                    <div className="flex gap-2">
                      {c.status === 'ASSIGNED' && (
                        <button
                          onClick={() => updateStatus(c.id, 'IN_PROGRESS')}
                          className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-lg"
                        >
                          Start Job
                        </button>
                      )}
                      
                      {selectedCompId === c.id ? (
                        <div className="flex flex-col gap-2 bg-slate-950/80 p-3 rounded-xl border border-glassBorder/60 mt-2">
                          <input
                            type="text"
                            value={report}
                            onChange={(e) => setReport(e.target.value)}
                            placeholder="Brief maintenance report..."
                            className="bg-slate-900 border border-glassBorder p-2 rounded text-[11px] text-slate-100 placeholder-slate-500 focus:outline-none"
                          />
                          <div className="flex gap-1.5 justify-end">
                            <button
                              onClick={() => setSelectedCompId(null)}
                              className="px-2 py-1 bg-slate-800 text-slate-400 rounded text-[10px]"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => updateStatus(c.id, 'RESOLVED')}
                              className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-[10px] font-bold"
                            >
                              Complete
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedCompId(c.id)}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg"
                        >
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
