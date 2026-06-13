import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class NotificationService {
  /**
   * Broadcast/Send Notification to individual or multiple users
   */
  static async sendNotification(params: {
    userId: string;
    title: string;
    body: string;
    channel: 'EMAIL' | 'SMS' | 'IN_APP' | 'ALL';
  }) {
    console.log(`[Notification Service - ${params.channel}] to User ${params.userId}:`);
    console.log(`Title: ${params.title}`);
    console.log(`Body: ${params.body}`);
    console.log(`-----------------------------------------------`);

    // In a real application, you'd trigger SendGrid/Nodemailer for EMAIL, Twilio for SMS.
    // For our hackathon winning project, we log this and can also store in-app notifications
    // in an AuditLog or direct InAppNotification table (which is simulated here via AuditLog).
    try {
      await prisma.auditLog.create({
        data: {
          userId: params.userId,
          action: `NOTIFICATION: ${params.title} - ${params.body.substring(0, 100)}`,
        },
      });
    } catch (err) {
      console.error('Failed to log notification audit log:', err);
    }
  }

  /**
   * Emergency Alert notification
   */
  static async triggerSosAlert(studentName: string, roomNumber: string, buildingName: string) {
    console.log(`[EMERGENCY SOS ALERT ACTIVATED]`);
    console.log(`Student: ${studentName}`);
    console.log(`Location: Room ${roomNumber}, ${buildingName}`);
    
    // Fetch all Wardens, Security Guards, and Admins to broadcast the SOS alerts
    try {
      const staffUsers = await prisma.user.findMany({
        where: {
          role: { in: ['WARDEN', 'GUARD', 'ADMIN'] },
        },
      });

      for (const u of staffUsers) {
        await this.sendNotification({
          userId: u.id,
          title: '🚨 EMERGENCY SOS ALERT 🚨',
          body: `Student ${studentName} has activated the emergency SOS from Room ${roomNumber}, ${buildingName}. Take immediate action!`,
          channel: 'ALL',
        });
      }
    } catch (err) {
      console.error('Failed to dispatch SOS alerts:', err);
    }
  }
}
