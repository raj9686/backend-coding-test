'use strict';

const winston = require('winston');

/**
 * Creating logger using Winston
 *
 * @type {winston.Logger}
 */
module.exports = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json(),
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({filename: 'logs/app.log'}),
  ],
});
