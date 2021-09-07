'use strict';

const databaseWrapper = require('../utils/databaseWrapper');
const errorGenerator = require('../utils/errorGenerator');
const requestValidator = require('../utils/requestValidator');
const logger = require('../utils/logger');
const constant = require('../constants');


const rideController = (db) => {
  const ridesDatabase = databaseWrapper.rides(db);


  /**
   * Handle GET /rides request
   * @param {Object} req - request
   * @param {Object} res - response
   * @return {Object} updated response with http status and message
   */
  const getRides = async (req, res) => {
    logger.info('[GET] /rides is hit');
    // Validating request
    const validation = requestValidator.isGetAllRidesRequestInvalid(req);
    if (validation.result) {
      logger.error('Validation error');
      return res
          .status(constant.HTTP_CODE.VALIDATION_ERROR)
          .send(errorGenerator
              .returnValidationErrorResponse(validation.message));
    }

    // Sanitizing request.
    const pageNumber = req.query.pageNumber && Number(req.query.pageNumber);
    const limit = req.query.limit && Number(req.query.limit);
    const search = (req.query.search!==undefined?req.query.search:'' );
    // Business logic
    try {
      const rows = await ridesDatabase.getAllRides(pageNumber, limit, search);
      if (rows.length === 0) {
        logger.error('Rides not found');
        return res
            .status(constant.HTTP_CODE.NOT_FOUND)
            .send(errorGenerator.returnResourceNotFoundResponse());
      }
      // const resp = paginate(rows, pageNumber, size);
      return res
          .status(constant.HTTP_CODE.SUCCESSFUL)
          .send({
            status: true,
            message: 'Data fetched successfully',
            metadata: {
              totalPageCount: 1,
              currentPage: 1,
            },
            data: rows,
          });
    } catch (err) {
      logger.info({err});

      return res
          .status(constant.HTTP_CODE.SERVER_ERROR)
          .send(errorGenerator.returnServerErrorResponse());
    }
  };

  /**
   * Handle GET /rides/{id} request
   * @param {Object} req - request
   * @param {Object} res - response
   * @return {Object} updated response with http status and message
   */
  const getRideById = async (req, res) => {
    logger.info('[GET] /rides/:id is hit');
    // Validating request
    const validation = requestValidator.isGetRideByIdRequestInvalid(req);
    if (validation.result) {
      logger.error('Validation error');
      return res
          .status(constant.HTTP_CODE.VALIDATION_ERROR)
          .send(errorGenerator
              .returnValidationErrorResponse(validation.message));
    }

    // Sanitizing request
    const id = Number(req.params.id);

    // Business logic
    try {
      const rows = await ridesDatabase.getRideById(id);
      if (rows.length === 0) {
        logger.error(`Rides ${id} is not found`);
        return res
            .status(constant.HTTP_CODE.NOT_FOUND)
            .send(errorGenerator.returnResourceNotFoundResponse());
      }
      return res
          .status(constant.HTTP_CODE.SUCCESSFUL)
          .send(rows[0]);
    } catch (err) {
      logger.error(err);
      return res
          .status(constant.HTTP_CODE.SERVER_ERROR)
          .send(errorGenerator.returnServerErrorResponse());
    }
  };

  /**
   * Handle POST /rides request
   * @param {Object} req - request
   * @param {Object} res - response
   * @return {Object} updated response with http status and message
   */
  const postRides = async (req, res) => {
    logger.info('[POST] /rides is hit');
    // Validating request
    const validation = requestValidator.isPostRidesRequestInvalid(req);
    if (validation.result) {
      return res
          .status(constant.HTTP_CODE.VALIDATION_ERROR)
          .send(errorGenerator
              .returnValidationErrorResponse(validation.message));
    }

    // Sanitizing request
    const startLatitude = Number(req.body.startLat);
    const startLongitude = Number(req.body.startLong);
    const endLatitude = Number(req.body.endLat);
    const endLongitude = Number(req.body.endLong);
    const riderName = String(req.body.riderName);
    const driverName = String(req.body.driverName);
    const driverVehicle = String(req.body.driverVehicle);

    // Business logic
    const values = [startLatitude, startLongitude,
      endLatitude, endLongitude, riderName,
      driverName, driverVehicle];
    try {
      const riderId = await ridesDatabase.createNewRide(values);
      const result = await ridesDatabase.getRideById(riderId);
      return res
          .status(constant.HTTP_CODE.CREATED)
          .send({
            'status': true,
            'message': 'Created successfully',
            'data': result[0],
          });
    } catch (err) {
      logger.error(err);
      return res
          .status(constant.HTTP_CODE.SERVER_ERROR)
          .send(errorGenerator.returnServerErrorResponse());
    }
  };
  return {
    getRides,
    getRideById,
    postRides,
  };
};

module.exports = rideController;
