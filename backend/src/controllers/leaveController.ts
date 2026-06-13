import { Response } from 'express';
import { PrismaClient, LeaveStatus } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const prisma = new PrismaClient();

export class LeaveController {
  // Apply for leave (Student)
  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { departureDate, returnDate, reason, parentConfirmed } = req.body;
      if (!departureDate || !returnDate || !reason) {
        return res.status(400).json({ error: 'DepartureDate, ReturnDate, and Reason are required.' });
      }

      const student = await prisma.student.findUnique({
        where: { userId: req.user?.userId },
      });
      if (!student) return res.status(404).json({ error: 'Student profile not found.' });

      const leave = await prisma.leaveRequest.create({
        data: {
          studentId: student.id,
          departureDate: new Date(departureDate),
          returnDate: new Date(returnDate),
          reason,
          parentConfirmed: !!parentConfirmed,
          status: 'PENDING',
        },
      });

      return res.status(201).json({ message: 'Leave request submitted successfully.', leave });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Get leaves list (Student sees theirs, Parent sees student's, Warden/Admin see all)
  static async list(req: AuthenticatedRequest, res: Response) {
    try {
      const { role, userId } = req.user!;
      let leaves;

      if (role === 'STUDENT') {
        const student = await prisma.student.findUnique({ where: { userId } });
        leaves = await prisma.leaveRequest.findMany({
          where: { studentId: student?.id },
          orderBy: { createdAt: 'desc' },
        });
      } else if (role === 'PARENT') {
        const parent = await prisma.parent.findUnique({
          where: { userId },
          include: { students: true }
        });
        const studentIds = parent?.students.map(s => s.id) || [];
        leaves = await prisma.leaveRequest.findMany({
          where: { studentId: { in: studentIds } },
          include: { student: { include: { user: true } } },
          orderBy: { createdAt: 'desc' },
        });
      } else {
        // WARDEN or ADMIN
        leaves = await prisma.leaveRequest.findMany({
          include: { student: { include: { user: true } } },
          orderBy: { createdAt: 'desc' },
        });
      }

      return res.json({ leaves });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Approve or Reject leave (Warden)
  static async updateStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { leaveId, status } = req.body;
      if (!leaveId || !status) {
        return res.status(400).json({ error: 'LeaveId and Status are required.' });
      }

      const updated = await prisma.leaveRequest.update({
        where: { id: leaveId },
        data: {
          status: status as LeaveStatus,
          approvedById: req.user?.userId,
        },
      });

      return res.json({ message: `Leave application ${status.toLowerCase()} successfully`, leave: updated });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
