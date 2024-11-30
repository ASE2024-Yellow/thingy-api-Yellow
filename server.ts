import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import dotenv from 'dotenv';
import mainRoutes from './routes/mainRoutes';
import cors from '@koa/cors';
import loggerMiddleware from './utils/loggerMiddleware';
import jwt from 'koa-jwt';
import helmet from 'koa-helmet';
import { connectToDatabase } from './utils/utils';
import MqttHandler from './mqtt/mqttHandle';

dotenv.config();

const app = new Koa();

// connect to mongodb
connectToDatabase(process.env.MONGODB_URI!);

new MqttHandler();

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
  /^\/user\/google-signin/,
]}));

// Use routes
app.use(mainRoutes.routes());

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
