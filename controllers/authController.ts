import { Context } from 'koa';
import User, { IUser } from '../models/userModel';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const signUp = async (ctx: Context) => {
  const { username, email, password, transportType } = ctx.request.body as IUser;

  // Validate input
  if (!username || !email || !password || !transportType) {
    ctx.status = 400;
    ctx.body = { message: 'Username, email, password and transportType are required.' };
    return;
  }

  // Check if user exists
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    ctx.status = 400;
    ctx.body = { message: 'User already exists.' };
    return;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = new User({
    username,
    email,
    password: hashedPassword,
    transportType,
  });

  await user.save();

  ctx.status = 201;
  ctx.body = {
    id: user._id,
    username: user.username,
    email: user.email,
    transportType: user.transportType,
  };
};

export const signIn = async (ctx: Context) => {
    const { username, password } = ctx.request.body as { username: string, password: string };
  
    // Validate input
    if (!username || !password) {
      ctx.status = 400;
      ctx.body = { message: 'Username and password are required.' };
      return;
    }
  
    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      ctx.status = 401;
      ctx.body = { message: 'Invalid credentials.' };
      return;
    }
  
    // Compare password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      ctx.status = 401;
      ctx.body = { message: 'Invalid credentials.' };
      return;
    }
  
    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, {
      expiresIn: '1d',
    });
  
    ctx.status = 200;
    ctx.body = { token };
  };

export const googleSignIn = async (ctx: Context) => {
  const { id_token } = ctx.request.body as { id_token: string };

  if (!id_token) {
    ctx.status = 400;
    ctx.body = { message: 'ID Token is required.' };
    return;
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      ctx.status = 401;
      ctx.body = { message: 'Invalid ID Token.' };
      return;
    }

    const { sub: googleId, email, name } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        username: name,
        email,
        transportType: 'default',
        googleId,
      });
      await user.save();
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, {
      expiresIn: '1d',
    });

    ctx.status = 200;
    ctx.body = { token };
  } catch (error) {
    console.error(error);
    ctx.status = 500;
    ctx.body = { message: 'Internal Server Error.' };
  }
};