'use strict';

/**
 * Check if the request for GET /rides is invalid
 *
 * @param {Object} req
 * @return {{result: boolean, message: string}}
 */
const isGetAllRidesRequestInvalid = (req) => {
  const pageNumber = req.query.pageNumber;
  const limit = req.query.limit;
  const isParameterExist = pageNumber && limit;
  const isParameterNotNumber = (!Number.isInteger(Number(pageNumber)) ||
    !Number.isInteger(Number(limit)));
  const isParameterNegative = (Number(pageNumber) <= 0 || Number(limit) <=0);
  return {
    result: isParameterExist && (isParameterNotNumber || isParameterNegative),
    message: 'pageNumber and limit must be integer > 0',
  };
};

/**
 * Check if the request for GET /rides/{id} is invalid
 *
 * @param {Object} req
 * @return {{result: boolean, message: string}}
 */
const isGetRideByIdRequestInvalid = (req) => {
  const id = req.params.id;
  return {
    result: !Number.isInteger(Number(id)) || Number(id) <= 0,
    message: 'rideID must be integer > 0',
  };
};

/**
 * Check if the request for POST /rides is invalid
 *
 * @param {Object} req
 * @return {{result: boolean, message: string}}
 */
const isPostRidesRequestInvalid = (req) => {
  const startLatitude = req.body.startLat;
  const startLongitude = req.body.startLong;
  const endLatitude = req.body.endLat;
  const endLongitude = req.body.endLong;
  const riderName = req.body.riderName;
  const driverName = req.body.driverName;
  const driverVehicle = req.body.driverVehicle;

  let result = false;
  let message = '';

  const isLatitudeInvalid = (!startLatitude || !endLatitude ||
        !Number.isInteger(startLatitude) || !Number.isInteger(endLatitude) ||
        Number(startLatitude) < -90 || Number(startLatitude) > 90 ||
        Number(endLatitude) < -90 || Number(endLatitude) > 90);

  const isLongitudeInvalid = (!startLongitude || !endLongitude ||
        !Number.isInteger(startLongitude) || !Number.isInteger(endLongitude) ||
        Number(startLongitude) < -180 || Number(startLongitude) > 180 ||
        Number(endLongitude) < -180 || Number(endLongitude) > 180);

  const isStringInputInvalid = (!riderName || !driverName || !driverVehicle ||
        riderName instanceof String || driverName instanceof String ||
    driverVehicle instanceof String || riderName.length < 1 ||
    driverName.length < 1 || driverVehicle.length <1);

  if (isLatitudeInvalid) {
    result = true;
    message = 'Start latitude and end latitude ' +
      'must be between -90 - 90 degrees';
  } else if ( isLongitudeInvalid) {
    result = true;
    message = 'Start longitude and end longitude ' +
      'must be between -180 - 180 degrees';
  } else if (isStringInputInvalid) {
    result = true;
    message = 'riderName, driverName, driverVehicle ' +
      'must be String with length > 0';
  }

  return {
    result,
    message,
  };
};

module.exports = {
  isGetAllRidesRequestInvalid,
  isGetRideByIdRequestInvalid,
  isPostRidesRequestInvalid,
};
