import { Context } from 'koa';
import User, { IUser } from '../models/userModel';
import logger from '../utils/logger';

export const getUserTransportType = async (ctx: Context) => {
    try {
      const userId = ctx.state.user.id;
      const user = await User.findById(userId).select('transportType');
      if (!user) {
        ctx.status = 404;
        ctx.body = { message: 'User not found.' };
        return;
      }
  
      ctx.status = 200;
      ctx.body = {
        transportType: user.transportType,
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { message: 'Internal server error.' };
    }
  };

export const updateUserTransportType = async (ctx: Context) => {
    try {
      const userId = ctx.state.user.id;
      const { transportType } = ctx.request.body as { transportType: string };
  
      const validTransportTypes = ['bike', 'wheelchair', 'car', 'bus', 'train', 'other'];
      if (!transportType || !validTransportTypes.includes(transportType)) {
        ctx.status = 400;
        ctx.body = { message: 'Invalid transportType.' };
        return;
      }
  
      const user = await User.findByIdAndUpdate(
        userId,
        { transportType },
        { new: true, select: 'id username email transportType' }
      );
  
      if (!user) {
        ctx.status = 404;
        ctx.body = { message: 'User not found.' };
        return;
      }
  
      ctx.status = 200;
      ctx.body = {
        id: user._id,
        username: user.username,
        email: user.email,
        transportType: user.transportType,
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { message: 'Internal server error.' };
    }
  };

export const getUserProfile = async (ctx: Context) => {
    const userId = ctx.state.user.id;
    const user = await User.findById(userId).select('-password');
    if (!user) {
      ctx.status = 404;
      ctx.body = { message: 'User not found.' };
      return;
    }
    ctx.status = 200;
    ctx.body = user;
  };


export const updateUserProfile = async (ctx: Context) => {
  const userId = ctx.state.user.id;
  const updates = ctx.request.body as IUser;

  if (updates.password) {
    ctx.status = 400;
    ctx.body = { message: 'Use the password change endpoint to update password.' };
    return;
  }

  const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-password');
  if (!user) {
    ctx.status = 404;
    ctx.body = { message: 'User not found.' };
    return;
  }
  ctx.status = 200;
  ctx.body = user;
};

export const deleteUserAccount = async (ctx: Context) => {
    const userId = ctx.state.user.id;
    await User.findByIdAndDelete(userId);
    ctx.status = 204;
  };


export const getAllUsers = async (ctx: Context) => {
  try {
    const users = await User.find().select('id username email transportType');

    ctx.status = 200;
    ctx.body = users;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: 'Internal server error.' };
  }
};