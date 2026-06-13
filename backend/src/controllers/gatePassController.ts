import { Response } from 'express';
import { PrismaClient, GatePassStatus } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const prisma = new PrismaClient();

export class GatePassController {
  // Generate Gate Pass (Student)
  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { destination, exitTime, returnTime } = req.body;
      if (!destination || !exitTime || !returnTime) {
        return res.status(400).json({ error: 'Destination, ExitTime, and ReturnTime are required.' });
      }

      const student = await prisma.student.findUnique({
        where: { userId: req.user?.userId },
      });
      if (!student) return res.status(404).json({ error: 'Student profile not found.' });

      // Generate secure unique token for QR
      const qrCode = `GP-${student.rollNumber}-${Date.now()}`;

      const gatePass = await prisma.gatePass.create({
        data: {
          studentId: student.id,
          destination,
          exitTime: new Date(exitTime),
          returnTime: new Date(returnTime),
          qrCode,
          status: 'APPROVED', // Autopassed or Warden approved depending on system setup. For simplicity, auto-approved.
        },
      });

      return res.status(201).json({ message: 'Gate Pass created successfully', gatePass });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Get active/past gate passes
  static async list(req: AuthenticatedRequest, res: Response) {
    try {
      const { role, userId } = req.user!;
      let passes;

      if (role === 'STUDENT') {
        const student = await prisma.student.findUnique({ where: { userId } });
        passes = await prisma.gatePass.findMany({
          where: { studentId: student?.id },
          orderBy: { createdAt: 'desc' },
        });
      } else if (role === 'GUARD' || role === 'ADMIN' || role === 'WARDEN') {
        passes = await prisma.gatePass.findMany({
          include: { student: { include: { user: true } } },
          orderBy: { createdAt: 'desc' },
        });
      } else {
        return res.status(403).json({ error: 'Unauthorized role access.' });
      }

      return res.json({ passes });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Scan & Verify Exit/Entry (Security Guard)
  static async scanPass(req: AuthenticatedRequest, res: Response) {
    try {
      const { qrCode, action } = req.body; // action: 'EXIT' | 'RETURN'
      if (!qrCode || !action) {
        return res.status(400).json({ error: 'qrCode and action (EXIT/RETURN) are required.' });
      }

      const pass = await prisma.gatePass.findUnique({
        where: { qrCode },
        include: { student: { include: { user: true } } },
      });

      if (!pass) return res.status(404).json({ error: 'Gate pass ticket not found.' });

      let newStatus: GatePassStatus = 'APPROVED';

      if (action === 'EXIT') {
        if (pass.status !== 'APPROVED') {
          return res.status(400).json({ error: `Cannot process exit. Pass current status is ${pass.status}` });
        }
        newStatus = 'EXITED';
      } else if (action === 'RETURN') {
        if (pass.status !== 'EXITED') {
          return res.status(400).json({ error: `Cannot process return. Student has not checked out yet.` });
        }
        newStatus = 'RETURNED';
      }

      const updated = await prisma.gatePass.update({
        where: { id: pass.id },
        data: {
          status: newStatus,
          scannedById: req.user?.userId,
        },
      });

      return res.json({
        message: `Student ${pass.student.user.name} checked ${action.toLowerCase()} successfully.`,
        pass: updated,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
