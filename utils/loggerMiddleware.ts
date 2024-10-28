/**
 * @file ./utils/loggerMiddleware.ts
 * @description Contains the logger middleware for logging requests and responses.
 */
import { Context } from "koa";
import logger from "./logger";

// Logger middleware
const loggerMiddleware = async (ctx: Context, next: () => Promise<any>): Promise<void> => {
  const start = new Date().getTime();
  
  const request = {
    method: ctx.method,
    url: ctx.url,
    headers: ctx.headers,
    body: ctx.request.body,
  };
  logger.info(`Request: ${JSON.stringify(request)}`);

  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = err.message;
    logger.error(`Error ${ctx.status}: ${err.message}`);
  }

  const ms = new Date().getTime() - start;
  const logLevel = ctx.status >= 500 ? "error" : ctx.status >= 400 ? "warn" : "info";

  const msg = `${ctx.method} ${ctx.originalUrl} ${ctx.status} ${ms}ms`;

  logger.log(logLevel, msg);
};

export default loggerMiddleware;
