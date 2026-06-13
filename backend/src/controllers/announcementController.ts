import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const prisma = new PrismaClient();

export class AnnouncementController {
  // Create Notice / Broadcast (Warden / Admin)
  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { title, content, targetRole, buildingId } = req.body;
      if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required.' });
      }

      const announcement = await prisma.announcement.create({
        data: {
          title,
          content,
          targetRole: targetRole || 'ALL',
          buildingId: buildingId || undefined,
          createdById: req.user?.userId || '',
        },
      });

      return res.status(201).json({ message: 'Announcement broadcasted successfully', announcement });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Get active announcements
  static async list(req: AuthenticatedRequest, res: Response) {
    try {
      const { role, userId } = req.user!;
      
      let buildingId: string | undefined = undefined;

      // If Student, retrieve their buildingId to filter targeted announcements
      if (role === 'STUDENT') {
        const student = await prisma.student.findUnique({
          where: { userId },
          include: { bed: { include: { room: { include: { floor: true } } } } }
        });
        if (student?.bed) {
          buildingId = student.bed.room.floor.buildingId;
        }
      }

      const announcements = await prisma.announcement.findMany({
        where: {
          OR: [
            { targetRole: 'ALL' },
            { targetRole: role },
            buildingId ? { buildingId } : {},
          ]
        },
        include: {
          creator: { select: { name: true, role: true } },
          building: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.json({ announcements });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
