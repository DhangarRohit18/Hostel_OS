import { Response } from 'express';
import { PrismaClient, VisitorStatus } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const prisma = new PrismaClient();

export class VisitorController {
  // Register visitor (Student or Guest registration)
  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, mobile, idProof, purpose, relation } = req.body;
      if (!name || !mobile || !idProof || !purpose || !relation) {
        return res.status(400).json({ error: 'All fields are required.' });
      }

      const student = await prisma.student.findUnique({
        where: { userId: req.user?.userId },
      });
      if (!student) return res.status(404).json({ error: 'Student profile not found.' });

      const qrCode = `VIS-${name.replace(/\s+/g, '').toUpperCase()}-${Date.now()}`;

      const visitor = await prisma.visitor.create({
        data: {
          studentId: student.id,
          name,
          mobile,
          idProof,
          purpose,
          relation,
          qrCode,
          status: 'PENDING',
        },
      });

      return res.status(201).json({ message: 'Visitor registered successfully. Pending Warden approval.', visitor });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Get visitor logs
  static async list(req: AuthenticatedRequest, res: Response) {
    try {
      const { role, userId } = req.user!;
      let visitors;

      if (role === 'STUDENT') {
        const student = await prisma.student.findUnique({ where: { userId } });
        visitors = await prisma.visitor.findMany({
          where: { studentId: student?.id },
          orderBy: { createdAt: 'desc' },
        });
      } else {
        // ADMIN, WARDEN, GUARD
        visitors = await prisma.visitor.findMany({
          include: { student: { include: { user: true } } },
          orderBy: { createdAt: 'desc' },
        });
      }

      return res.json({ visitors });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Approve visitor (Warden)
  static async updateStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { visitorId, status } = req.body;
      if (!visitorId || !status) {
        return res.status(400).json({ error: 'visitorId and Status are required.' });
      }

      const updated = await prisma.visitor.update({
        where: { id: visitorId },
        data: {
          status: status as VisitorStatus,
        },
      });

      return res.json({ message: `Visitor status updated to ${status}`, visitor: updated });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Check In/Out scan (Guard)
  static async scanVisitor(req: AuthenticatedRequest, res: Response) {
    try {
      const { qrCode, action } = req.body; // action: 'IN' | 'OUT'
      if (!qrCode || !action) {
        return res.status(400).json({ error: 'qrCode and action are required.' });
      }

      const visitor = await prisma.visitor.findUnique({
        where: { qrCode },
        include: { student: { include: { user: true } } },
      });

      if (!visitor) return res.status(404).json({ error: 'Visitor pass not found.' });

      let newStatus: VisitorStatus = 'PENDING';
      let updateData: any = {};

      if (action === 'IN') {
        if (visitor.status !== 'APPROVED') {
          return res.status(400).json({ error: `Cannot check-in. Visitor status is ${visitor.status}` });
        }
        newStatus = 'CHECKED_IN';
        updateData = { status: newStatus, checkInTime: new Date() };
      } else if (action === 'OUT') {
        if (visitor.status !== 'CHECKED_IN') {
          return res.status(400).json({ error: 'Cannot check-out. Visitor is not checked in.' });
        }
        newStatus = 'CHECKED_OUT';
        updateData = { status: newStatus, checkOutTime: new Date() };
      }

      const updated = await prisma.visitor.update({
        where: { id: visitor.id },
        data: updateData,
      });

      return res.json({
        message: `Visitor ${visitor.name} successfully checked ${action.toLowerCase()}.`,
        visitor: updated,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
