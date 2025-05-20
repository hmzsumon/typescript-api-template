import jwt, { Secret } from 'jsonwebtoken';
import { StringValue } from 'ms';
import { Response } from 'express';

export const sendTokenWithRefresh = (
	user: any,
	statusCode: number,
	res: Response
) => {
	const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET as Secret, {
		expiresIn: (process.env.JWT_EXPIRE as StringValue) || '7d',
	});

	const refreshToken = jwt.sign(
		{ id: user._id },
		process.env.JWT_REFRESH_SECRET as Secret,
		{
			expiresIn: (process.env.JWT_REFRESH_EXPIRE as StringValue) || '7d',
		}
	);

	const cookieOptions = {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'PRODUCTION',
		sameSite: 'lax' as const,
	};

	res.cookie('htx_token', token, {
		...cookieOptions,
		expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
	});

	res.cookie('htx_refresh_token', refreshToken, {
		...cookieOptions,
		path: '/', // ✅ All routes will receive this cookie
		expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
	});

	res.status(statusCode).json({
		success: true,
		token,
		user,
	});
};
