import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../middleware/auth';
import { validateBody } from '../../middleware/validateRequest';
import { RegisterSchema, LoginSchema } from '@loadvanta/contracts';
import { authRateLimiter } from '../../middleware/rateLimiter';

const router = Router();

router.post('/register', authRateLimiter, validateBody(RegisterSchema), (req, res, next) => {
  authController.register(req, res, next);
});

router.post('/login', authRateLimiter, validateBody(LoginSchema), (req, res, next) => {
  authController.login(req, res, next);
});

router.post('/logout', (req, res) => {
  authController.logout(req, res);
});

router.get('/me', authenticate, (req, res, next) => {
  authController.me(req, res, next);
});

export const authRoutes = router;
