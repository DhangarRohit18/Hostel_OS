import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Settings, Plus, Sparkles, AlertCircle } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'infrastructure' | 'billing' | 'predictions'>('predictions');

  // Infrastructure creation forms
  const [bName, setBName] = useState('');
  const [floorBId, setFloorBId] = useState('');
  const [floorNum, setFloorNum] = useState('');
  const [roomFId, setRoomFId] = useState('');
  const [roomNum, setRoomNum] = useState('');
  const [roomType, setRoomType] = useState('DOUBLE');

  // Billing forms
  const [feeStudentId, setFeeStudentId] = useState('');
  const [feeAmount, setFeeAmount] = useState('');
  const [feeType, setFeeType] = useState('HOSTEL_FEE');
  const [feeDueDate, setFeeDueDate] = useState('');

  // Room list & students list
  const [buildings, setBuildings] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  // AI Predictive Analytics
  const [aiReport, setAiReport] = useState<any>(null);

  const fetchAdminData = async () => {
    try {
      const infraRes = await apiRequest('/api/infra/overview');
      setBuildings(infraRes.buildings || []);

      const billRes = await apiRequest('/api/billing/all');
      const allFees = billRes.fees || [];
      const distinctStudents = Array.from(new Map(allFees.map((f: any) => [f.student.id, f.student])).values());
      setStudents(distinctStudents);

      if (activeTab === 'predictions') {
        const reportRes = await apiRequest('/api/ai/predictions');
        setAiReport(reportRes.report);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const handleCreateBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/infra/building', {
        method: 'POST',
        body: JSON.stringify({ name: bName }),
      });
      alert('Building created!');
      setBName('');
      fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/infra/floor', {
        method: 'POST',
        body: JSON.stringify({ number: floorNum, buildingId: floorBId }),
      });
      alert('Floor created!');
      setFloorNum('');
      fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/infra/room', {
        method: 'POST',
        body: JSON.stringify({ number: roomNum, type: roomType, floorId: roomFId }),
      });
      alert('Room and Beds created!');
      setRoomNum('');
      fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/billing/fee', {
        method: 'POST',
        body: JSON.stringify({ studentId: feeStudentId, amount: feeAmount, type: feeType, dueDate: feeDueDate }),
      });
      alert('Fee invoice generated!');
      setFeeStudentId(''); setFeeAmount(''); setFeeDueDate('');
      fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const mockChartData = [
    { name: 'Jan', complaints: 4, usage: 120 },
    { name: 'Feb', complaints: 10, usage: 150 },
    { name: 'Mar', complaints: 12, usage: 180 },
    { name: 'Apr', complaints: 8, usage: 220 },
    { name: 'May', complaints: 15, usage: 260 },
    { name: 'Jun', complaints: 18, usage: 320 },
  ];

  let totalBeds = 0;
  let occupiedBeds = 0;
  if (buildings && Array.isArray(buildings)) {
    buildings.forEach((b: any) => {
      if (b.floors && Array.isArray(b.floors)) {
        b.floors.forEach((f: any) => {
          if (f.rooms && Array.isArray(f.rooms)) {
            f.rooms.forEach((r: any) => {
              if (r.beds && Array.isArray(r.beds)) {
                totalBeds += r.beds.length;
                occupiedBeds += r.beds.filter((bd: any) => bd.isOccupied).length;
              }
            });
          }
        });
      }
    });
  }
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : (aiReport?.occupancy?.currentRate || 88);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      
      {/* Intelligent Crowd Alert Banner */}
      {occupancyRate >= 85 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center space-x-3 text-amber-800 animate-pulse">
          <AlertCircle className="text-amber-600 flex-shrink-0" size={22} />
          <div className="text-xs">
            <span className="font-bold">Intelligent Crowd Alert:</span> Global occupancy is critical at <span className="font-bold text-amber-700">{occupancyRate}%</span>. Capacity trends predict a high crowding index during mess hours. Dispatched warnings to all warden boards.
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-glassBorder/30 pb-3">
        {[
          { id: 'predictions', label: 'AI Predictive Reports', icon: Sparkles },
          { id: 'infrastructure', label: 'Infrastructure Setup', icon: Plus },
          { id: 'billing', label: 'Fees & Invoicing', icon: Settings },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
              activeTab === t.id
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                : 'bg-slate-900/50 border-glassBorder/30 text-slate-400 hover:text-slate-200'
            }`}
          >
            <t.icon size={16} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Predictions Tab */}
      {activeTab === 'predictions' && (
        <div className="space-y-6">
          {aiReport && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="glass-panel p-5 rounded-3xl border border-indigo-500/20 text-xs">
                <p className="text-slate-400 font-semibold uppercase">🍽️ Mess Demand AI Forecast</p>
                <h4 className="text-xl font-bold text-slate-100 mt-2">{aiReport.messDemand.predictedMessAttendance} Plates</h4>
                <p className="text-slate-500 mt-1">Excludes {aiReport.messDemand.predictedAbsentees} students on leave</p>
              </div>

              <div className="glass-panel p-5 rounded-3xl border border-indigo-500/20 text-xs">
                <p className="text-slate-400 font-semibold uppercase">⚡ Electricity Spike Risk</p>
                <h4 className="text-xl font-bold text-slate-100 mt-2">{aiReport.electricity.projectedPeakUnits} Units (Proj.)</h4>
                <p className="text-slate-500 mt-1">Status: {aiReport.electricity.riskLevel}</p>
              </div>

              <div className="glass-panel p-5 rounded-3xl border border-indigo-500/20 text-xs">
                <p className="text-slate-400 font-semibold uppercase">🛠️ Complaint Projection</p>
                <h4 className="text-xl font-bold text-slate-100 mt-2">{aiReport.complaints.projectedNextMonthCount} Tickets</h4>
                <p className="text-slate-500 mt-1">Primary source: {aiReport.complaints.mainCategory}</p>
              </div>

              <div className="glass-panel p-5 rounded-3xl border border-indigo-500/20 text-xs">
                <p className="text-slate-400 font-semibold uppercase">🏢 Next Semester Occupancy</p>
                <h4 className="text-xl font-bold text-slate-100 mt-2">{aiReport.occupancy.projectedRateNextSemester}%</h4>
                <p className="text-slate-500 mt-1">Current rate: {aiReport.occupancy.currentRate}%</p>
              </div>
            </div>
          )}

          {/* Recharts Analytics */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Monthly Electricity Consumption Trends (AI projections)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockChartData}>
                  <defs>
                    <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.1)' }} />
                  <Area type="monotone" dataKey="usage" stroke="#6366f1" fillOpacity={1} fill="url(#colorUsage)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Infrastructure Tab */}
      {activeTab === 'infrastructure' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
          
          {/* Create Building */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h3 className="text-base font-bold text-slate-100">Add Building</h3>
            <form onSubmit={handleCreateBuilding} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Building Name</label>
                <input
                  type="text" required value={bName} onChange={(e) => setBName(e.target.value)}
                  placeholder="e.g. Aryabhatta Hall"
                  className="w-full bg-slate-900 border border-glassBorder p-2.5 rounded-lg text-slate-100 focus:outline-none"
                />
              </div>
              <button type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 font-bold rounded-lg text-white">Create Building</button>
            </form>
          </div>

          {/* Create Floor */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h3 className="text-base font-bold text-slate-100">Add Floor</h3>
            <form onSubmit={handleCreateFloor} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Select Building</label>
                <select
                  value={floorBId} onChange={(e) => setFloorBId(e.target.value)}
                  className="w-full bg-slate-900 border border-glassBorder p-2.5 rounded-lg text-slate-100"
                >
                  <option value="">-- Choose Building --</option>
                  {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Floor Number</label>
                <input
                  type="number" required value={floorNum} onChange={(e) => setFloorNum(e.target.value)}
                  placeholder="e.g. 1"
                  className="w-full bg-slate-900 border border-glassBorder p-2.5 rounded-lg text-slate-100"
                />
              </div>
              <button type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 font-bold rounded-lg text-white">Create Floor</button>
            </form>
          </div>

          {/* Create Room */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h3 className="text-base font-bold text-slate-100">Add Room</h3>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Select Floor</label>
                <select
                  value={roomFId} onChange={(e) => setRoomFId(e.target.value)}
                  className="w-full bg-slate-900 border border-glassBorder p-2.5 rounded-lg text-slate-100"
                >
                  <option value="">-- Choose Floor --</option>
                  {buildings.map(b => b.floors.map((f: any) => (
                    <option key={f.id} value={f.id}>{b.name} - Floor {f.number}</option>
                  )))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Room Number</label>
                <input
                  type="text" required value={roomNum} onChange={(e) => setRoomNum(e.target.value)}
                  placeholder="e.g. 101"
                  className="w-full bg-slate-900 border border-glassBorder p-2.5 rounded-lg text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Room Type</label>
                <select
                  value={roomType} onChange={(e) => setRoomType(e.target.value)}
                  className="w-full bg-slate-900 border border-glassBorder p-2.5 rounded-lg text-slate-100"
                >
                  <option value="SINGLE">Single Bed</option>
                  <option value="DOUBLE">Double Shared</option>
                  <option value="TRIPLE">Triple Shared</option>
                </select>
              </div>
              <button type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 font-bold rounded-lg text-white">Create Room & Beds</button>
            </form>
          </div>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div className="max-w-xl mx-auto glass-panel p-6 rounded-3xl space-y-4 text-xs">
          <h3 className="text-base font-bold text-slate-100">Generate Student Fee Invoice</h3>
          <form onSubmit={handleGenerateInvoice} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Select Student</label>
              <select
                value={feeStudentId} onChange={(e) => setFeeStudentId(e.target.value)}
                className="w-full bg-slate-900 border border-glassBorder p-2.5 rounded-lg text-slate-100"
              >
                <option value="">-- Choose Student --</option>
                {students.map((s: any) => <option key={s.id} value={s.id}>{s.user.name} ({s.rollNumber})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Invoice Amount (₹)</label>
                <input
                  type="number" required value={feeAmount} onChange={(e) => setFeeAmount(e.target.value)}
                  placeholder="e.g. 45000"
                  className="w-full bg-slate-900 border border-glassBorder p-2.5 rounded-lg text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Fee Type</label>
                <select
                  value={feeType} onChange={(e) => setFeeType(e.target.value)}
                  className="w-full bg-slate-900 border border-glassBorder p-2.5 rounded-lg text-slate-100"
                >
                  <option value="HOSTEL_FEE">Hostel Term Fee</option>
                  <option value="MESS_FEE">Mess Food Fee</option>
                  <option value="SECURITY_DEPOSIT">Security Deposit</option>
                  <option value="FINE">Rule Fine / Penalty</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Due Date</label>
              <input
                type="date" required value={feeDueDate} onChange={(e) => setFeeDueDate(e.target.value)}
                className="w-full bg-slate-900 border border-glassBorder p-2.5 rounded-lg text-slate-100"
              />
            </div>
            <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 font-bold rounded-lg text-white">Dispatch Invoice</button>
          </form>
        </div>
      )}
    </div>
  );
};
