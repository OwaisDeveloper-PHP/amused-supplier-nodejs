import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import * as authController from '../controllers/authController';
import * as dashboardController from '../controllers/dashboardController';
import * as submissionController from '../controllers/submissionController';
import * as supplierController from '../controllers/supplierController';
import * as emailTemplateController from '../controllers/emailTemplateController';
import * as sellWithUsApiController from '../controllers/api/sellWithUsController';

export const router = Router();

router.get('/login', authController.showLogin);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// Public API — consumed by the storefront "Sell With Us" form, no session/auth required.
router.post('/api/sell-with-us', sellWithUsApiController.submit);

router.use(requireAuth);

router.get('/', dashboardController.index);

router.get('/submissions', submissionController.index);
router.get('/submissions/:id', submissionController.show);
router.post('/submissions/:id/approve', submissionController.approve);
router.post('/submissions/:id/reject', submissionController.reject);
router.post('/submissions/:id/send-email', submissionController.sendEmail);
router.post('/submissions/:id/push-to-shopify', submissionController.pushToShopify);
router.post('/submissions/:id/notes', submissionController.updateNotes);

router.get('/email-templates/:id/edit', emailTemplateController.edit);
router.put('/email-templates/:id', emailTemplateController.update);
router.post('/email-templates/:id/preview', emailTemplateController.preview);

router.get('/suppliers', supplierController.index);
router.get('/suppliers/create', supplierController.create);
router.post('/suppliers', supplierController.store);
router.get('/suppliers/:id', supplierController.show);
router.get('/suppliers/:id/edit', supplierController.edit);
router.put('/suppliers/:id', supplierController.update);
router.post('/suppliers/:id/test-connection', supplierController.testConnection);
