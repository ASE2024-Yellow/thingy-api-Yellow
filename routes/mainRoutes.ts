import Router from 'koa-router';
import userRoutes from './api/userRoutes';

const mainRouter = new Router();

mainRouter.use('/', userRoutes.routes(), userRoutes.allowedMethods());

export default mainRouter;
