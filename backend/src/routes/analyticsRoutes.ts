import { Router } from 'express';
import { getTrends, getDistribution } from '../controllers/analyticsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Protect all analytics routes with authentication
router.use(authenticateToken);

router.get('/trends', getTrends);
router.get('/distribution', getDistribution);

export default router;
