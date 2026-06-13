import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clear existing data in reverse dependency order
  await prisma.auditLog.deleteMany({});
  await prisma.emergencySos.deleteMany({});
  await prisma.announcement.deleteMany({});
  await prisma.electricityBill.deleteMany({});
  await prisma.fee.deleteMany({});
  await prisma.visitor.deleteMany({});
  await prisma.gatePass.deleteMany({});
  await prisma.leaveRequest.deleteMany({});
  await prisma.complaint.deleteMany({});
  await prisma.bed.deleteMany({});
  await prisma.room.deleteMany({});
  await prisma.floor.deleteMany({});
  await prisma.warden.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.parent.deleteMany({});
  await prisma.staff.deleteMany({});
  await prisma.guard.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.building.deleteMany({});

  const hashedDefaultPassword = await bcrypt.hash('password123', 10);

  // 1. Create Buildings
  const b1 = await prisma.building.create({
    data: { name: 'Aryabhatta Hall' },
  });
  const b2 = await prisma.building.create({
    data: { name: 'Kalpana Chawla Hall' },
  });

  // 2. Create Floors, Rooms, and Beds
  const floors = [1, 2];
  const bedsList: any[] = [];

  for (const floorNum of floors) {
    const floor = await prisma.floor.create({
      data: {
        number: floorNum,
        buildingId: b1.id,
      },
    });

    // Create 2 rooms per floor
    for (const roomNum of ['01', '02']) {
      const room = await prisma.room.create({
        data: {
          number: `${floorNum}${roomNum}`,
          type: 'DOUBLE',
          floorId: floor.id,
        },
      });

      // Create 2 beds per room
      for (const bedNum of ['A', 'B']) {
        const bed = await prisma.bed.create({
          data: {
            number: bedNum,
            roomId: room.id,
            isOccupied: false,
          },
        });
        bedsList.push(bed);
      }
    }
  }

  // 3. Create Users & Profiles
  // Admin
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@hostel.com',
      password: hashedDefaultPassword,
      name: 'Dr. Rajesh Kumar',
      role: 'ADMIN',
      phone: '+919876543210',
    },
  });

  // Warden
  const wardenUser = await prisma.user.create({
    data: {
      email: 'warden@hostel.com',
      password: hashedDefaultPassword,
      name: 'Prof. S. N. Singh',
      role: 'WARDEN',
      phone: '+919876543211',
    },
  });
  await prisma.warden.create({
    data: {
      userId: wardenUser.id,
      buildingId: b1.id,
    },
  });

  // Staff (Electrical)
  const staffUser = await prisma.user.create({
    data: {
      email: 'staff@hostel.com',
      password: hashedDefaultPassword,
      name: 'Ramesh Electrician',
      role: 'STAFF',
      phone: '+919876543212',
    },
  });
  const staffProfile = await prisma.staff.create({
    data: {
      userId: staffUser.id,
      department: 'ELECTRICAL',
    },
  });

  // Guard
  const guardUser = await prisma.user.create({
    data: {
      email: 'guard@hostel.com',
      password: hashedDefaultPassword,
      name: 'Security Guard Somesh',
      role: 'GUARD',
      phone: '+919876543213',
    },
  });
  await prisma.guard.create({
    data: {
      userId: guardUser.id,
    },
  });

  // Parent
  const parentUser = await prisma.user.create({
    data: {
      email: 'parent@hostel.com',
      password: hashedDefaultPassword,
      name: 'Mahendra Prasad',
      role: 'PARENT',
      phone: '+919876543214',
    },
  });
  const parentProfile = await prisma.parent.create({
    data: {
      userId: parentUser.id,
    },
  });

  // Students
  const student1User = await prisma.user.create({
    data: {
      email: 'student1@hostel.com',
      password: hashedDefaultPassword,
      name: 'Aman Prasad',
      role: 'STUDENT',
      phone: '+919876543215',
    },
  });
  const student1Profile = await prisma.student.create({
    data: {
      userId: student1User.id,
      rollNumber: 'CS2201',
      branch: 'Computer Science',
      year: 3,
      gender: 'Male',
      parentId: parentProfile.id,
      bedId: bedsList[0].id, // Room 101 Bed A
    },
  });
  await prisma.bed.update({
    where: { id: bedsList[0].id },
    data: { isOccupied: true },
  });

  const student2User = await prisma.user.create({
    data: {
      email: 'student2@hostel.com',
      password: hashedDefaultPassword,
      name: 'Rohan Sharma',
      role: 'STUDENT',
      phone: '+919876543216',
    },
  });
  const student2Profile = await prisma.student.create({
    data: {
      userId: student2User.id,
      rollNumber: 'CS2202',
      branch: 'Computer Science',
      year: 3,
      gender: 'Male',
      bedId: bedsList[1].id, // Room 101 Bed B
    },
  });
  await prisma.bed.update({
    where: { id: bedsList[1].id },
    data: { isOccupied: true },
  });

  // 4. Create Complaints
  await prisma.complaint.create({
    data: {
      category: 'ELECTRICAL',
      description: 'The ceiling fan in room 101 is sparking and making noise.',
      priority: 'HIGH',
      status: 'ASSIGNED',
      studentId: student1Profile.id,
      assignedStaffId: staffProfile.id,
    },
  });

  await prisma.complaint.create({
    data: {
      category: 'INTERNET',
      description: 'WiFi signal is extremely weak, disconnecting every 5 minutes.',
      priority: 'MEDIUM',
      status: 'OPEN',
      studentId: student2Profile.id,
    },
  });

  // 5. Create Fees
  await prisma.fee.create({
    data: {
      studentId: student1Profile.id,
      amount: 45000,
      type: 'HOSTEL_FEE',
      dueDate: new Date('2026-07-01'),
      status: 'UNPAID',
    },
  });

  await prisma.fee.create({
    data: {
      studentId: student1Profile.id,
      amount: 12000,
      type: 'MESS_FEE',
      dueDate: new Date('2026-06-05'),
      status: 'PAID',
      paidAt: new Date('2026-06-03'),
    },
  });

  // 6. Electricity Bills
  await prisma.electricityBill.create({
    data: {
      studentId: student1Profile.id,
      roomId: bedsList[0].roomId,
      month: 5,
      year: 2026,
      readingPrev: 1200,
      readingCurrent: 1450,
      consumption: 250,
      rate: 8.5,
      amount: 2125,
      status: 'PAID',
    },
  });

  await prisma.electricityBill.create({
    data: {
      studentId: student1Profile.id,
      roomId: bedsList[0].roomId,
      month: 6,
      year: 2026,
      readingPrev: 1450,
      readingCurrent: 1800,
      consumption: 350,
      rate: 8.5,
      amount: 2975,
      status: 'UNPAID',
    },
  });

  // 7. Leave Requests
  await prisma.leaveRequest.create({
    data: {
      studentId: student1Profile.id,
      departureDate: new Date('2026-06-20'),
      returnDate: new Date('2026-06-25'),
      reason: 'Visiting home for sister\'s wedding',
      parentConfirmed: true,
      status: 'PENDING',
    },
  });

  // 8. Gate Passes
  await prisma.gatePass.create({
    data: {
      studentId: student1Profile.id,
      destination: 'Local Market',
      exitTime: new Date('2026-06-13T17:00:00'),
      returnTime: new Date('2026-06-13T21:00:00'),
      qrCode: 'GP-AMAN-8910',
      status: 'APPROVED',
    },
  });

  // 9. Visitors
  await prisma.visitor.create({
    data: {
      studentId: student1Profile.id,
      name: 'Rakesh Sharma',
      mobile: '+919988776655',
      idProof: 'Aadhaar 1234-5678-9012',
      purpose: 'Deliver heavy books and check room arrangements',
      relation: 'Uncle',
      qrCode: 'VIS-RAKESH-3321',
      status: 'APPROVED',
    },
  });

  // 10. Announcements
  await prisma.announcement.create({
    data: {
      title: 'Power Outage Maintenance Notice',
      content: 'There will be a planned power outage for electrical panel upgrades on Sunday, June 14, from 9:00 AM to 12:00 PM. Please plan accordingly.',
      targetRole: 'STUDENT',
      buildingId: b1.id,
      createdById: wardenUser.id,
    },
  });

  // 11. SOS log
  await prisma.emergencySos.create({
    data: {
      studentId: student2Profile.id,
      status: 'ACTIVE',
    },
  });

  console.log('Database seeding successfully finished!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
