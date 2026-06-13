import { PrismaClient, ComplaintCategory, ComplaintPriority } from '@prisma/client';

const prisma = new PrismaClient();

export interface ClassifyResult {
  category: ComplaintCategory;
  priority: ComplaintPriority;
  suggestedDepartment: string;
}

export class AiService {
  /**
   * AI Complaint Classifier based on heuristic keyword matching
   */
  static classifyComplaint(description: string): ClassifyResult {
    const desc = description.toLowerCase();

    // Electrical keywords
    if (
      desc.includes('fan') ||
      desc.includes('spark') ||
      desc.includes('wire') ||
      desc.includes('bulb') ||
      desc.includes('plug') ||
      desc.includes('switch') ||
      desc.includes('power') ||
      desc.includes('electricity') ||
      desc.includes('light') ||
      desc.includes('socket')
    ) {
      const priority = desc.includes('spark') || desc.includes('short circuit') || desc.includes('fire')
        ? ComplaintPriority.EMERGENCY
        : ComplaintPriority.HIGH;
      return {
        category: ComplaintCategory.ELECTRICAL,
        priority,
        suggestedDepartment: 'Electrical Maintenance Division (EMD)',
      };
    }

    // Plumbing keywords
    if (
      desc.includes('leak') ||
      desc.includes('pipe') ||
      desc.includes('tap') ||
      desc.includes('water') ||
      desc.includes('drain') ||
      desc.includes('clog') ||
      desc.includes('toilet') ||
      desc.includes('flush') ||
      desc.includes('basin') ||
      desc.includes('shower')
    ) {
      const priority = desc.includes('flood') || desc.includes('burst')
        ? ComplaintPriority.HIGH
        : ComplaintPriority.MEDIUM;
      return {
        category: ComplaintCategory.PLUMBING,
        priority,
        suggestedDepartment: 'Plumbing and Sanitation Department',
      };
    }

    // Internet keywords
    if (
      desc.includes('wifi') ||
      desc.includes('wi-fi') ||
      desc.includes('internet') ||
      desc.includes('lan') ||
      desc.includes('connection') ||
      desc.includes('disconnect') ||
      desc.includes('slow') ||
      desc.includes('network') ||
      desc.includes('router')
    ) {
      return {
        category: ComplaintCategory.INTERNET,
        priority: ComplaintPriority.MEDIUM,
        suggestedDepartment: 'Campus IT Helpdesk & Infrastructure',
      };
    }

    // Security keywords
    if (
      desc.includes('theft') ||
      desc.includes('stolen') ||
      desc.includes('gate') ||
      desc.includes('intruder') ||
      desc.includes('fight') ||
      desc.includes('stranger') ||
      desc.includes('security') ||
      desc.includes('camera') ||
      desc.includes('lock')
    ) {
      return {
        category: ComplaintCategory.SECURITY,
        priority: ComplaintPriority.EMERGENCY,
        suggestedDepartment: 'Hostel Security & Vigilance Cell',
      };
    }

    // Cleanliness keywords
    if (
      desc.includes('dust') ||
      desc.includes('clean') ||
      desc.includes('garbage') ||
      desc.includes('trash') ||
      desc.includes('smell') ||
      desc.includes('sweeper') ||
      desc.includes('dirt') ||
      desc.includes('housekeeping')
    ) {
      return {
        category: ComplaintCategory.CLEANLINESS,
        priority: ComplaintPriority.LOW,
        suggestedDepartment: 'Hostel Housekeeping Services',
      };
    }

    // Furniture keywords
    if (
      desc.includes('bed') ||
      desc.includes('chair') ||
      desc.includes('table') ||
      desc.includes('desk') ||
      desc.includes('wardrobe') ||
      desc.includes('cupboard') ||
      desc.includes('almirah') ||
      desc.includes('wood') ||
      desc.includes('door') ||
      desc.includes('window') ||
      desc.includes('hinge')
    ) {
      return {
        category: ComplaintCategory.FURNITURE,
        priority: ComplaintPriority.LOW,
        suggestedDepartment: 'Carpentry & Estate Office',
      };
    }

    // Fallback default
    return {
      category: ComplaintCategory.CLEANLINESS,
      priority: ComplaintPriority.LOW,
      suggestedDepartment: 'General Maintenance Support',
    };
  }

  /**
   * AI Hostel Assistant chatbot
   */
  static async handleChat(userId: string, role: string, message: string): Promise<string> {
    const text = message.toLowerCase();

    // Context retrieval based on role
    if (role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId },
        include: {
          bed: { include: { room: { include: { floor: { include: { building: true } } } } } },
          fees: true,
          complaints: true,
          leaveRequests: true,
        },
      });

      if (!student) {
        return "I couldn't locate your student profile in the database. Please verify with the administrator.";
      }

      if (text.includes('fee') || text.includes('due') || text.includes('bill') || text.includes('payment')) {
        const unpaidFees = student.fees.filter(f => f.status !== 'PAID');
        if (unpaidFees.length === 0) {
          return `Hi ${student.user?.name || 'there'}! You have no outstanding fee dues. All fee payments are up to date. Keep it up!`;
        }
        const details = unpaidFees.map(f => `- **${f.type}**: ₹${f.amount} (Due: ${new Date(f.dueDate).toLocaleDateString()})`).join('\n');
        return `Here are your pending fee dues:\n${details}\n\nYou can complete the payments directly from the Fee Section on your dashboard.`;
      }

      if (text.includes('complaint') || text.includes('repair') || text.includes('ticket')) {
        if (student.complaints.length === 0) {
          return "You haven't filed any complaints yet. If you have any issues (electrical, plumbing, etc.), you can easily file one in the 'Complaints' tab.";
        }
        const activeComplaints = student.complaints.slice(0, 3);
        const details = activeComplaints.map(c => `- **${c.category}**: ${c.description.substring(0, 50)}... Status: **${c.status}** (Priority: ${c.priority})`).join('\n');
        return `Here is the status of your recent complaints:\n${details}\n\nYou can check the full resolution logs on your dashboard.`;
      }

      if (text.includes('leave') || text.includes('outing') || text.includes('gate pass')) {
        const activeLeaves = student.leaveRequests.slice(0, 2);
        if (activeLeaves.length === 0) {
          return "You do not have any active or pending leave requests. To apply for home visit leaves, navigate to the Leave Management page.";
        }
        const details = activeLeaves.map(l => `- Outing: ${new Date(l.departureDate).toLocaleDateString()} to ${new Date(l.returnDate).toLocaleDateString()} -> Status: **${l.status}**`).join('\n');
        return `Here is the status of your recent leave applications:\n${details}`;
      }

      if (text.includes('room') || text.includes('bed') || text.includes('hostel') || text.includes('where')) {
        if (student.bed) {
          const b = student.bed;
          return `You are allocated to **Room ${b.room.number}**, **Bed ${b.number}** in **${b.room.floor.building.name}** (Floor ${b.room.floor.number}).`;
        }
        return "You have not been allocated a bed yet. Please submit a room transfer or request the Warden for allocation.";
      }

      if (text.includes('menu') || text.includes('food') || text.includes('mess') || text.includes('eat')) {
        return "Today's Mess Menu:\n- **Breakfast**: Masala Dosa, Sambhar, Fruits, Tea/Coffee\n- **Lunch**: Paneer Butter Masala, Dal Makhani, Jeera Rice, Tandoori Roti, Salad\n- **Snacks**: Samosa, Green Chutney, Tea\n- **Dinner**: Mix Veg, Kadhai Paneer, Chapati, Kheer\n\nYou can share your feedback or opt-out of meals in the Mess Management page.";
      }

      return `Hello! I am your AI Hostel Assistant. You can ask me about:\n- Your room allocation ("where is my room?")\n- Pending fees ("show my dues")\n- Complaint tracking ("track my complaints")\n- Leave status ("show leave status")\n- Mess menu ("what is today's menu?")`;
    }

    if (role === 'WARDEN' || role === 'ADMIN') {
      if (text.includes('room') || text.includes('occupancy') || text.includes('vacant')) {
        const totalBeds = await prisma.bed.count();
        const occupiedBeds = await prisma.bed.count({ where: { isOccupied: true } });
        const vacantBeds = totalBeds - occupiedBeds;
        return `Hostel Occupancy Report:\n- **Total Beds**: ${totalBeds}\n- **Occupied**: ${occupiedBeds} (${Math.round((occupiedBeds / totalBeds) * 100)}%)\n- **Vacant Beds**: ${vacantBeds}`;
      }
      if (text.includes('predict') || text.includes('report') || text.includes('forecast')) {
        const pred = await this.getPredictions();
        return `📊 **AI Hostel Predictive Insights Report**\n\n` +
               `- 🍽️ **Mess Demand**: Projections suggest **${pred.messDemand.predictedMessAttendance} plates** required today (with ~${pred.messDemand.predictedAbsentees} student absentees on approved leaves).\n` +
               `- ⚡ **Electricity Spike**: Projected summer usage is **${pred.electricity.projectedPeakUnits} units** per room (Status: *${pred.electricity.riskLevel}*).\n` +
               `- 🛠️ **Complaints**: Projected count is **${pred.complaints.projectedNextMonthCount} tickets** next month (Primary source: *${pred.complaints.mainCategory}*).\n` +
               `- 🏢 **Occupancy Rate**: Current rate is **${pred.occupancy.currentRate}%**, projected to reach **${pred.occupancy.projectedRateNextSemester}%** next semester.`;
      }
      if (text.includes('leave') || text.includes('approve') || text.includes('pending')) {
        const pendingLeaves = await prisma.leaveRequest.count({ where: { status: 'PENDING' } });
        return `You have **${pendingLeaves} pending leave requests** awaiting review in the system.`;
      }
      if (text.includes('complaint') || text.includes('ticket')) {
        const openComplaints = await prisma.complaint.count({ where: { status: 'OPEN' } });
        return `There are currently **${openComplaints} unassigned complaints** registered in the database.`;
      }
      return `Welcome, Administrator! I can assist you with:\n- Occupancy analytics ("show occupancy")\n- AI predictions forecast ("generate predictive report")\n- Pending leaves count ("show leave status")\n- Active maintenance complaints ("show open tickets")`;
    }

    if (role === 'PARENT') {
      const parent = await prisma.parent.findUnique({
        where: { userId },
        include: {
          students: {
            include: {
              bed: { include: { room: { include: { floor: { include: { building: true } } } } } },
              fees: true,
              leaveRequests: true,
            }
          }
        }
      });

      if (!parent || parent.students.length === 0) {
        return "I couldn't locate any linked student accounts under your parent profile. Please contact the warden.";
      }

      const linkedStudent = parent.students[0];

      if (text.includes('fee') || text.includes('due') || text.includes('bill')) {
        const unpaid = linkedStudent.fees.filter(f => f.status !== 'PAID');
        if (unpaid.length === 0) return `All fees for your child, ${linkedStudent.user?.name || 'Aman'}, are fully paid.`;
        return `Your child has pending fee dues of ₹${unpaid.reduce((acc, f) => acc + f.amount, 0)}. You can review individual invoices in the Billing section.`;
      }

      if (text.includes('leave') || text.includes('outing')) {
        const pending = linkedStudent.leaveRequests.filter(l => l.status === 'PENDING');
        return `Your child has **${pending.length} pending leave requests** awaiting warden review.`;
      }

      if (text.includes('room') || text.includes('where') || text.includes('live')) {
        if (linkedStudent.bed) {
          const b = linkedStudent.bed;
          return `Your child is staying in **Room ${b.room.number}** (Bed ${b.number}) at **${b.room.floor.building.name}**.`;
        }
        return "Your child has not been allocated a room in the hostel yet.";
      }

      return `Parent Assistant. You can ask me:\n- "Is my child's fee paid?"\n- "Where is my child's room?"\n- "Has my child applied for leave?"`;
    }

    if (role === 'GUARD') {
      if (text.includes('outing') || text.includes('leave') || text.includes('gate pass')) {
        const approvedPasses = await prisma.gatePass.count({ where: { status: 'APPROVED' } });
        return `There are currently **${approvedPasses} approved gate passes** awaiting scan verification at the checkpoint.`;
      }
      if (text.includes('visitor')) {
        const checkedIn = await prisma.visitor.count({ where: { status: 'CHECKED_IN' } });
        return `There are currently **${checkedIn} visitors checked-in** inside the buildings.`;
      }
      return `Security Guard Assistant. Ask me:\n- "How many active gate passes are ready?"\n- "How many visitors are checked-in?"`;
    }

    if (role === 'STAFF') {
      const staff = await prisma.staff.findUnique({ where: { userId } });
      if (staff) {
        const assignedTickets = await prisma.complaint.count({
          where: { assignedStaffId: staff.id, status: { in: ['ASSIGNED', 'IN_PROGRESS'] } }
        });
        return `You have **${assignedTickets} open repair jobs** assigned to your ticket board. Please inspect and resolve them.`;
      }
      return "Staff profile not resolved. Please update your registration.";
    }

    return "Hello! I am the Smart Hostel OS Assistant. How can I help you manage the hostel system today?";
  }

  /**
   * AI Predictive Analytics
   */
  static async getPredictions() {
    // 1. Mess Demand Prediction
    // Query active leaves for today and tomorrow
    const today = new Date();
    const activeLeaves = await prisma.leaveRequest.count({
      where: {
        status: 'APPROVED',
        departureDate: { lte: today },
        returnDate: { gte: today },
      },
    });

    const totalStudents = await prisma.student.count();
    const predictedAbsentees = Math.max(activeLeaves, Math.round(totalStudents * 0.08)); // fallback standard 8% average
    const predictedMessAttendance = Math.max(0, totalStudents - predictedAbsentees);

    // 2. Complaint Trends Prediction (simple linear regression projection)
    const complaintsThisMonth = await prisma.complaint.count({
      where: {
        createdAt: { gte: new Date(today.getFullYear(), today.getMonth(), 1) },
      },
    });
    const projectedComplaints = Math.round(complaintsThisMonth * 1.35 + 2);

    // 3. Electricity Spike Prediction (based on current bills)
    const activeBills = await prisma.electricityBill.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    const totalConsumption = activeBills.reduce((acc, b) => acc + b.consumption, 0);
    const avgConsumption = activeBills.length > 0 ? totalConsumption / activeBills.length : 150;
    // project a summer spike if month is June/July
    const currentMonth = today.getMonth() + 1;
    const peakMultiplier = (currentMonth >= 5 && currentMonth <= 8) ? 1.45 : 1.05;
    const predictedElectricityUnits = Math.round(avgConsumption * peakMultiplier);

    // 4. Occupancy Prediction
    const totalBeds = await prisma.bed.count();
    const occupiedBeds = await prisma.bed.count({ where: { isOccupied: true } });
    const occupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 85;

    return {
      messDemand: {
        totalStudents,
        predictedAbsentees,
        predictedMessAttendance,
        optOutRate: Math.round((predictedAbsentees / (totalStudents || 1)) * 100),
      },
      complaints: {
        currentMonthCount: complaintsThisMonth,
        projectedNextMonthCount: projectedComplaints,
        mainCategory: 'ELECTRICAL',
      },
      electricity: {
        avgConsumptionUnits: Math.round(avgConsumption),
        projectedPeakUnits: predictedElectricityUnits,
        riskLevel: predictedElectricityUnits > 250 ? 'HIGH SPIKE RISK' : 'STABLE',
      },
      occupancy: {
        currentRate: Math.round(occupancyRate),
        projectedRateNextSemester: Math.min(100, Math.round(occupancyRate * 1.08)),
      },
    };
  }
}
