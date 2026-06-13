import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { InfrastructureController } from '../controllers/infrastructureController';
import { ComplaintController } from '../controllers/complaintController';
import { LeaveController } from '../controllers/leaveController';
import { GatePassController } from '../controllers/gatePassController';
import { VisitorController } from '../controllers/visitorController';
import { BillingController } from '../controllers/billingController';
import { AiController } from '../controllers/aiController';
import { SosController } from '../controllers/sosController';
import { AnnouncementController } from '../controllers/announcementController';
import { authenticateJWT, requireRole } from '../middleware/authMiddleware';

const router = Router();

// ==========================================
// Authentication Routes
// ==========================================
router.post('/auth/register', AuthController.register);
router.post('/auth/login', AuthController.login);
router.post('/auth/refresh', AuthController.refreshToken);
router.get('/auth/me', authenticateJWT as any, AuthController.me as any);

// ==========================================
// Infrastructure / Room Allocation Routes
// ==========================================
router.get('/infra/overview', authenticateJWT as any, requireRole(['ADMIN', 'WARDEN']) as any, InfrastructureController.getOverview as any);
router.post('/infra/building', authenticateJWT as any, requireRole(['ADMIN']) as any, InfrastructureController.createBuilding as any);
router.post('/infra/floor', authenticateJWT as any, requireRole(['ADMIN']) as any, InfrastructureController.createFloor as any);
router.post('/infra/room', authenticateJWT as any, requireRole(['ADMIN']) as any, InfrastructureController.createRoom as any);
router.post('/infra/allocate/manual', authenticateJWT as any, requireRole(['ADMIN', 'WARDEN']) as any, InfrastructureController.allocateBedManual as any);
router.post('/infra/allocate/auto', authenticateJWT as any, requireRole(['ADMIN', 'WARDEN']) as any, InfrastructureController.autoAllocate as any);

// ==========================================
// Complaint System Routes
// ==========================================
router.post('/complaints', authenticateJWT as any, requireRole(['STUDENT']) as any, ComplaintController.create as any);
router.get('/complaints', authenticateJWT as any, ComplaintController.list as any);
router.post('/complaints/assign', authenticateJWT as any, requireRole(['ADMIN', 'WARDEN']) as any, ComplaintController.assignStaff as any);
router.put('/complaints/status', authenticateJWT as any, requireRole(['ADMIN', 'WARDEN', 'STAFF']) as any, ComplaintController.updateStatus as any);

// ==========================================
// Leave Request Routes
// ==========================================
router.post('/leaves', authenticateJWT as any, requireRole(['STUDENT']) as any, LeaveController.create as any);
router.get('/leaves', authenticateJWT as any, LeaveController.list as any);
router.put('/leaves/status', authenticateJWT as any, requireRole(['WARDEN', 'ADMIN']) as any, LeaveController.updateStatus as any);

// ==========================================
// Gate Pass System Routes
// ==========================================
router.post('/gatepass', authenticateJWT as any, requireRole(['STUDENT']) as any, GatePassController.create as any);
router.get('/gatepass', authenticateJWT as any, GatePassController.list as any);
router.post('/gatepass/scan', authenticateJWT as any, requireRole(['GUARD', 'ADMIN']) as any, GatePassController.scanPass as any);

// ==========================================
// Visitor Management Routes
// ==========================================
router.post('/visitors', authenticateJWT as any, requireRole(['STUDENT']) as any, VisitorController.create as any);
router.get('/visitors', authenticateJWT as any, VisitorController.list as any);
router.put('/visitors/status', authenticateJWT as any, requireRole(['WARDEN', 'ADMIN']) as any, VisitorController.updateStatus as any);
router.post('/visitors/scan', authenticateJWT as any, requireRole(['GUARD', 'ADMIN']) as any, VisitorController.scanVisitor as any);

// ==========================================
// Fee & Electricity Billing Routes
// ==========================================
router.post('/billing/fee', authenticateJWT as any, requireRole(['ADMIN']) as any, BillingController.createFee as any);
router.post('/billing/fee/pay', authenticateJWT as any, BillingController.payFee as any);
router.post('/billing/electricity', authenticateJWT as any, requireRole(['ADMIN']) as any, BillingController.createElectricityBill as any);
router.post('/billing/electricity/pay', authenticateJWT as any, BillingController.payElectricityBill as any);
router.get('/billing/all', authenticateJWT as any, BillingController.listBills as any);

// ==========================================
// Announcement / Notices Routes
// ==========================================
router.post('/announcements', authenticateJWT as any, requireRole(['WARDEN', 'ADMIN']) as any, AnnouncementController.create as any);
router.get('/announcements', authenticateJWT as any, AnnouncementController.list as any);

// ==========================================
// Emergency SOS Routes
// ==========================================
router.post('/sos/trigger', authenticateJWT as any, requireRole(['STUDENT']) as any, SosController.trigger as any);
router.post('/sos/resolve', authenticateJWT as any, requireRole(['WARDEN', 'GUARD', 'ADMIN']) as any, SosController.resolve as any);
router.get('/sos', authenticateJWT as any, requireRole(['WARDEN', 'GUARD', 'ADMIN']) as any, SosController.list as any);

// ==========================================
// AI Features Routes
// ==========================================
router.post('/ai/classify-complaint', authenticateJWT as any, AiController.classify as any);
router.post('/ai/assistant', authenticateJWT as any, AiController.chat as any);
router.get('/ai/predictions', authenticateJWT as any, requireRole(['ADMIN', 'WARDEN']) as any, AiController.predictions as any);

export default router;
