import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const prisma = new PrismaClient();

export class InfrastructureController {
  // Get overview of infrastructure and occupancy
  static async getOverview(req: AuthenticatedRequest, res: Response) {
    try {
      const buildings = await prisma.building.findMany({
        include: {
          floors: {
            include: {
              rooms: {
                include: {
                  beds: {
                    include: {
                      student: {
                        include: {
                          user: {
                            select: { name: true, email: true }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });
      return res.json({ buildings });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Create Building
  static async createBuilding(req: AuthenticatedRequest, res: Response) {
    try {
      const { name } = req.body;
      if (!name) return res.status(400).json({ error: 'Building name is required.' });

      const building = await prisma.building.create({
        data: { name },
      });
      return res.status(201).json({ message: 'Building created successfully', building });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Create Floor
  static async createFloor(req: AuthenticatedRequest, res: Response) {
    try {
      const { number, buildingId } = req.body;
      if (number === undefined || !buildingId) {
        return res.status(400).json({ error: 'Floor number and buildingId are required.' });
      }

      const floor = await prisma.floor.create({
        data: {
          number: Number(number),
          buildingId,
        },
      });
      return res.status(201).json({ message: 'Floor created successfully', floor });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Create Room
  static async createRoom(req: AuthenticatedRequest, res: Response) {
    try {
      const { number, type, floorId, bedNumbers } = req.body;
      if (!number || !type || !floorId) {
        return res.status(400).json({ error: 'Room number, type, and floorId are required.' });
      }

      const room = await prisma.room.create({
        data: {
          number,
          type,
          floorId,
        },
      });

      // Optionally auto-create beds
      const beds = [];
      const count = bedNumbers || (type === 'SINGLE' ? 1 : type === 'DOUBLE' ? 2 : 3);
      for (let i = 0; i < count; i++) {
        const bedChar = String.fromCharCode(65 + i); // A, B, C...
        const bed = await prisma.bed.create({
          data: {
            number: bedChar,
            roomId: room.id,
            isOccupied: false,
          },
        });
        beds.push(bed);
      }

      return res.status(201).json({ message: 'Room and beds created successfully', room, beds });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Allocate Bed Manual
  static async allocateBedManual(req: AuthenticatedRequest, res: Response) {
    try {
      const { studentId, bedId } = req.body;
      if (!studentId || !bedId) {
        return res.status(400).json({ error: 'StudentId and BedId are required.' });
      }

      // Check if bed is already occupied
      const bed = await prisma.bed.findUnique({ where: { id: bedId } });
      if (!bed) return res.status(404).json({ error: 'Bed not found.' });
      if (bed.isOccupied) return res.status(400).json({ error: 'Bed is already occupied.' });

      // Check if student has previous bed and free it
      const student = await prisma.student.findUnique({ where: { id: studentId } });
      if (!student) return res.status(404).json({ error: 'Student not found.' });

      if (student.bedId) {
        await prisma.bed.update({
          where: { id: student.bedId },
          data: { isOccupied: false },
        });
      }

      // Assign student to new bed
      const updatedStudent = await prisma.student.update({
        where: { id: studentId },
        data: { bedId },
      });

      await prisma.bed.update({
        where: { id: bedId },
        data: { isOccupied: true },
      });

      return res.json({ message: 'Bed allocated successfully', student: updatedStudent });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Auto Allocate Engine
  static async autoAllocate(req: AuthenticatedRequest, res: Response) {
    try {
      const { studentId } = req.body;
      if (!studentId) return res.status(400).json({ error: 'StudentId is required.' });

      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { user: true }
      });
      if (!student) return res.status(404).json({ error: 'Student not found.' });

      // Automated matching system:
      // 1. Filter rooms where we have vacant beds.
      // 2. Prioritize matching rooms where there are existing students of the same gender, and ideally same Branch/Year.
      // 3. Fallback to any vacant bed.
      const vacantBeds = await prisma.bed.findMany({
        where: { isOccupied: false },
        include: {
          room: {
            include: {
              floor: { include: { building: true } },
              beds: { include: { student: true } }
            }
          }
        }
      });

      if (vacantBeds.length === 0) {
        return res.status(400).json({ error: 'No vacant beds available in the entire hostel.' });
      }

      // Filtering/sorting algorithm
      let targetBed = vacantBeds[0];
      let bestScore = -1;

      for (const bed of vacantBeds) {
        let score = 0;
        const roomBeds = bed.room.beds;
        const roommates = roomBeds.filter(b => b.student !== null).map(b => b.student!);

        // Basic gender segregation: check roommates gender
        const genderConflict = roommates.some(r => r.gender !== student.gender);
        if (genderConflict) continue; // Keep genders separated by room

        score += 10; // Basic compatibility

        // Match branch & year
        const sameBranch = roommates.some(r => r.branch === student.branch);
        if (sameBranch) score += 5;

        const sameYear = roommates.some(r => r.year === student.year);
        if (sameYear) score += 3;

        if (score > bestScore) {
          bestScore = score;
          targetBed = bed;
        }
      }

      // Allocate
      if (student.bedId) {
        await prisma.bed.update({
          where: { id: student.bedId },
          data: { isOccupied: false },
        });
      }

      await prisma.student.update({
        where: { id: studentId },
        data: { bedId: targetBed.id },
      });

      await prisma.bed.update({
        where: { id: targetBed.id },
        data: { isOccupied: true },
      });

      return res.json({
        message: 'Auto allocation completed',
        roomNumber: targetBed.room.number,
        bedNumber: targetBed.number,
        buildingName: targetBed.room.floor.building.name,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
