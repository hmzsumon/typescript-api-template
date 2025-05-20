// ✅ Updated app.ts with secure CORS config for Cookie-based Auth

import express from 'express';
import cookieParser from 'cookie-parser';
import fileUpload from 'express-fileupload';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import path from 'path';

import userRoutes from '@/routes/user.routes';
import { errorHandler } from './middlewares/errorHandler';

// Config
if (process.env.NODE_ENV !== 'PRODUCTION') {
	dotenv.config({ path: 'src/config/config.env' });
}

const app = express();

// 🔐 CORS config for frontend cookie-auth support
const allowedOrigins = ['http://localhost:3000', 'https://yourdomain.com'];

app.use(
	cors({
		origin: allowedOrigins,
		credentials: true, // ✅ Required to accept cookies from frontend
	})
);

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());

// Routes
app.use('/api/v1', userRoutes);

// Test Route
app.get('/', (req, res) => {
	const data = {
		server_time: new Date().toString(),
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		server_mode: process.env.NODE_ENV,
		server_port: process.env.PORT,
		root_url: req.protocol + '://' + req.get('host'),
	};
	res.status(200).json({ success: true, data });
});

app.use(errorHandler);

export default app;
