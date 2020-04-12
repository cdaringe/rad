import * as log from "https://deno.land/std/log/mod.ts";

// var winston = require('winston')

// var logger = winston.createLogger({
//   level: 'info',
//   format: winston.format.json(),
//   transports: []
// })

// // If we're not in production then log to the `console` with the format:
// // `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
// var TransportCTor = winston.transports.Console
// if (process.env.NODE_ENV !== 'production') {
//   logger.add(
//     new TransportCTor({
//       format: winston.format.simple()
//     })
//   )
// }

export const logger = log;
