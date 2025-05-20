import mongoose, { Document, Schema } from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';

// Enum definitions
export enum UserRole {
	User = 'user',
	Admin = 'admin',
	Owner = 'owner',
	Manager = 'manager',
	Employee = 'employee',
	SuperAdmin = 'super_admin',
	Agent = 'agent',
}

export enum UserRank {
	User = 'User',
	Earner = 'Earner',
	Achiever = 'Achiever',
	Climber = 'Climber',
	Gainer = 'Gainer',
	Sustainer = 'Sustainer',
	Champion = 'Champion',
}

// User interface
export interface IUser extends Document {
	name: string;
	email: string;
	phone: string;
	password: string;
	text_password: string;
	customer_id: string;
	country: string;
	role: UserRole;
	rank: UserRank;
	m_balance: number;
	last_m_balance: number;
	t_balance: number;
	a_balance: number;
	e_balance: number;
	current_investment: number;
	email_verified: boolean;
	kyc_verified: boolean;
	kyc_request: boolean;
	kyc_step: number;
	is_active: boolean;
	is_new: boolean;
	is_winner: boolean;
	is_package_active: boolean;
	two_factor_enabled: boolean;
	is_block: boolean;
	is_possible_withdraw: boolean;
	is_withdraw_block: boolean;
	is_due: boolean;
	due_amount: number;
	is_payment_method_added: boolean;
	fcm_tokens: string[];
	resetPasswordToken?: string;
	resetPasswordExpire?: Date;
	getJWTToken(): string;
	comparePassword(password: string): Promise<boolean>;
	getResetPasswordToken(): string;
}

const userSchema = new Schema<IUser>(
	{
		name: {
			type: String,
			required: [true, 'Please Enter Your Name'],
		},
		email: {
			type: String,
			required: [true, 'Please Enter Your Email'],
			validate: [validator.isEmail, 'Please Enter a valid Email'],
		},
		phone: {
			type: String,
			required: [true, 'Please Enter Your Phone Number'],
			unique: true,
			validate: [validator.isMobilePhone, 'Please Enter a valid Phone Number'],
		},
		customer_id: {
			type: String,
			unique: true,
			required: [true, 'Please Enter Your Partner ID'],
		},
		password: {
			type: String,
			minlength: 6,
			select: false,
		},
		text_password: {
			type: String,
			minlength: 6,
			required: [true, 'Please Enter Your Password'],
		},
		country: { type: String, required: true },
		role: {
			type: String,
			enum: Object.values(UserRole),
			default: UserRole.User,
		},
		rank: {
			type: String,
			enum: Object.values(UserRank),
			default: UserRank.User,
		},
		m_balance: { type: Number, default: 0 },
		last_m_balance: { type: Number, default: 0 },
		t_balance: { type: Number, default: 0 },
		a_balance: { type: Number, default: 0 },
		e_balance: { type: Number, default: 0 },
		current_investment: { type: Number, default: 0 },
		email_verified: { type: Boolean, default: true },
		kyc_verified: { type: Boolean, default: false },
		kyc_request: { type: Boolean, default: false },
		kyc_step: { type: Number, default: 1 },
		is_active: { type: Boolean, default: false },
		is_new: { type: Boolean, default: true },
		is_winner: { type: Boolean, default: false },
		is_package_active: { type: Boolean, default: false },
		two_factor_enabled: { type: Boolean, default: false },
		is_block: { type: Boolean, default: false },
		is_possible_withdraw: { type: Boolean, default: false },
		is_withdraw_block: { type: Boolean, default: false },
		is_due: { type: Boolean, default: false },
		due_amount: { type: Number, default: 0 },
		is_payment_method_added: { type: Boolean, default: false },
		fcm_tokens: [],
		resetPasswordToken: String,
		resetPasswordExpire: Date,
	},
	{ timestamps: true }
);

// 🔐 Pre-save hook for hashing password
userSchema.pre<IUser>('save', async function (next) {
	if (!this.isModified('password')) return next();
	this.password = await bcrypt.hash(this.password, 10);
	next();
});

// 🔐 Create JWT Token
userSchema.methods.getJWTToken = function (): string {
	const payload = { id: this._id };

	const secret: Secret = process.env.JWT_SECRET!;
	const options: SignOptions = {
		expiresIn: process.env.JWT_EXPIRE as jwt.SignOptions['expiresIn'],
	};

	return jwt.sign(payload, secret, options);
};

// 🔐 Compare Password
userSchema.methods.comparePassword = async function (
	password: string
): Promise<boolean> {
	return bcrypt.compare(password, this.password);
};

// 🔐 Generate Reset Password Token
userSchema.methods.getResetPasswordToken = function (): string {
	const resetToken = crypto.randomBytes(20).toString('hex');
	this.resetPasswordToken = crypto
		.createHash('sha256')
		.update(resetToken)
		.digest('hex');
	this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
	return resetToken;
};

export const User = mongoose.model<IUser>('User', userSchema);
