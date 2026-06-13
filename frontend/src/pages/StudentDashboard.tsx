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

  // Razorpay mock modal state
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [razorpayFeeId, setRazorpayFeeId] = useState('');
  const [razorpayAmount, setRazorpayAmount] = useState(0);
  const [razorpayType, setRazorpayType] = useState('');
  const [razorpayBillType, setRazorpayBillType] = useState<'fee' | 'electricity'>('fee');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState('student@ybl');
  const [cardNum, setCardNum] = useState('4111 1111 1111 1111');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('');

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

  const openRazorpay = (id: string, amount: number, type: string, billType: 'fee' | 'electricity') => {
    setRazorpayFeeId(id);
    setRazorpayAmount(amount);
    setRazorpayType(type);
    setRazorpayBillType(billType);
    setPaymentSuccess(false);
    setPaymentLoading(false);
    setSelectedMethod('upi');
    setCardCvv('');
    setShowRazorpayModal(true);
  };

  const executePayment = async () => {
    setPaymentLoading(true);
    await new Promise(r => setTimeout(r, 2200)); // simulate gateway processing
    try {
      if (razorpayBillType === 'fee') {
        await apiRequest('/api/billing/fee/pay', {
          method: 'POST',
          body: JSON.stringify({ feeId: razorpayFeeId }),
        });
      } else {
        await apiRequest('/api/billing/electricity/pay', {
          method: 'POST',
          body: JSON.stringify({ billId: razorpayFeeId }),
        });
      }
      setPaymentSuccess(true);
      fetchData();
    } catch (err: any) {
      alert('Payment failed: ' + err.message);
      setPaymentLoading(false);
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
                          onClick={() => openRazorpay(f.id, f.amount, f.type, 'fee')}
                          className="px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-900/30 flex items-center gap-1.5"
                        >
                          <svg width="12" height="12" viewBox="0 0 28 28" fill="none"><path d="M14 0C6.268 0 0 6.268 0 14s6.268 14 14 14 14-6.268 14-14S21.732 0 14 0z" fill="#072654"/><path d="M19.5 8.5H12l-3 11h3l1-4h4.5c2.5 0 4-1.5 4-3.5 0-2-1.5-3.5-2-3.5z" fill="#fff"/></svg>
                          Pay via Razorpay
                        </button>
                      ) : (
                        <span className="text-xs font-bold px-3 py-1 bg-green-950 text-green-300 rounded-full">✓ Paid</span>
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
                      <div className="flex items-center gap-2">
                        {e.status === 'UNPAID' || e.status === 'PENDING' ? (
                          <button
                            onClick={() => openRazorpay(e.id, e.amount, `Electricity Bill ${e.month}/${e.year}`, 'electricity')}
                            className="px-3 py-1.5 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-yellow-900/30"
                          >
                            Pay ₹{e.amount}
                          </button>
                        ) : (
                          <span className="text-xs font-bold px-3 py-1 bg-green-950 text-green-300 rounded-full">✓ Paid</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ RAZORPAY MOCK CHECKOUT MODAL ============ */}
      {showRazorpayModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => { if ((e.target as any) === e.currentTarget && !paymentLoading) setShowRazorpayModal(false); }}
        >
          <div
            className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: '#fff', fontFamily: 'Inter, sans-serif' }}
          >
            {/* Razorpay Header */}
            <div style={{ background: 'linear-gradient(135deg, #072654 0%, #1a56a0 100%)', padding: '20px 24px' }} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div style={{ background: '#fff', borderRadius: 8, padding: '6px 10px' }}>
                  <svg width="80" height="20" viewBox="0 0 120 32" fill="none">
                    <path d="M0 16C0 7.163 7.163 0 16 0h88c8.837 0 16 7.163 16 16s-7.163 16-16 16H16C7.163 32 0 24.837 0 16z" fill="#072654"/>
                    <text x="8" y="22" fontFamily="Arial" fontWeight="bold" fontSize="14" fill="#3395FF">razorpay</text>
                  </svg>
                </div>
                <div>
                  <p style={{ color: '#a8c8ff', fontSize: 11 }}>Smart Hostel OS</p>
                  <p style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>₹{razorpayAmount.toLocaleString('en-IN')}</p>
                </div>
              </div>
              {!paymentLoading && !paymentSuccess && (
                <button
                  onClick={() => setShowRazorpayModal(false)}
                  style={{ color: '#a8c8ff', background: 'none', border: 'none', cursor: 'pointer', fontSize: 22 }}
                >✕</button>
              )}
            </div>

            <div style={{ padding: '0 24px 24px' }}>
              {/* Order Summary */}
              <div style={{ background: '#f0f6ff', borderRadius: 10, padding: '12px 16px', margin: '18px 0 16px' }}>
                <p style={{ color: '#072654', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Payment For</p>
                <p style={{ color: '#1a56a0', fontSize: 14, fontWeight: 700 }}>{razorpayType.replace('_', ' ')}</p>
                <p style={{ color: '#555', fontSize: 12, marginTop: 2 }}>Order ID: RP{Math.random().toString(36).substring(2,10).toUpperCase()}</p>
              </div>

              {paymentSuccess ? (
                /* Success State */
                <div style={{ textAlign: 'center', padding: '20px 0 10px' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#e6f9f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <svg width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#00b55a"/><path d="M9 16l5 5 9-9" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <p style={{ color: '#00b55a', fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Payment Successful!</p>
                  <p style={{ color: '#555', fontSize: 13 }}>₹{razorpayAmount.toLocaleString('en-IN')} paid successfully</p>
                  <p style={{ color: '#aaa', fontSize: 11, marginTop: 4 }}>Receipt will be emailed to your registered address</p>
                  <button
                    onClick={() => setShowRazorpayModal(false)}
                    style={{ marginTop: 20, background: 'linear-gradient(135deg, #072654, #1a56a0)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 40px', fontWeight: 700, fontSize: 14, cursor: 'pointer', width: '100%' }}
                  >Done</button>
                </div>
              ) : paymentLoading ? (
                /* Loading State */
                <div style={{ textAlign: 'center', padding: '30px 0 20px' }}>
                  <div style={{ width: 48, height: 48, border: '4px solid #e5e7eb', borderTop: '4px solid #3395FF', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                  <p style={{ color: '#1a56a0', fontWeight: 600, fontSize: 15 }}>Processing Payment...</p>
                  <p style={{ color: '#aaa', fontSize: 12, marginTop: 4 }}>Please do not close this window</p>
                  <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                </div>
              ) : (
                /* Payment Form */
                <>
                  {/* Method Tabs */}
                  <div style={{ display: 'flex', borderRadius: 10, background: '#f3f4f6', padding: 4, marginBottom: 20 }}>
                    {(['upi', 'card', 'netbanking'] as const).map(m => (
                      <button
                        key={m}
                        onClick={() => setSelectedMethod(m)}
                        style={{
                          flex: 1,
                          padding: '8px 0',
                          border: 'none',
                          borderRadius: 8,
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: 12,
                          transition: 'all 0.2s',
                          background: selectedMethod === m ? '#072654' : 'transparent',
                          color: selectedMethod === m ? '#fff' : '#666',
                        }}
                      >
                        {m === 'upi' ? '📱 UPI' : m === 'card' ? '💳 Card' : '🏦 Netbanking'}
                      </button>
                    ))}
                  </div>

                  {/* UPI Method */}
                  {selectedMethod === 'upi' && (
                    <div>
                      <label style={{ color: '#333', fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 6 }}>UPI ID</label>
                      <input
                        value={upiId}
                        onChange={e => setUpiId(e.target.value)}
                        placeholder="yourname@upi"
                        style={{ width: '100%', border: '1.5px solid #d1d5db', borderRadius: 10, padding: '11px 14px', fontSize: 14, color: '#111', outline: 'none', boxSizing: 'border-box' }}
                      />
                      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                        {['@ybl', '@oksbi', '@paytm', '@gpay'].map(suffix => (
                          <button key={suffix} onClick={() => setUpiId(`student${suffix}`)} style={{ padding: '5px 12px', border: '1.5px solid #d1d5db', borderRadius: 20, fontSize: 11, cursor: 'pointer', background: '#fff', color: '#333' }}>{suffix}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Card Method */}
                  {selectedMethod === 'card' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <label style={{ color: '#333', fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 6 }}>Card Number</label>
                        <input
                          value={cardNum}
                          onChange={e => setCardNum(e.target.value)}
                          placeholder="1234 5678 9012 3456"
                          style={{ width: '100%', border: '1.5px solid #d1d5db', borderRadius: 10, padding: '11px 14px', fontSize: 14, color: '#111', outline: 'none', boxSizing: 'border-box', letterSpacing: 2 }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ color: '#333', fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 6 }}>Expiry</label>
                          <input value={cardExpiry} onChange={e => setCardExpiry(e.target.value)} placeholder="MM/YY" style={{ width: '100%', border: '1.5px solid #d1d5db', borderRadius: 10, padding: '11px 14px', fontSize: 14, color: '#111', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ color: '#333', fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 6 }}>CVV</label>
                          <input value={cardCvv} onChange={e => setCardCvv(e.target.value)} placeholder="• • •" type="password" maxLength={3} style={{ width: '100%', border: '1.5px solid #d1d5db', borderRadius: 10, padding: '11px 14px', fontSize: 14, color: '#111', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Netbanking Method */}
                  {selectedMethod === 'netbanking' && (
                    <div>
                      <label style={{ color: '#333', fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 10 }}>Select Your Bank</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {['SBI', 'HDFC', 'ICICI', 'Axis', 'Kotak', 'PNB'].map(bank => (
                          <button key={bank} style={{ padding: '10px', border: '1.5px solid #d1d5db', borderRadius: 10, cursor: 'pointer', background: '#fff', fontSize: 13, fontWeight: 600, color: '#333', transition: 'all 0.15s' }}
                            onMouseEnter={e => (e.currentTarget.style.borderColor = '#072654')}
                            onMouseLeave={e => (e.currentTarget.style.borderColor = '#d1d5db')}
                          >{bank}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Secure Pay Button */}
                  <button
                    onClick={executePayment}
                    style={{ width: '100%', marginTop: 20, background: 'linear-gradient(135deg, #072654 0%, #3395FF 100%)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 700, fontSize: 16, cursor: 'pointer', letterSpacing: 0.5 }}
                  >
                    🔒 Pay ₹{razorpayAmount.toLocaleString('en-IN')} Securely
                  </button>

                  {/* Security Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2L3 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-9-4z" fill="#00b55a"/></svg>
                    <span style={{ color: '#aaa', fontSize: 11 }}>Secured by Razorpay • 256-bit SSL encryption</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
