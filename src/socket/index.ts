// src/socket/index.ts
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketIOServer;

export default {
	attach: (server: HTTPServer) => {
		io = new SocketIOServer(server, {
			cors: {
				origin: '*',
			},
		});

		io.on('connection', (socket) => {
			console.log(`🟢 New socket connected: ${socket.id}`);
			socket.on('disconnect', () => {
				console.log(`🔴 Socket disconnected: ${socket.id}`);
			});
		});
	},
};
