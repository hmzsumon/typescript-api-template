import {
	loadUser,
	loginUser,
	logoutUser,
	refreshAccessToken,
	registerUser,
} from '@/controllers/user.controller';
import { sendMoney } from '@/controllers/wallet.controller';
import { isAuthenticatedUser } from '@/middlewares/auth';
import { Router } from 'express';

const router = Router();

// register user
router.post('/register', registerUser);
// load user
router.get('/load-user', isAuthenticatedUser, loadUser);
// log in user
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/refresh-token', refreshAccessToken);

// send money
router.post('/send-usdt', isAuthenticatedUser, sendMoney);

export default router;
