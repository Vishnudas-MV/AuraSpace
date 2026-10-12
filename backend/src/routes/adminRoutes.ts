import { Router } from 'express';
import { getAllUsers, getUserEmotionalReport } from '../controllers/adminController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Protect all admin endpoints with authentication and superadmin role requirement
router.use(authenticateToken);
router.use(requireRole('superadmin'));

router.get('/users', getAllUsers);
router.get('/users/:targetUserId/report', getUserEmotionalReport);

export default router;
