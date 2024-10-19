/**
 * @file ./server.ts
 * @description The main entry point for the server.
 */

import Koa from 'koa'
import bodyParser from 'koa-bodyparser';
import cors from 'koa2-cors';

import router from './routes/mainRoutes.ts';
import { connectToDatabase, errorHandler, startServer } from './utils/utils.ts';

// Load environment variables
require('dotenv').config()

// Create a new Koa application
const app = new Koa();

// Connect to MongoDB
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  throw new Error('MONGO_URI is not defined in the environment variables');
}
connectToDatabase(mongoUri);

// Add middleware to the server
app
  .use(bodyParser())
  .use(cors())
  .use(router.routes())
  .use(router.allowedMethods())
  .use(errorHandler);

// Start the server
startServer(app, 8080);