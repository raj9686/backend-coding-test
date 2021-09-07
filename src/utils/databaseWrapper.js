'use strict';

const models = require('../models');
const logger = require('./logger');
const constant = require('../constants');

/**
 * Building all schemas defined in models
 *
 * @param {sqlite3.Database} db
 * @return {sqlite3.Database} db
 */
const buildSchemas = (db) => {
  const createTable = (db, tableName, tableContent) => {
    db.run(constant.DB_SCRIPTS.createTable(tableName, tableContent));
  };

  logger.info('Creating database schemas');
  Object.keys(models).map((tableName) =>{
    logger.info(`Creating ${tableName} tables`);
    createTable(db, tableName, models[tableName]);
  });
  return db;
};

/**
 * Class that hosts functions to do ride operations
 *
 * @param {sqlite3.Database} db
 * @return {{createNewRide: (function(*=)),
 * getAllRides: (function()), getRideById: (function(*=))}}
 */
const rides = (db) => {
  /**
   * Wrapper to run db.all function in promise style
   *
   * @param {sqlite3.Database} db
   * @param values
   * @param {string} script of the db operation
   * @return {Promise<any>} result of the db operation
   */
  const runDBAllAsync = (db, values, script) => {
    logger.info({values, script})

    if (values!==null) {
      return new Promise((resolve, reject) => {
        db.all(script, values, (err, rows) => {
          if (err) {
            reject(err);
          }

          resolve(rows);
        });
      });
    }else {
      return new Promise((resolve, reject) => {
        db.all(script,  (err, rows) => {
          if (err) {
            reject(err);
          }

          resolve(rows);
        });
      });
    }
  };

  /**
   * Wrapper to run db.run function in promise style
   *
   * @param {sqlite3.Database} db
   * @param {array} values of the required details of a ride object
   * @param {string} script of the db operation
   * @return {Promise<any>} result of the db operation
   */
  const runDBRunAsync = (db, values, script) => {
    return new Promise((resolve, reject) => {
      db.run(script, values, function(err) {
        if (err) {
          console.log(err);
          reject(err);
        }
        // eslint-disable-next-line no-invalid-this
        resolve(this.lastID);
      });
    });
  };

  /**
   * Getting all rides
   * @param {number} pageNumber of the required details for paging
   * @param {number} limit of the required details for paging
   * @param {string} search of the required details for paging
   */
  const getAllRides = async (pageNumber, limit, search) => {
    logger.info({pageNumber, limit, search})
    pageNumber===undefined?pageNumber=1:pageNumber;
    limit===undefined?limit=1:limit;
    return await runDBAllAsync(db,null, constant.DB_SCRIPTS.getAllRides(pageNumber,
        limit, search));
  };

  /**
   *  Getting ride by ID
   *
   * @param {number} id of the ride
   * @return {Promise<any>} - all rows that match the id
   */
  const getRideById = async (id) => {
    logger.info(`Getting a ride by id: ${id} from database`);
    return await runDBAllAsync(db,id, constant.DB_SCRIPTS.getRideById(id));
  };

  /**
   * Creating a ride in the database
   * @param {array} values of the required details of a ride object
   * @return {Promise<any>} - the ID of the ride that is just created
   */
  const createNewRide = async (values) => {
    logger.info('Creating a new ride from database');
    logger.info(constant.DB_SCRIPTS.createRide(), values);
    return await runDBRunAsync(db, values, constant.DB_SCRIPTS.createRide());
  };
  return {
    createNewRide,
    getAllRides,
    getRideById,
  };
};

module.exports = {
  buildSchemas,
  rides,
};
