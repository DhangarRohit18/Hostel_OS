import { Response } from 'express';
import { PrismaClient, ComplaintStatus } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { AiService } from '../services/aiService';

const prisma = new PrismaClient();

export class ComplaintController {
  // Submit a complaint (Student)
  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { description, photoUrl } = req.body;
      if (!description) return res.status(400).json({ error: 'Description is required.' });

      // Find student profile
      const student = await prisma.student.findUnique({
        where: { userId: req.user?.userId },
      });
      if (!student) return res.status(404).json({ error: 'Student profile not found.' });

      // Run AI Complaint Classifier automatically
      const aiResult = AiService.classifyComplaint(description);

      // Save complaint
      const complaint = await prisma.complaint.create({
        data: {
          category: aiResult.category,
          priority: aiResult.priority,
          description,
          photoUrl,
          studentId: student.id,
          // Let's auto-assign if there is a staff member matching the department
          assignedStaffId: undefined, 
        },
      });

      // Attempt to auto-route to staff
      const matchingStaff = await prisma.staff.findFirst({
        where: { department: aiResult.category.toString() },
      });
      if (matchingStaff) {
        await prisma.complaint.update({
          where: { id: complaint.id },
          data: {
            assignedStaffId: matchingStaff.id,
            status: 'ASSIGNED',
          },
        });
        complaint.assignedStaffId = matchingStaff.id;
        complaint.status = 'ASSIGNED';
      }

      return res.status(201).json({
        message: 'Complaint submitted successfully and routed by AI.',
        complaint,
        aiClassification: aiResult,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Get all complaints (Admin/Warden see all, Student sees theirs, Staff sees assigned)
  static async list(req: AuthenticatedRequest, res: Response) {
    try {
      const { role, userId } = req.user!;
      let complaints;

      if (role === 'STUDENT') {
        const student = await prisma.student.findUnique({ where: { userId } });
        complaints = await prisma.complaint.findMany({
          where: { studentId: student?.id },
          include: { assignedStaff: { include: { user: true } } },
          orderBy: { createdAt: 'desc' },
        });
      } else if (role === 'STAFF') {
        const staff = await prisma.staff.findUnique({ where: { userId } });
        complaints = await prisma.complaint.findMany({
          where: { assignedStaffId: staff?.id },
          include: { student: { include: { user: true } } },
          orderBy: { createdAt: 'desc' },
        });
      } else {
        // ADMIN or WARDEN
        complaints = await prisma.complaint.findMany({
          include: {
            student: { include: { user: true } },
            assignedStaff: { include: { user: true } },
          },
          orderBy: { createdAt: 'desc' },
        });
      }

      return res.json({ complaints });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Assign staff (Warden / Admin)
  static async assignStaff(req: AuthenticatedRequest, res: Response) {
    try {
      const { complaintId, staffId } = req.body;
      if (!complaintId || !staffId) {
        return res.status(400).json({ error: 'ComplaintId and StaffId are required.' });
      }

      const updated = await prisma.complaint.update({
        where: { id: complaintId },
        data: {
          assignedStaffId: staffId,
          status: 'ASSIGNED',
        },
      });

      return res.json({ message: 'Complaint assigned to staff', complaint: updated });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Update complaint status (Staff, Warden, Admin)
  static async updateStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { complaintId, status, maintenanceReport } = req.body;
      if (!complaintId || !status) {
        return res.status(400).json({ error: 'ComplaintId and Status are required.' });
      }

      const updated = await prisma.complaint.update({
        where: { id: complaintId },
        data: {
          status: status as ComplaintStatus,
          maintenanceReport: maintenanceReport || undefined,
        },
      });

      return res.json({ message: 'Status updated successfully', complaint: updated });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
