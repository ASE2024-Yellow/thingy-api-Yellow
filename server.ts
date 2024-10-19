/**
 * Main file for the server
 *  - Connects to MongoDB
 *  - Adds error handling middleware
 *  - Adds routes
 *  - Adds CORS
 *  - Adds body parser
 *  - Starts the Koa server
 * 
 */


import Koa from 'koa'
import bodyParser from 'koa-bodyparser';
import cors from 'koa2-cors';
import mongoose from 'mongoose';

import router from './routes/mainRoutes.ts';
import { connectToDatabase, errorHandler, startServer } from './utils/utils.ts';


// Create a new Koa application
const app = new Koa();

// Connect to MongoDB
connectToDatabase('mongodb://localhost:27017/database');

app
  .use(bodyParser())
  .use(cors())
  .use(router.routes())
  .use(router.allowedMethods())
  .use(errorHandler);

startServer(app, 8080);