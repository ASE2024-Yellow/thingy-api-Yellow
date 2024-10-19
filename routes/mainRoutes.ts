import Router from 'koa-router';
import thingyRoutes from './api/thingyRoutes.ts';

const mainRoutes = new Router();


mainRoutes.use('/things', thingyRoutes.routes(), thingyRoutes.allowedMethods());

