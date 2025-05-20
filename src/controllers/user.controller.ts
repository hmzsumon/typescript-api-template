// ✅ Updated with proper type casting for refreshToken jwt.sign

import { typeHandler } from '@/types/express';
import { catchAsync } from '@/utils/catchAsync';
import { ApiError } from '@/utils/ApiError';
import { User } from '@/models/user.model';
import jwt, { JwtPayload, Secret, SignOptions } from 'jsonwebtoken';
import { StringValue } from 'ms';
import { Types } from 'mongoose';
import { Response } from 'express';
import { sendTokenWithRefresh } from '@/utils/sendTokenWithRefresh';

// 🔐 Setup cookie for refresh token – call this inside login/register
export const sendRefreshToken = (userId: string, res: Response) => {
	const refreshExpiresIn: StringValue = (process.env.JWT_REFRESH_EXPIRE ||
		'7d') as StringValue;

	const refreshToken = jwt.sign(
		{ id: userId },
		process.env.JWT_REFRESH_SECRET as Secret,
		{ expiresIn: refreshExpiresIn }
	);

	res.cookie('refresh_token', refreshToken, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'PRODUCTION',
		sameSite: 'lax',
		path: '/api/v1/refresh-token',
		expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
	});
};

export const registerUser: typeHandler = catchAsync(async (req, res, next) => {
	const {
		name,
		email,
		password,
		country,
		customer_id,
		mobile: phone,
	} = req.body;

	if (!email || !password || !country || !customer_id) {
		return next(new ApiError(400, 'Please provide all required fields'));
	}

	const existingUser = await User.findOne({ email });
	if (existingUser) {
		return next(new ApiError(409, 'User already exists with this email'));
	}

	const user = await User.create({
		name,
		email,
		password,
		country,
		customer_id,
		phone,
		text_password: password,
	});
	sendTokenWithRefresh(user, 201, res);
});

// 🔐 Login user
export const loginUser: typeHandler = catchAsync(async (req, res, next) => {
	const { email, password } = req.body;

	if (!email || !password) {
		return next(new ApiError(400, 'Please enter both email and password'));
	}

	const user = await User.findOne({ email }).select('+password');
	if (!user) {
		return next(new ApiError(401, 'Invalid email or password'));
	}

	const isPasswordMatch = await user.comparePassword(password);
	if (!isPasswordMatch) {
		return next(new ApiError(401, 'Invalid email or password'));
	}

	sendTokenWithRefresh(user, 200, res);
});

// 🔐 Load user data
export const loadUser: typeHandler = catchAsync(async (req, res, next) => {
	if (!req.user || !req.user._id) {
		return next(new ApiError(401, 'User not authenticated'));
	}
	const user = await User.findById(req.user._id as Types.ObjectId);
	if (!user) return next(new ApiError(404, 'User not found'));

	res.status(200).json(user);
});

export const logoutUser: typeHandler = catchAsync(async (_req, res) => {
	res.clearCookie('htx_token');
	res.clearCookie('htx_refresh_token', { path: '/' });

	res.status(200).json({
		success: true,
		message: 'Logged out successfully',
	});
});

export const refreshAccessToken: typeHandler = catchAsync(
	async (req, res, next) => {
		const refreshToken = req.cookies.refresh_token;

		if (!refreshToken) {
			return next(
				new ApiError(401, 'Refresh token not found. Please login again.')
			);
		}

		let decoded: JwtPayload;
		try {
			decoded = jwt.verify(
				refreshToken,
				process.env.JWT_REFRESH_SECRET as Secret
			) as JwtPayload;
		} catch (err) {
			return next(new ApiError(403, 'Invalid or expired refresh token.'));
		}

		const user = await User.findById(decoded.id);
		if (!user) {
			return next(new ApiError(404, 'User not found'));
		}

		const accessToken = jwt.sign(
			{ id: user._id },
			process.env.JWT_SECRET as Secret,
			{
				expiresIn: (process.env.JWT_EXPIRE as StringValue) || '7d', // ✅ fixed
			}
		);

		res.cookie('token', accessToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'PRODUCTION',
			sameSite: 'lax',
			expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
		});

		res.status(200).json({
			success: true,
			access_token: accessToken,
		});
	}
);
