import { EventEmitter } from "koa";

/**
 * Singleton class for handling events.
 */
const eventEmitter = new EventEmitter();

export default eventEmitter;