import { Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/auth';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const prisma = new PrismaClient();

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { email, password, name, role, phone, rollNumber, branch, year, gender, parentEmail, specialRequirements, preferences, department } = req.body;

      if (!email || !password || !name || !role) {
        return res.status(400).json({ error: 'Email, password, name and role are required.' });
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: role as Role,
          phone,
        },
      });

      // Role specific sub-profile creation
      if (role === 'STUDENT') {
        if (!rollNumber || !branch || !year || !gender) {
          return res.status(400).json({ error: 'Student registration requires rollNumber, branch, year and gender.' });
        }
        
        let parentId: string | undefined = undefined;
        if (parentEmail) {
          const parentUser = await prisma.user.findFirst({
            where: { email: parentEmail, role: 'PARENT' },
            include: { parentProfile: true }
          });
          if (parentUser && parentUser.parentProfile) {
            parentId = parentUser.parentProfile.id;
          }
        }

        await prisma.student.create({
          data: {
            userId: user.id,
            rollNumber,
            branch,
            year: Number(year),
            gender,
            specialRequirements,
            preferences,
            parentId,
          },
        });
      } else if (role === 'PARENT') {
        await prisma.parent.create({
          data: { userId: user.id },
        });
      } else if (role === 'WARDEN') {
        await prisma.warden.create({
          data: { userId: user.id },
        });
      } else if (role === 'STAFF') {
        if (!department) {
          return res.status(400).json({ error: 'Staff registration requires department field.' });
        }
        await prisma.staff.create({
          data: {
            userId: user.id,
            department,
          },
        });
      } else if (role === 'GUARD') {
        await prisma.guard.create({
          data: { userId: user.id },
        });
      }

      return res.status(201).json({ message: 'User registered successfully!', userId: user.id });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: err.message || 'Registration failed.' });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const payload = {
        userId: user.id,
        role: user.role,
        email: user.email,
        name: user.name,
      };

      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken({ userId: user.id });

      // Record login audit log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN',
        },
      });

      return res.json({
        message: 'Login successful',
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Login failed.' });
    }
  }

  static async me(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(410).json({ error: 'Unauthorized.' });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          avatar: true,
          studentProfile: {
            include: {
              bed: {
                include: {
                  room: {
                    include: {
                      floor: {
                        include: {
                          building: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          parentProfile: {
            include: {
              students: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      phone: true,
                    },
                  },
                  bed: {
                    include: {
                      room: {
                        include: {
                          floor: {
                            include: {
                              building: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          wardenProfile: {
            include: {
              building: true,
            },
          },
          staffProfile: true,
          guardProfile: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'User profile not found.' });
      }

      return res.json({ user });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Profile fetch failed.' });
    }
  }

  static async refreshToken(req: Request, res: Response) {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Refresh token is required.' });
    }

    try {
      const decoded = verifyRefreshToken(token);
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (!user) {
        return res.status(404).json({ error: 'User does not exist.' });
      }

      const payload = {
        userId: user.id,
        role: user.role,
        email: user.email,
        name: user.name,
      };

      const accessToken = generateAccessToken(payload);
      return res.json({ accessToken });
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired refresh token.' });
    }
  }
}
