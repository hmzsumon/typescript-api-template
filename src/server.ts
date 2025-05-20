import 'module-alias/register';
import http from 'http';
import dotenv from 'dotenv';

import mongoose from 'mongoose';
import app from './app';
import { connectDB } from '@/config/db';
import socketIO from '@/socket';

// Handling Uncaught Exception
process.on('uncaughtException', (err) => {
	console.error('❌ Uncaught Exception:', err.message);
	process.exit(1);
});

// Load env
dotenv.config({ path: './.env' });

// DB connect
connectDB();

// Start Server
const server = http.createServer(app);

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
	console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Attach Socket.IO
socketIO.attach(server);
(global as any).io = socketIO;

// Handle Unhandled Promise Rejection
process.on('unhandledRejection', (err: any) => {
	console.error('❌ Unhandled Promise Rejection:', err.message);
	server.close(() => process.exit(1));
});
