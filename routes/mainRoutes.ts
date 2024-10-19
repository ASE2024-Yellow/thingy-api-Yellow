/**
 * @file ./routes/mainRoutes.ts
 * @description Defines the main routes for the server using Koa Router.
 */
import Router from 'koa-router';
import thingyRoutes from './api/thingyRoutes.ts';
import userRoutes from './api/userRoutes';



// Create a new Router
const mainRoutes = new Router();

// Use the thingyRoutes
mainRoutes.use('/things', thingyRoutes.routes(), thingyRoutes.allowedMethods());
mainRoutes.use('/', userRoutes.routes(), userRoutes.allowedMethods());

// Export the mainRoutes
export default mainRoutes;