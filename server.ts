import Koa from 'koa';
import mongoose from 'mongoose';
import bodyParser from 'koa-bodyparser';
import dotenv from 'dotenv';
import mainRoutes from './routes/mainRoutes';
import cors from '@koa/cors';
import loggerMiddleware from './utils/loggerMiddleware';
import jwt from 'koa-jwt';
import helmet from 'koa-helmet';

dotenv.config();

const app = new Koa();

// connect to mongodb
mongoose.connect(process.env.MONGODB_URI!).then(() => {
  console.log('MongoDB connected');
}).catch(err => {
  console.error(err);
});

// enable cors with default options
app.use(cors());

// Helmet middleware -> secure the app by setting various HTTP headers
app.use(helmet());

// Logger middleware -> use winston as logger
app.use(loggerMiddleware);

// Enable bodyParser with default options
app.use(bodyParser());

// JWT middleware -> use jsonwebtoken to verify token
app.use(jwt({ secret: process.env.JWT_SECRET! }).unless({ path: [
  /^\/user\/signin/,
  /^\/user\/signup/,
  /^\/users$/,
  /^\/users\//
]}));

// Use routes
app.use(mainRoutes.routes());

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});