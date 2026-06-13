import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { NotificationService } from '../services/notificationService';

const prisma = new PrismaClient();

export class SosController {
  // Trigger SOS (Student)
  static async trigger(req: AuthenticatedRequest, res: Response) {
    try {
      const student = await prisma.student.findUnique({
        where: { userId: req.user?.userId },
        include: {
          user: true,
          bed: {
            include: {
              room: {
                include: {
                  floor: {
                    include: {
                      building: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!student) return res.status(404).json({ error: 'Student profile not found.' });

      // Create SOS Alert entry
      const sos = await prisma.emergencySos.create({
        data: {
          studentId: student.id,
          status: 'ACTIVE',
        },
      });

      // Fetch location details
      const roomNum = student.bed?.room.number || 'UNKNOWN';
      const buildingName = student.bed?.room.floor.building.name || 'UNKNOWN';

      // Dispatches emergency alerts instantly using the notification service
      await NotificationService.triggerSosAlert(student.user.name, roomNum, buildingName);

      return res.status(201).json({
        message: '🚨 Emergency SOS alert triggered successfully. Wardens and Guards have been alerted!',
        sos,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Resolve SOS (Warden, Guard, Admin)
  static async resolve(req: AuthenticatedRequest, res: Response) {
    try {
      const { sosId } = req.body;
      if (!sosId) return res.status(400).json({ error: 'sosId is required.' });

      const updated = await prisma.emergencySos.update({
        where: { id: sosId },
        data: {
          status: 'RESOLVED',
          resolvedById: req.user?.userId,
          resolvedAt: new Date(),
        },
      });

      return res.json({ message: 'Emergency SOS alert resolved successfully', sos: updated });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // List SOS events (Admin, Warden, Guard)
  static async list(req: AuthenticatedRequest, res: Response) {
    try {
      const list = await prisma.emergencySos.findMany({
        include: {
          student: {
            include: {
              user: { select: { name: true, phone: true } },
              bed: {
                include: {
                  room: {
                    include: {
                      floor: { include: { building: true } }
                    }
                  }
                }
              }
            }
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return res.json({ alerts: list });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
