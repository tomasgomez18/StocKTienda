import { Router } from 'express';
import { createSale, deleteSale, getSales, getSalesStats, getMostSold, getDailyClose, getDailyCloses } from './SaleController.js';
import { protect } from '../../middlewares/AuthMiddleware.js';
import { protectSales } from '../../middlewares/SalesAuthMiddleware.js';

const router = Router();

router.use(protect);

router.get('/daily-close', protectSales, getDailyClose);
router.get('/daily-closes', protectSales, getDailyCloses);
router.get('/stats', protectSales, getSalesStats);
router.get('/most-sold', protectSales, getMostSold);
router.get('/', protectSales, getSales);
router.post('/', protectSales, createSale);
router.delete('/:id', protectSales, deleteSale);

export default router;
