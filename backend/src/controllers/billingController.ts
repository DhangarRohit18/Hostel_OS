import { Response } from 'express';
import { PrismaClient, FeeStatus } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const prisma = new PrismaClient();

export class BillingController {
  // Create Fee (Admin)
  static async createFee(req: AuthenticatedRequest, res: Response) {
    try {
      const { studentId, amount, type, dueDate } = req.body;
      if (!studentId || !amount || !type || !dueDate) {
        return res.status(400).json({ error: 'studentId, amount, type, and dueDate are required.' });
      }

      const fee = await prisma.fee.create({
        data: {
          studentId,
          amount: parseFloat(amount),
          type,
          dueDate: new Date(dueDate),
          status: 'UNPAID',
        },
      });

      return res.status(201).json({ message: 'Fee invoice created successfully', fee });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Pay Fee / Update status (Student/Parent or Admin verification)
  static async payFee(req: AuthenticatedRequest, res: Response) {
    try {
      const { feeId } = req.body;
      if (!feeId) return res.status(400).json({ error: 'feeId is required.' });

      const updated = await prisma.fee.update({
        where: { id: feeId },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          receiptUrl: `RECEIPT-${feeId.substring(0, 6).toUpperCase()}`,
        },
      });

      return res.json({ message: 'Payment recorded successfully', fee: updated });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Pay Electricity Bill / Update status
  static async payElectricityBill(req: AuthenticatedRequest, res: Response) {
    try {
      const { billId } = req.body;
      if (!billId) return res.status(400).json({ error: 'billId is required.' });

      const updated = await prisma.electricityBill.update({
        where: { id: billId },
        data: {
          status: 'PAID',
        },
      });

      return res.json({ message: 'Electricity payment recorded successfully', bill: updated });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Submit Room Meter Reading & Generate Electricity Bill (Admin)
  static async createElectricityBill(req: AuthenticatedRequest, res: Response) {
    try {
      const { roomId, month, year, readingPrev, readingCurrent, rate } = req.body;
      if (!roomId || month === undefined || year === undefined || readingPrev === undefined || readingCurrent === undefined || !rate) {
        return res.status(400).json({ error: 'All electricity details are required.' });
      }

      const consumption = readingCurrent - readingPrev;
      if (consumption < 0) {
        return res.status(400).json({ error: 'Current reading cannot be lower than previous reading.' });
      }

      const amount = consumption * rate;

      // Find student allocated to this room's beds
      const beds = await prisma.bed.findMany({
        where: { roomId, isOccupied: true },
        include: { student: true }
      });

      if (beds.length === 0) {
        return res.status(400).json({ error: 'No active student allocation in this room to bill.' });
      }

      // Normally split bill among occupants. We allocate to the first student for simplicity
      const primaryStudent = beds[0].student;
      if (!primaryStudent) {
        return res.status(400).json({ error: 'Room has no assigned student.' });
      }

      const bill = await prisma.electricityBill.create({
        data: {
          studentId: primaryStudent.id,
          roomId,
          month: Number(month),
          year: Number(year),
          readingPrev: parseFloat(readingPrev),
          readingCurrent: parseFloat(readingCurrent),
          consumption,
          rate: parseFloat(rate),
          amount,
          status: 'UNPAID',
        },
      });

      return res.status(201).json({ message: 'Electricity bill generated successfully', bill });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Get Bills (Student, parent or Admin)
  static async listBills(req: AuthenticatedRequest, res: Response) {
    try {
      const { role, userId } = req.user!;
      let fees;
      let electricityBills;

      if (role === 'STUDENT') {
        const student = await prisma.student.findUnique({ where: { userId } });
        fees = await prisma.fee.findMany({
          where: { studentId: student?.id },
          orderBy: { dueDate: 'desc' },
        });
        electricityBills = await prisma.electricityBill.findMany({
          where: { studentId: student?.id },
          include: { room: true },
          orderBy: { createdAt: 'desc' },
        });
      } else if (role === 'PARENT') {
        const parent = await prisma.parent.findUnique({
          where: { userId },
          include: { students: true }
        });
        const studentIds = parent?.students.map(s => s.id) || [];
        fees = await prisma.fee.findMany({
          where: { studentId: { in: studentIds } },
          orderBy: { dueDate: 'desc' },
        });
        electricityBills = await prisma.electricityBill.findMany({
          where: { studentId: { in: studentIds } },
          include: { room: true },
          orderBy: { createdAt: 'desc' },
        });
      } else {
        // Admin or Warden see everything
        fees = await prisma.fee.findMany({
          include: { student: { include: { user: true } } },
          orderBy: { createdAt: 'desc' },
        });
        electricityBills = await prisma.electricityBill.findMany({
          include: { student: { include: { user: true } }, room: true },
          orderBy: { createdAt: 'desc' },
        });
      }

      return res.json({ fees, electricityBills });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
