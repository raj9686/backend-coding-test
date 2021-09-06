'use strict';

const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

module.exports = (db) => {
  app.get('/health', (req, res) => res.send('Healthy'));

  app.post('/rides', jsonParser, (req, res) => {
    const startLat = Number(req.body.startLat);
    const startLong = Number(req.body.startLong);
    const endLatitude = Number(req.body.endLat);
    const endLongitude = Number(req.body.endLong);
    const riderName = req.body.riderName;
    const driverName = req.body.driverName;
    const driverVehicle = req.body.driverVehicle;
    if (startLat < -90 || startLat > 90 ||
            startLong < -180 || startLong > 180) {
      return res.send({
        errorCode: 'VALIDATION_ERROR',
        message: 'Start latitude and longitude must be between -90 - 90 and' +
                    ' -180 to 180 degrees respectively',
      });
    }

    if (endLatitude < -90 || endLatitude > 90 ||
            endLongitude < -180 || endLongitude > 180) {
      return res.send({
        errorCode: 'VALIDATION_ERROR',
        message: 'End latitude and longitude must be between -90 - 90 and' +
                    ' -180 to 180 degrees respectively',
      });
    }

    if (typeof riderName !== 'string' || riderName.length < 1) {
      return res.send({
        errorCode: 'VALIDATION_ERROR',
        message: 'Rider name must be a non empty string',
      });
    }

    if (typeof driverName !== 'string' || driverName.length < 1) {
      return res.send({
        errorCode: 'VALIDATION_ERROR',
        message: 'Rider name must be a non empty string',
      });
    }

    if (typeof driverVehicle !== 'string' || driverVehicle.length < 1) {
      return res.send({
        errorCode: 'VALIDATION_ERROR',
        message: 'Rider name must be a non empty string',
      });
    }

    const values = [req.body.startLat, req.body.startLong,
      req.body.endLat, req.body.endLong, req.body.riderName,
      req.body.driverName, req.body.driverVehicle];

    db.run('INSERT INTO Rides(startLat, startLong, endLat, ' +
            'endLong, riderName, driverName, driverVehicle) ' +
            'VALUES (?, ?, ?, ?, ?, ?, ?)', values, function(err) {
      if (err) {
        console.log(err);
        return res.send({
          errorCode: 'SERVER_ERROR',
          message: 'Unknown error',
        });
      }

      db.all('SELECT * FROM Rides WHERE ' +
                // eslint-disable-next-line no-invalid-this
                'rideID = ?', this.lastID, function(err, rows) {
        if (err) {
          return res.send({
            errorCode: 'SERVER_ERROR',
            message: 'Unknown error',
          });
        }
        const response = {
          'status': true,
          'message': 'Created successfully',
          'data': rows[0],
        };
        res.send(response);
      });
    });
  });

  app.get('/rides', (req, res) => {
    let limit = 5;
    let search = '';
    if (req.query.search !== undefined && req.query.search > 0) {
      search = req.query.search;
    }
    if (req.query.limit !== undefined && req.query.limit > 0) {
      limit = req.query.limit;
    } else {
      return res.send({
        errorCode: 'QUERY_ERROR',
        message: 'limit is required in query',
      });
    }
    let pageNumber = 0;
    if (req.query.pageNumber !== undefined && req.query.pageNumber.length > 0) {
      pageNumber = req.query.pageNumber;
      pageNumber--;
    } else {
      return res.send({
        errorCode: 'QUERY_ERROR',
        message: 'pageNumber is required',
      });
    }
    const offset = pageNumber * limit;
    let query = '';
    if (search !== '') {
      query = `SELECT * FROM Rides LIMIT ${offset} ,${limit} 
      WHERE riderName LIKE ${search} OR driverName LIKE ${search}`;
    } else {
      query = `SELECT * FROM Rides LIMIT ${offset} ,${limit}`;
    }
    db.all(query,
        function(err, rows) {
          if (err) {
            return res.send({
              errorCode: 'SERVER_ERROR',
              message: 'Unknown error',
            });
          }

          if (rows.length === 0) {
            return res.send({
              errorCode: 'RIDES_NOT_FOUND_ERROR',
              message: 'Could not find any rides',
            });
          }
          let totalPageCount = 0;
          let hasNextPage = false;
          let mQuery = '';
          if (search !== '') {
            mQuery = `SELECT COUNT(*) FROM Rides 
      WHERE riderName LIKE ${search} OR driverName LIKE ${search}`;
          } else {
            mQuery = `SELECT COUNT(*) FROM Rides`;
          }
          db.all(mQuery,
              function(err, resp) {
                const count = resp[0]['COUNT(*)'];
                totalPageCount = count / limit;
                if (totalPageCount >= pageNumber) {
                  hasNextPage = true;
                }
                const response = {};
                response.status = true;
                response.message = 'Fetch Data Successful';
                response.metadata = {
                  'totalPageCount': totalPageCount,
                  'hasNextPage': hasNextPage,
                };
                response.data = rows;
                res.send(response);
              });
        });
  });

  app.get('/rides/:id', (req, res) => {
    db.all(`SELECT * FROM Rides WHERE rideID=
    '${req.params.id}'`, function(err, rows) {
      if (err) {
        return res.send({
          errorCode: 'SERVER_ERROR',
          message: 'Unknown error',
        });
      }

      if (rows.length === 0) {
        return res.send({
          errorCode: 'RIDES_NOT_FOUND_ERROR',
          message: 'Could not find any rides',
        });
      }

      res.send(rows);
    });
  });

  return app;
};
