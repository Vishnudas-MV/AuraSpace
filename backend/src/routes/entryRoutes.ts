import { Router } from 'express';
import {
  createEntry,
  getEntries,
  getEntryById,
  deleteEntry,
} from '../controllers/entryController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Protect all entry routes with authentication
router.use(authenticateToken);

router.post('/', createEntry);
router.get('/', getEntries);
router.get('/:id', getEntryById);
router.delete('/:id', deleteEntry);

export default router;
