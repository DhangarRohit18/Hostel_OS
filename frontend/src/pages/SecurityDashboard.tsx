import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { ScanLine, LogOut, LogIn, ClipboardList, Camera, CheckCircle2, AlertTriangle, User } from 'lucide-react';

export const SecurityDashboard: React.FC = () => {
  const [qrInput, setQrInput] = useState('');
  const [activePasses, setActivePasses] = useState<any[]>([]);
  const [activeVisitors, setActiveVisitors] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  // Face Scan Simulation states
  const [scanState, setScanState] = useState<'IDLE' | 'SCANNING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [scanSubject, setScanSubject] = useState<{ name: string; type: string; code: string; action: string } | null>(null);
  const [scanMessage, setScanMessage] = useState('');

  const fetchSecurityData = async () => {
    try {
      const passRes = await apiRequest('/api/gatepass');
      setActivePasses(passRes.passes || []);

      const visitorRes = await apiRequest('/api/visitors');
      setActiveVisitors(visitorRes.visitors || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSecurityData();
    const interval = setInterval(fetchSecurityData, 5000); // 5-second polling interval
    return () => clearInterval(interval);
  }, []);

  const triggerFaceVerification = (name: string, type: 'STUDENT' | 'VISITOR', code: string, action: string, callback: () => Promise<void>) => {
    setScanSubject({ name, type, code, action });
    setScanState('SCANNING');
    setScanMessage('Initializing Biometric Camera & Face Mesh Detection...');
    
    // Simulate steps of face verification
    setTimeout(() => {
      setScanMessage('Locating facial landmarks & patterns...');
      setTimeout(() => {
        setScanMessage('Comparing with registered college database profile photo...');
        setTimeout(async () => {
          try {
            await callback();
            setScanState('SUCCESS');
            setScanMessage(`Identity Verified: ${name} matched with 99.85% confidence.`);
            setTimeout(() => {
              setScanState('IDLE');
              setScanSubject(null);
            }, 3000);
          } catch (err: any) {
            setScanState('ERROR');
            setScanMessage(`Biometric mismatch or database validation error: ${err.message}`);
            setTimeout(() => {
              setScanState('IDLE');
              setScanSubject(null);
            }, 4000);
          }
        }, 1000);
      }, 1000);
    }, 1000);
  };

  const processGatePass = async (qr: string, action: 'EXIT' | 'RETURN') => {
    const pass = activePasses.find(p => p.qrCode === qr);
    const studentName = pass?.student?.user?.name || qr || 'Student';
    
    const executeRequest = async () => {
      const res = await apiRequest('/api/gatepass/scan', {
        method: 'POST',
        body: JSON.stringify({ qrCode: qr, action }),
      });
      setQrInput('');
      setLogs(prev => [`[${new Date().toLocaleTimeString()}] Face ID Match & QR Approved: ${res.message}`, ...prev]);
      fetchSecurityData();
    };

    triggerFaceVerification(studentName, 'STUDENT', qr, action, executeRequest);
  };

  const processVisitor = async (qr: string, action: 'IN' | 'OUT') => {
    const visitor = activeVisitors.find(v => v.qrCode === qr);
    const visitorName = visitor?.name || qr || 'Visitor';

    const executeRequest = async () => {
      const res = await apiRequest('/api/visitors/scan', {
        method: 'POST',
        body: JSON.stringify({ qrCode: qr, action }),
      });
      setQrInput('');
      setLogs(prev => [`[${new Date().toLocaleTimeString()}] Face ID Match & QR Approved: ${res.message}`, ...prev]);
      fetchSecurityData();
    };

    triggerFaceVerification(visitorName, 'VISITOR', qr, action, executeRequest);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      
      {/* Simulation Biometric Scanning Overlay/Modal */}
      {scanState !== 'IDLE' && scanSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-200 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-800 flex items-center justify-center space-x-2">
              <Camera className="text-indigo-600 animate-pulse" size={24} />
              <span>Biometric Entrance Verification</span>
            </h3>

            {/* Scanning graphic frame */}
            <div className="relative mx-auto w-48 h-48 rounded-full border-4 border-indigo-100 flex items-center justify-center bg-slate-50 overflow-hidden shadow-inner">
              {/* Scan Line effect */}
              {scanState === 'SCANNING' && (
                <div className="absolute inset-x-0 h-1 bg-indigo-500/80 shadow-indigo-500/50 shadow-md animate-bounce top-0" style={{ animationDuration: '2.5s' }} />
              )}
              
              {scanState === 'SUCCESS' ? (
                <CheckCircle2 className="text-emerald-500 w-20 h-20 animate-bounce" />
              ) : scanState === 'ERROR' ? (
                <AlertTriangle className="text-rose-500 w-20 h-20 animate-shake" />
              ) : (
                <User className="text-slate-300 w-24 h-24 animate-pulse" />
              )}
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Scanning {scanSubject.type} {scanSubject.action} Pass
              </div>
              <div className="text-base font-bold text-slate-800">
                {scanSubject.name}
              </div>
              <div className="text-xs font-mono text-slate-500 bg-slate-100 px-3 py-1 rounded-full inline-block">
                Code: {scanSubject.code}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-medium text-slate-600">
              <span className={scanState === 'SUCCESS' ? 'text-emerald-600 font-bold' : scanState === 'ERROR' ? 'text-rose-600 font-bold' : 'text-indigo-600'}>
                {scanMessage}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Simulated QR Scanner Panel */}
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
            <ScanLine className="text-indigo-600" size={20} />
            <span>Simulated QR Scanner</span>
          </h3>
          <p className="text-xs text-slate-500">
            For testing: Type or paste the Gate Pass code (e.g. <code>GP-AMAN-8910</code>) or Visitor Code (e.g. <code>VIS-RAKESH-3321</code>).
          </p>
          <div className="space-y-4">
            <input
              type="text"
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              placeholder="Enter QR Code string..."
              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:outline-none"
            />

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => processGatePass(qrInput, 'EXIT')}
                className="py-3.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs flex justify-center items-center space-x-1"
              >
                <LogOut size={14} />
                <span>Student Exit</span>
              </button>
              <button
                onClick={() => processGatePass(qrInput, 'RETURN')}
                className="py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex justify-center items-center space-x-1"
              >
                <LogIn size={14} />
                <span>Student Return</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
              <button
                onClick={() => processVisitor(qrInput, 'IN')}
                className="py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex justify-center items-center space-x-1"
              >
                <LogIn size={14} />
                <span>Visitor In</span>
              </button>
              <button
                onClick={() => processVisitor(qrInput, 'OUT')}
                className="py-3.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl text-xs flex justify-center items-center space-x-1"
              >
                <LogOut size={14} />
                <span>Visitor Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Center/Right: Pending Outings and Visitors for Quick Scan */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick confirmation panel for Student Outings */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Approved Student Outings (Awaiting Guard Scan)</h3>
            {activePasses.filter(p => p.status === 'APPROVED' || p.status === 'EXITED').length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No active student gate passes.</p>
            ) : (
              <div className="space-y-3 max-h-[200px] overflow-y-auto">
                {activePasses.filter(p => p.status === 'APPROVED' || p.status === 'EXITED').map((p) => (
                  <div key={p.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-semibold text-slate-700">{p.student.user.name}</p>
                      <p className="text-slate-500">To: {p.destination} • Code: <strong>{p.qrCode}</strong></p>
                    </div>
                    <div>
                      {p.status === 'APPROVED' ? (
                        <button
                          onClick={() => processGatePass(p.qrCode, 'EXIT')}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold rounded-lg"
                        >
                          Confirm Exit
                        </button>
                      ) : (
                        <button
                          onClick={() => processGatePass(p.qrCode, 'RETURN')}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg"
                        >
                          Confirm Return
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick confirmation for Visitors */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Approved Visitors (Awaiting Guard Scan)</h3>
            {activeVisitors.filter(v => v.status === 'APPROVED' || v.status === 'CHECKED_IN').length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No active visitor registrations.</p>
            ) : (
              <div className="space-y-3 max-h-[200px] overflow-y-auto">
                {activeVisitors.filter(v => v.status === 'APPROVED' || v.status === 'CHECKED_IN').map((v) => (
                  <div key={v.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-semibold text-slate-700">{v.name} ({v.relation})</p>
                      <p className="text-slate-500">Code: <strong>{v.qrCode}</strong></p>
                    </div>
                    <div>
                      {v.status === 'APPROVED' ? (
                        <button
                          onClick={() => processVisitor(v.qrCode, 'IN')}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-lg"
                        >
                          Confirm Entry
                        </button>
                      ) : (
                        <button
                          onClick={() => processVisitor(v.qrCode, 'OUT')}
                          className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-[11px] font-bold rounded-lg"
                        >
                          Confirm Exit
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Guard Incident / Scan Log */}
          <div className="glass-panel p-6 rounded-3xl space-y-3">
            <h3 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
              <ClipboardList size={20} className="text-indigo-600" />
              <span>Shift Scan Log</span>
            </h3>
            {logs.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">Activity logs will populate as passes are processed.</p>
            ) : (
              <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200 max-h-[150px] overflow-y-auto">
                {logs.map((log, idx) => (
                  <p key={idx} className="text-[11px] font-mono text-indigo-600">{log}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

