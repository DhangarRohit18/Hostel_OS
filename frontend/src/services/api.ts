const getHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

const getApiUrl = (path: string) => {
  // @ts-ignore
  const baseUrl = import.meta.env?.VITE_API_URL || 'http://localhost:5001';
  return `${baseUrl}${path}`;
};

const getMockDataFallback = (url: string, options: RequestInit = {}) => {
  const path = url.replace(/^\/api/, '');
  const method = options.method ? options.method.toUpperCase() : 'GET';
  const lastEmail = localStorage.getItem('lastDemoEmail') || 'student1@hostel.com';
  
  // Resolve mock user details based on last selected quick login email
  let role = 'STUDENT';
  let name = 'Aman Sharma';
  if (lastEmail.includes('admin')) { role = 'ADMIN'; name = 'Dr. Rajesh Kumar'; }
  else if (lastEmail.includes('warden')) { role = 'WARDEN'; name = 'Dr. Ananya Iyer'; }
  else if (lastEmail.includes('guard')) { role = 'GUARD'; name = 'Ramesh Singh'; }
  else if (lastEmail.includes('staff')) { role = 'STAFF'; name = 'Suresh Kumar'; }
  else if (lastEmail.includes('parent')) { role = 'PARENT'; name = 'Manoj Sharma'; }

  // Helpers for LocalStorage Database
  const getDb = (key: string, initial: any) => {
    const data = localStorage.getItem(`db_${key}`);
    if (!data) {
      localStorage.setItem(`db_${key}`, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(data);
  };
  const saveDb = (key: string, data: any) => {
    localStorage.setItem(`db_${key}`, JSON.stringify(data));
  };

  if (path.includes('/auth/login') || path.includes('/auth/register')) {
    return {
      accessToken: 'mock-access-token-12345',
      refreshToken: 'mock-refresh-token-12345',
      message: 'Demo Login Success (Offline Persistent Mode)',
      user: { id: `mock-${role.toLowerCase()}-id`, email: lastEmail, name, role }
    };
  }

  if (path.includes('/auth/me')) {
    return {
      user: {
        id: `mock-${role.toLowerCase()}-id`,
        email: lastEmail,
        name: name,
        role: role,
        phone: '+919876543210',
        studentProfile: role === 'STUDENT' ? {
          id: 'mock-student-profile-id',
          rollNumber: 'CS2026091',
          branch: 'Computer Science',
          year: 3,
          gender: 'Male',
          parentEmail: 'parent@hostel.com',
          bed: {
            id: 'mock-bed-id',
            number: 'A',
            room: {
              number: '101',
              type: 'DOUBLE',
              floor: {
                number: 1,
                building: { name: 'Aryabhatta Hall' }
              }
            }
          }
        } : null,
        parentProfile: role === 'PARENT' ? {
          students: [{
            user: { name: 'Aman Sharma' },
            rollNumber: 'CS2026091',
            branch: 'Computer Science',
            bed: {
              room: {
                number: '101',
                floor: { building: { name: 'Aryabhatta Hall' } }
              }
            }
          }]
        } : null
      }
    };
  }

  if (path.includes('/announcements')) {
    const list = getDb('announcements', [
      { id: '1', title: '⚠️ Power Outage Notice', content: 'Scheduled power grid maintenance tomorrow 2 PM to 4 PM.', createdAt: new Date().toISOString() },
      { id: '2', title: '🍽️ Mess Menu Revision', content: 'From next week, Sunday dinner menu is updated with Paneer Butter Masala.', createdAt: new Date().toISOString() }
    ]);
    if (method === 'POST' && options.body) {
      try {
        const body = JSON.parse(options.body as string);
        const newItem = { id: String(list.length + 1), title: body.title, content: body.content, createdAt: new Date().toISOString() };
        list.unshift(newItem);
        saveDb('announcements', list);
        return { message: 'Announcement notice broadcasted successfully', announcement: newItem };
      } catch (e) {}
    }
    return { announcements: list };
  }

  if (path.includes('/leaves')) {
    const list = getDb('leaves', [
      { id: '1', reason: 'Diwali Break Visit', departureDate: new Date().toISOString(), returnDate: new Date(Date.now() + 86400000 * 3).toISOString(), status: 'APPROVED', student: { rollNumber: 'CS2026091', branch: 'Computer Science', user: { name: 'Aman Sharma' } } },
      { id: '2', reason: 'Weekend Outing Library', departureDate: new Date().toISOString(), returnDate: new Date(Date.now() + 86400000).toISOString(), status: 'PENDING', student: { rollNumber: 'CS2026091', branch: 'Computer Science', user: { name: 'Aman Sharma' } } }
    ]);
    if (method === 'POST' && options.body) {
      try {
        const body = JSON.parse(options.body as string);
        const newItem = {
          id: String(list.length + 1),
          reason: body.reason,
          departureDate: body.departureDate,
          returnDate: body.returnDate,
          status: 'PENDING',
          student: { rollNumber: 'CS2026091', branch: 'Computer Science', user: { name: 'Aman Sharma' } }
        };
        list.unshift(newItem);
        saveDb('leaves', list);
        return { message: 'Leave request submitted successfully', leave: newItem };
      } catch (e) {}
    }
    if (method === 'PUT' && options.body) {
      try {
        const body = JSON.parse(options.body as string);
        const updated = list.map((l: any) => l.id === body.leaveId ? { ...l, status: body.status } : l);
        saveDb('leaves', updated);
        return { message: `Leave status updated to ${body.status}` };
      } catch (e) {}
    }
    return { leaves: list };
  }

  if (path.includes('/gatepass')) {
    const list = getDb('gatepass', [
      { id: '1', qrCode: 'GP-AMAN-8910', destination: 'City Center', departureDate: new Date().toISOString(), returnDate: new Date().toISOString(), status: 'APPROVED', student: { user: { name: 'Aman Sharma' } } }
    ]);
    if (method === 'POST' && options.body) {
      try {
        const body = JSON.parse(options.body as string);
        if (path.includes('/gatepass/scan')) {
          const updated = list.map((p: any) => {
            if (p.qrCode === body.qrCode) {
              return { ...p, status: body.action === 'EXIT' ? 'EXITED' : 'APPROVED' };
            }
            return p;
          });
          saveDb('gatepass', updated);
          return { message: `Student Gate Pass status updated to ${body.action === 'EXIT' ? 'EXITED' : 'RETURNED'}` };
        }

        const codeNum = Math.floor(1000 + Math.random() * 9000);
        const newItem = {
          id: String(list.length + 1),
          qrCode: `GP-AMAN-${codeNum}`,
          destination: body.destination,
          departureDate: body.departureDate,
          returnDate: body.returnDate,
          status: 'APPROVED',
          student: { user: { name: 'Aman Sharma' } }
        };
        list.unshift(newItem);
        saveDb('gatepass', list);
        return { message: 'Gate pass generated successfully', pass: newItem };
      } catch (e) {}
    }
    return { passes: list };
  }

  if (path.includes('/visitors')) {
    const list = getDb('visitors', [
      { id: '1', qrCode: 'VIS-RAKESH-3321', name: 'Rakesh Sharma', relation: 'Father', mobile: '9988776655', purpose: 'Books delivery', status: 'APPROVED', student: { user: { name: 'Aman Sharma' } } }
    ]);
    if (method === 'POST' && options.body) {
      try {
        const body = JSON.parse(options.body as string);
        if (path.includes('/visitors/scan')) {
          const updated = list.map((v: any) => {
            if (v.qrCode === body.qrCode) {
              return { ...v, status: body.action === 'IN' ? 'CHECKED_IN' : 'CHECKED_OUT' };
            }
            return v;
          });
          saveDb('visitors', updated);
          return { message: `Visitor scanner confirmed entry: ${body.action}` };
        }

        const codeNum = Math.floor(1000 + Math.random() * 9000);
        const newItem = {
          id: String(list.length + 1),
          qrCode: `VIS-NEW-${codeNum}`,
          name: body.name,
          relation: body.relation,
          mobile: body.mobile,
          purpose: body.purpose,
          idProof: 'Aadhaar Card',
          status: 'PENDING',
          student: { user: { name: 'Aman Sharma' } }
        };
        list.unshift(newItem);
        saveDb('visitors', list);
        return { message: 'Visitor registration filed successfully', visitor: newItem };
      } catch (e) {}
    }
    if (method === 'PUT' && options.body) {
      try {
        const body = JSON.parse(options.body as string);
        const updated = list.map((v: any) => v.id === body.visitorId ? { ...v, status: body.status } : v);
        saveDb('visitors', updated);
        return { message: `Visitor status updated to ${body.status}` };
      } catch (e) {}
    }
    return { visitors: list };
  }

  if (path.includes('/billing')) {
    const list = getDb('billing', [
      { id: '1', type: 'HOSTEL_FEE', amount: 45000, dueDate: new Date(Date.now() + 86400000 * 10).toISOString(), status: 'PENDING', student: { id: 'mock-stud-id', rollNumber: 'CS2026091', user: { name: 'Aman Sharma' } } },
      { id: '2', type: 'MESS_FEE', amount: 15000, dueDate: new Date().toISOString(), status: 'PAID', student: { id: 'mock-stud-id', rollNumber: 'CS2026091', user: { name: 'Aman Sharma' } } }
    ]);
    if (method === 'POST' && options.body) {
      try {
        const body = JSON.parse(options.body as string);
        if (path.includes('/fee/pay')) {
          const updated = list.map((f: any) => f.id === body.feeId ? { ...f, status: 'PAID' } : f);
          saveDb('billing', updated);
          return { message: 'Payment successfully processed! Receipt generated.' };
        }

        const newItem = {
          id: String(list.length + 1),
          type: body.type || 'HOSTEL_FEE',
          amount: Number(body.amount || 1200),
          dueDate: body.dueDate || new Date().toISOString(),
          status: 'PENDING',
          student: { id: 'mock-stud-id', rollNumber: 'CS2026091', user: { name: 'Aman Sharma' } }
        };
        list.push(newItem);
        saveDb('billing', list);
        return { message: 'Fee invoice dispatched successfully', fee: newItem };
      } catch (e) {}
    }
    return { fees: list };
  }

  if (path.includes('/complaints')) {
    const list = getDb('complaints', [
      { id: '1', category: 'ELECTRICAL', description: 'Ceiling fan is sparking when turned to speed 5.', status: 'ASSIGNED', priority: 'HIGH', student: { user: { name: 'Aman Sharma' }, bed: { room: { number: '101' } } } },
      { id: '2', category: 'INTERNET', description: 'WiFi signal is dropping repeatedly.', status: 'RESOLVED', priority: 'MEDIUM', student: { user: { name: 'Aman Sharma' }, bed: { room: { number: '101' } } } }
    ]);
    if (method === 'POST' && options.body) {
      try {
        const body = JSON.parse(options.body as string);
        const newItem = {
          id: String(list.length + 1),
          category: body.category || 'GENERAL',
          description: body.description,
          status: 'ASSIGNED',
          priority: 'MEDIUM',
          student: { user: { name: 'Aman Sharma' }, bed: { room: { number: '101' } } }
        };
        list.unshift(newItem);
        saveDb('complaints', list);
        return { message: 'Complaint registered and auto-assigned successfully', complaint: newItem };
      } catch (e) {}
    }
    if (method === 'PUT' && options.body) {
      try {
        const body = JSON.parse(options.body as string);
        const updated = list.map((c: any) => c.id === body.complaintId ? { ...c, status: body.status } : c);
        saveDb('complaints', updated);
        return { message: `Complaint status updated to ${body.status}` };
      } catch (e) {}
    }
    return { complaints: list };
  }

  if (path.includes('/infra/overview')) {
    return {
      buildings: [
        {
          id: 'b1',
          name: 'Aryabhatta Hall',
          floors: [
            {
              id: 'f1',
              number: 1,
              rooms: [
                {
                  id: 'r1',
                  number: '101',
                  beds: [
                    { id: 'bd1', number: 'A', isOccupied: true, student: { user: { name: 'Aman Sharma' } } },
                    { id: 'bd2', number: 'B', isOccupied: false, student: null }
                  ]
                }
              ]
            }
          ]
        }
      ]
    };
  }

  if (path.includes('/ai/predictions')) {
    return {
      report: {
        messDemand: { totalStudents: 120, predictedAbsentees: 15, predictedMessAttendance: 105, optOutRate: 12 },
        electricity: { avgConsumptionUnits: 180, projectedPeakUnits: 260, riskLevel: 'HIGH SPIKE RISK' },
        complaints: { currentMonthCount: 18, projectedNextMonthCount: 24, mainCategory: 'ELECTRICAL' },
        occupancy: { currentRate: 88, projectedRateNextSemester: 95 }
      }
    };
  }

  if (path.includes('/ai/assistant')) {
    return {
      response: `Smart Hostel OS Copilot (${role} Mode): I am fully simulated in localized fallback. You can query menu, billing, or leaves.`
    };
  }

  return {};
};

export const apiRequest = async (url: string, options: RequestInit = {}) => {
  const headers = { ...getHeaders(), ...options.headers };
  const config = { ...options, headers };

  const path = url.replace(/^\/api/, '');
  if (path.includes('/auth/login') && options.body) {
    try {
      const parsed = JSON.parse(options.body as any);
      if (parsed.email) {
        localStorage.setItem('lastDemoEmail', parsed.email);
      }
    } catch (e) {}
  }

  let response;
  try {
    response = await fetch(getApiUrl(url), config);
  } catch (err) {
    console.warn(`Local backend offline. Returning mock static state for: ${url}`);
    return getMockDataFallback(url);
  }

  // If token is expired, try to refresh once
  if (response.status === 401) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        const refreshRes = await fetch(getApiUrl('/api/auth/refresh'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: refreshToken }),
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          localStorage.setItem('accessToken', data.accessToken);
          
          // Retry original request with new token
          const retryHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.accessToken}`,
          };
          response = await fetch(getApiUrl(url), { ...options, headers: retryHeaders });
        } else {
          // Refresh failed, clear session
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      } catch (err) {
        console.error('Session refresh failed:', err);
      }
    }
  }

  // Handle errors
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};
