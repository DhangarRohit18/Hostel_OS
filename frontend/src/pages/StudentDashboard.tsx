import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { Home, ClipboardList, LogOut, FileText, UserMinus, FileClock } from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'complaints' | 'passes' | 'leaves' | 'visitors' | 'billing'>('overview');

  // Overview data
  const [announcements, setAnnouncements] = useState<any[]>([]);
  
  // Complaints data
  const [complaints, setComplaints] = useState<any[]>([]);
  const [compDesc, setCompDesc] = useState('');
  
  // Gate pass data
  const [gatePasses, setGatePasses] = useState<any[]>([]);
  const [passDest, setPassDest] = useState('');
  const [passExit, setPassExit] = useState('');
  const [passReturn, setPassReturn] = useState('');

  // Leave data
  const [leaves, setLeaves] = useState<any[]>([]);
  const [leaveDept, setLeaveDept] = useState('');
  const [leaveRet, setLeaveRet] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  // Visitors data
  const [visitors, setVisitors] = useState<any[]>([]);
  const [vName, setVName] = useState('');
  const [vMobile, setVMobile] = useState('');
  const [vId, setVId] = useState('');
  const [vRelation, setVRelation] = useState('');
  const [vPurpose, setVPurpose] = useState('');

  // Billing data
  const [fees, setFees] = useState<any[]>([]);
  const [electricityBills, setElectricityBills] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const annRes = await apiRequest('/api/announcements');
      setAnnouncements(annRes.announcements);

      const compRes = await apiRequest('/api/complaints');
      setComplaints(compRes.complaints);

      const passRes = await apiRequest('/api/gatepass');
      setGatePasses(passRes.passes);

      const leaveRes = await apiRequest('/api/leaves');
      setLeaves(leaveRes.leaves);

      const visRes = await apiRequest('/api/visitors');
      setVisitors(visRes.visitors);

      const billRes = await apiRequest('/api/billing/all');
      setFees(billRes.fees || []);
      setElectricityBills(billRes.electricityBills || []);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // 5-second polling interval
    return () => clearInterval(interval);
  }, [activeTab]);

  // Form Submissions
  const submitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiRequest('/api/complaints', {
        method: 'POST',
        body: JSON.stringify({ description: compDesc }),
      });
      alert(`Complaint logged! AI auto-classified this as: ${res.aiClassification.category} (Priority: ${res.aiClassification.priority}). routed to ${res.aiClassification.suggestedDepartment}`);
      setCompDesc('');
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const submitGatePass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/gatepass', {
        method: 'POST',
        body: JSON.stringify({ destination: passDest, exitTime: passExit, returnTime: passReturn }),
      });
      alert('Gate pass generated successfully!');
      setPassDest(''); setPassExit(''); setPassReturn('');
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const submitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/leaves', {
        method: 'POST',
        body: JSON.stringify({ departureDate: leaveDept, returnDate: leaveRet, reason: leaveReason, parentConfirmed: true }),
      });
      alert('Leave request registered! Pending warden approval.');
      setLeaveDept(''); setLeaveRet(''); setLeaveReason('');
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const submitVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/visitors', {
        method: 'POST',
        body: JSON.stringify({ name: vName, mobile: vMobile, idProof: vId, relation: vRelation, purpose: vPurpose }),
      });
      alert('Visitor request registered! Pending Warden approval.');
      setVName(''); setVMobile(''); setVId(''); setVRelation(''); setVPurpose('');
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const payBill = async (feeId: string) => {
    try {
      await apiRequest('/api/billing/fee/pay', {
        method: 'POST',
        body: JSON.stringify({ feeId }),
      });
      alert('Mock payment successful! Receipt generated.');
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const st = user?.studentProfile;
  const bed = st?.bed;
  const room = bed?.room;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      
      {/* Welcome header details */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Welcome, {user?.name}!</h2>
          <p className="text-sm text-slate-400">Roll Number: {st?.rollNumber || 'N/A'} • Branch: {st?.branch || 'N/A'}</p>
        </div>
        <div className="flex items-center space-x-3 bg-slate-900/60 p-4 rounded-2xl border border-glassBorder/60">
          <Home className="text-indigo-400" size={20} />
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Accommodation</p>
            <p className="text-xs text-slate-200">
              {room ? `Room ${room.number} (Bed ${bed.number}) • ${room.floor.building.name}` : 'No Bed Allocated'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-glassBorder/30 pb-3">
        {[
          { id: 'overview', label: 'Overview', icon: Home },
          { id: 'complaints', label: 'Complaints', icon: ClipboardList },
          { id: 'passes', label: 'Gate Pass', icon: LogOut },
          { id: 'leaves', label: 'Outing Leave', icon: UserMinus },
          { id: 'visitors', label: 'Visitors', icon: FileClock },
          { id: 'billing', label: 'Billing & Fees', icon: FileText },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
              activeTab === t.id
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/15'
                : 'bg-slate-900/50 border-glassBorder/30 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <t.icon size={16} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Announcements */}
            <div className="glass-panel p-6 rounded-3xl space-y-4">
              <h3 className="text-lg font-bold text-slate-100 flex items-center">
                <span>Recent Notice Board</span>
              </h3>
              {announcements.length === 0 ? (
                <p className="text-sm text-slate-500 py-6 text-center">No announcements broadcasted yet.</p>
              ) : (
                <div className="space-y-4">
                  {announcements.map((a) => (
                    <div key={a.id} className="p-4 rounded-2xl bg-slate-900/50 border border-glassBorder/40">
                      <h4 className="font-semibold text-sm text-indigo-300">{a.title}</h4>
                      <p className="text-xs text-slate-400 mt-1">{a.content}</p>
                      <div className="mt-2.5 flex justify-between items-center text-[10px] text-slate-500">
                        <span>By: {a.creator.name}</span>
                        <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Today's Mess Menu Card */}
            <div className="glass-panel p-6 rounded-3xl space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />
              <h3 className="text-lg font-bold text-slate-100">🍽️ Today's Mess Menu</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-glassBorder/30">
                  <span className="text-slate-400 font-medium">Breakfast</span>
                  <span className="text-slate-200">Masala Dosa, Sambhar, Tea</span>
                </div>
                <div className="flex justify-between py-1 border-b border-glassBorder/30">
                  <span className="text-slate-400 font-medium">Lunch</span>
                  <span className="text-slate-200">Paneer Butter Masala, Roti, Rice</span>
                </div>
                <div className="flex justify-between py-1 border-b border-glassBorder/30">
                  <span className="text-slate-400 font-medium">Snacks</span>
                  <span className="text-slate-200">Samosa, Tea</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400 font-medium">Dinner</span>
                  <span className="text-slate-200">Kadhai Paneer, Chapati, Kheer</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complaints tab */}
      {activeTab === 'complaints' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* File Complaint Form */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Report an Issue</h3>
            <form onSubmit={submitComplaint} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Description</label>
                <textarea
                  required
                  rows={4}
                  value={compDesc}
                  onChange={(e) => setCompDesc(e.target.value)}
                  placeholder="Describe your issue here. e.g., 'The ceiling fan in Room 101 is sparking and making noise.'"
                  className="w-full bg-slate-900/60 border border-glassBorder/60 rounded-xl p-3 text-sm text-slate-100 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 font-semibold rounded-xl text-white text-sm transition-all"
              >
                Submit & Let AI Route
              </button>
            </form>
          </div>

          {/* Past Complaints List */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-3xl space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Complaint Tickets</h3>
            {complaints.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No tickets logged.</p>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[450px]">
                {complaints.map((c) => (
                  <div key={c.id} className="p-4 rounded-2xl bg-slate-900/50 border border-glassBorder/40 flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/20">{c.category}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          c.priority === 'EMERGENCY' ? 'bg-red-950 text-red-300 border border-red-500/20' : 'bg-slate-900 text-slate-400'
                        }`}>{c.priority}</span>
                      </div>
                      <p className="text-xs text-slate-200 mt-1">{c.description}</p>
                      {c.assignedStaff && <p className="text-[10px] text-slate-400 mt-1">Assigned: {c.assignedStaff.user.name}</p>}
                    </div>
                    <div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        c.status === 'OPEN' ? 'bg-blue-950 text-blue-300' :
                        c.status === 'ASSIGNED' ? 'bg-yellow-950 text-yellow-300' :
                        c.status === 'IN_PROGRESS' ? 'bg-purple-950 text-purple-300' : 'bg-green-950 text-green-300'
                      }`}>{c.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Gate Passes tab */}
      {activeTab === 'passes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Request Gate Pass</h3>
            <form onSubmit={submitGatePass} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Destination</label>
                <input
                  type="text" required value={passDest} onChange={(e) => setPassDest(e.target.value)}
                  placeholder="Local Supermarket / Home"
                  className="w-full bg-slate-900/60 border border-glassBorder/60 rounded-xl p-3 text-sm text-slate-100 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Exit Date & Time</label>
                <input
                  type="datetime-local" required value={passExit} onChange={(e) => setPassExit(e.target.value)}
                  className="w-full bg-slate-900/60 border border-glassBorder/60 rounded-xl p-3 text-sm text-slate-100 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Expected Return Date & Time</label>
                <input
                  type="datetime-local" required value={passReturn} onChange={(e) => setPassReturn(e.target.value)}
                  className="w-full bg-slate-900/60 border border-glassBorder/60 rounded-xl p-3 text-sm text-slate-100 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 font-semibold rounded-xl text-white text-sm transition-all"
              >
                Generate QR Pass
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 glass-panel p-6 rounded-3xl space-y-4">
            <h3 className="text-lg font-bold text-slate-100">My Outing Log</h3>
            {gatePasses.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No passes generated.</p>
            ) : (
              <div className="space-y-4 overflow-y-auto max-h-[450px]">
                {gatePasses.map((p) => (
                  <div key={p.id} className="p-4 rounded-2xl bg-slate-900/50 border border-glassBorder/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-indigo-300">To: {p.destination}</p>
                      <p className="text-xs text-slate-400">Exit: {new Date(p.exitTime).toLocaleString()}</p>
                      <p className="text-xs text-slate-400">Return: {new Date(p.returnTime).toLocaleString()}</p>
                      <div className="mt-2 flex items-center space-x-2 bg-slate-900/80 p-2 rounded-lg border border-glassBorder/50 w-fit">
                        <span className="text-[10px] font-mono text-slate-400">QR Code: <strong>{p.qrCode}</strong></span>
                      </div>
                    </div>
                    <div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        p.status === 'APPROVED' ? 'bg-blue-950 text-blue-300' :
                        p.status === 'EXITED' ? 'bg-yellow-950 text-yellow-300' :
                        p.status === 'RETURNED' ? 'bg-green-950 text-green-300' : 'bg-red-950 text-red-300'
                      }`}>{p.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leave request tab */}
      {activeTab === 'leaves' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Apply for Outing Leave</h3>
            <form onSubmit={submitLeave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Departure Date</label>
                <input
                  type="date" required value={leaveDept} onChange={(e) => setLeaveDept(e.target.value)}
                  className="w-full bg-slate-900/60 border border-glassBorder/60 rounded-xl p-3 text-sm text-slate-100 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Return Date</label>
                <input
                  type="date" required value={leaveRet} onChange={(e) => setLeaveRet(e.target.value)}
                  className="w-full bg-slate-900/60 border border-glassBorder/60 rounded-xl p-3 text-sm text-slate-100 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Reason</label>
                <textarea
                  required value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="Reason for outing leave..."
                  className="w-full bg-slate-900/60 border border-glassBorder/60 rounded-xl p-3 text-sm text-slate-100 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 font-semibold rounded-xl text-white text-sm transition-all"
              >
                Apply Leave
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 glass-panel p-6 rounded-3xl space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Leave Applications</h3>
            {leaves.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No leave requests submitted.</p>
            ) : (
              <div className="space-y-3">
                {leaves.map((l) => (
                  <div key={l.id} className="p-4 rounded-2xl bg-slate-900/50 border border-glassBorder/40 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-semibold text-slate-200">{l.reason}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Outing: {new Date(l.departureDate).toLocaleDateString()} to {new Date(l.returnDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        l.status === 'APPROVED' ? 'bg-green-950 text-green-300' :
                        l.status === 'REJECTED' ? 'bg-red-950 text-red-300' : 'bg-yellow-950 text-yellow-300'
                      }`}>{l.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Visitors management tab */}
      {activeTab === 'visitors' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Register Visitor</h3>
            <form onSubmit={submitVisitor} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Visitor Name</label>
                <input
                  type="text" required value={vName} onChange={(e) => setVName(e.target.value)}
                  className="w-full bg-slate-900/60 border border-glassBorder/60 rounded-xl p-3 text-sm text-slate-100 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Mobile Number</label>
                  <input
                    type="tel" required value={vMobile} onChange={(e) => setVMobile(e.target.value)}
                    className="w-full bg-slate-900/60 border border-glassBorder/60 rounded-xl p-3 text-sm text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Relation</label>
                  <input
                    type="text" required value={vRelation} onChange={(e) => setVRelation(e.target.value)}
                    className="w-full bg-slate-900/60 border border-glassBorder/60 rounded-xl p-3 text-sm text-slate-100 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">ID Proof Number</label>
                <input
                  type="text" required value={vId} onChange={(e) => setVId(e.target.value)}
                  placeholder="Aadhaar / Passport"
                  className="w-full bg-slate-900/60 border border-glassBorder/60 rounded-xl p-3 text-sm text-slate-100 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Purpose of Visit</label>
                <textarea
                  required value={vPurpose} onChange={(e) => setVPurpose(e.target.value)}
                  className="w-full bg-slate-900/60 border border-glassBorder/60 rounded-xl p-3 text-sm text-slate-100 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 font-semibold rounded-xl text-white text-sm transition-all"
              >
                Register Visitor
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 glass-panel p-6 rounded-3xl space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Visitor Logs</h3>
            {visitors.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No visitor records created.</p>
            ) : (
              <div className="space-y-4 overflow-y-auto max-h-[450px]">
                {visitors.map((v) => (
                  <div key={v.id} className="p-4 rounded-2xl bg-slate-900/50 border border-glassBorder/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-200">{v.name} ({v.relation})</p>
                      <p className="text-xs text-slate-400">Mobile: {v.mobile} • Purpose: {v.purpose}</p>
                      <div className="mt-2.5 flex items-center space-x-2 bg-slate-900/80 p-2 rounded-lg border border-glassBorder/50 w-fit">
                        <span className="text-[10px] font-mono text-slate-400">Visitor QR: <strong>{v.qrCode}</strong></span>
                      </div>
                    </div>
                    <div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        v.status === 'APPROVED' ? 'bg-blue-950 text-blue-300' :
                        v.status === 'CHECKED_IN' ? 'bg-yellow-950 text-yellow-300' :
                        v.status === 'CHECKED_OUT' ? 'bg-green-950 text-green-300' : 'bg-red-950 text-red-300'
                      }`}>{v.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fees & Billing tab */}
      {activeTab === 'billing' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hostel Fees */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Hostel & Mess Fees</h3>
            {fees.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No fee accounts registered.</p>
            ) : (
              <div className="space-y-3">
                {fees.map((f) => (
                  <div key={f.id} className="p-4 rounded-2xl bg-slate-900/50 border border-glassBorder/40 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-slate-200">₹{f.amount} • {f.type}</p>
                      <p className="text-xs text-slate-400">Due: {new Date(f.dueDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      {f.status === 'UNPAID' ? (
                        <button
                          onClick={() => payBill(f.id)}
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all"
                        >
                          Pay Now
                        </button>
                      ) : (
                        <span className="text-xs font-bold px-3 py-1 bg-green-950 text-green-300 rounded-full">Paid</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Electricity Billing */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Electricity Billing</h3>
            {electricityBills.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No electricity billing logs found.</p>
            ) : (
              <div className="space-y-3">
                {electricityBills.map((e) => (
                  <div key={e.id} className="p-4 rounded-2xl bg-slate-900/50 border border-glassBorder/40">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-bold text-slate-200">₹{e.amount} (Consumption: {e.consumption} Units)</p>
                        <p className="text-xs text-slate-400">Month: {e.month}/{e.year} • Meter Reading: {e.readingPrev} to {e.readingCurrent}</p>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                        e.status === 'PAID' ? 'bg-green-950 text-green-300' : 'bg-yellow-950 text-yellow-300'
                      }`}>{e.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
