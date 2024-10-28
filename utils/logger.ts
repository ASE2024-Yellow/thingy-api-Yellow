/**
 * @file ./utils/logger.ts
 * @description Contains the logger configuration.
 */
import { transports, format, createLogger } from "winston";
import * as path from "path";

// Create a logger
const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [
    new transports.File({ filename: path.resolve(__dirname, "../error.log"), level: "error" }),
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    })
  ],
});

export default logger;
