'use strict';

const request = require('supertest');
const assert = require('chai').assert;
const _ = require('lodash');
const {loggers} = require("winston");

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

const app = require('../src/app')(db);
const buildSchemas = require('../src/utils/databaseWrapper').buildSchemas;

const prepareData = async function() {
  const data = {
      "startLat": 90,
      "startLong": 100,
      "endLat": 45,
      "endLong": 65,
      "riderName": "Bob Marakis",
      "driverName": "Joy Walter",
      "driverVehicle": "XD054585"
  };
  const values = [data.start_lat, data.start_long,
    data.end_lat, data.end_long, data.rider_name,
    data.driver_name, data.driver_vehicle];
  _.times(15, () => {
    db.run('INSERT INTO Rides(startLat, startLong,' +
            'endLat, endLong, riderName, driverName, driverVehicle) VALUES' +
            '(?, ?, ?, ?, ?, ?, ?)', values, function(err) {
      if (err) {
        return err;
      }
    });
  });
};


describe('API tests', () => {
  before((done) => {
    db.serialize((err) => {
      if (err) {
        return done(err);
      }
      buildSchemas(db);
      done();
    });
  });

  describe('GET /health', () => {
    it('should return health', (done) => {
      request(app)
          .get('/health')
          .expect('Content-Type', /text/)
          .expect(200, done);
    });
  });

  describe('GET /rides', () => {
    it('should return not found', (done) => {
      request(app)
          .get('/rides')
          .expect(404)
          .expect((res) => {
            assert.strictEqual(res.body.error_code, 'RESOURCE_NOT_FOUND');
          })
          .end(done);
    });

    it('should return all rides', (done) => {
      request(app)
          .post('/rides')
          .send({
              "startLat": 90,
              "startLong": 100,
              "endLat": 45,
              "endLong": 65,
              "riderName": "Bob Marakis",
              "driverName": "Joy Walter",
              "driverVehicle": "XD054585"
          })
          .set('Content-Type', 'application/json')
          .expect(201)
          .then((res) => {
              request(app)
                  .get(`/rides`)
                  .query({ limit: 1,pageNumber:1 })
                  .expect(200)
                  .expect((getResponse) => {
                      console.log("getResponse",getResponse)
                      assert(getResponse.body.status);
                  })
                  .end(done);
          });
    });
  });

  describe('GET /rides pagination', () => {
    it('should fail with invalid page and size', (done) => {
      request(app)
          .get('/rides')
          .query({
            'limit': 'abc',
            'pageNumber': 'abc',
          })
          .expect(400)
          .expect((res) => {
            assert.strictEqual(res.body.error_code, 'VALIDATION_ERROR');
          })
          .end(done);
    });

    it('should fail with negative page and size', (done) => {
      request(app)
          .get('/rides')
          .query({
            'limit': -1,
            'pageNumber': -1,
          })
          .expect(400)
          .expect((res) => {
            assert.strictEqual(res.body.error_code, 'VALIDATION_ERROR');
          })
          .end(done);
    });

    it('should use default value if not given', (done) => {
        request(app)
            .post('/rides')
            .send({
                "startLat": 70,
                "startLong": 100,
                "endLat": 75,
                "endLong": 110,
                "riderName": "Rajesh",
                "driverName": "Roy Miller",
                "driverVehicle": "GJ05RM4297"
            })
            .set('Content-Type', 'application/json')
            .expect(201)
            .then((res) => {
                request(app)
                    .get('/rides')
                    .expect(200)
                    .expect((res) => {
                        assert.strictEqual(res.body.status,true);
                    })
                    .end(done);
            });

    });
  });

  describe('GET /rides/{id}', () => {
    it('should return not found', (done) => {
      request(app)
          .get('/rides/99')
          .expect(404)
          .expect((res) => {
            assert.strictEqual(res.body.error_code, 'RESOURCE_NOT_FOUND');
          })
          .end(done);
    });

    it('should return ride', (done) => {
      request(app)
          .post('/rides')
          .send({
              "startLat": 70,
              "startLong": 100,
              "endLat": 75,
              "endLong": 110,
              "riderName": "Rajesh",
              "driverName": "Roy Miller",
              "driverVehicle": "GJ05RM4297"
          })
          .set('Content-Type', 'application/json')
          .expect(201)
          .then((res) => {
            request(app)
                .get(`/rides/${res.body.data.rideID}`)
                .expect(200)
                .expect((getResponse) => {
                  // console.log(getResponse);
                  assert.strictEqual(getResponse.body.rideID, res.body.data.rideID);
                })
                .end(done);
          });
    });
  });

  describe('POST /rides', () => {
    it('should create ride successfully', (done) => {
      request(app)
          .post('/rides')
          .send({
              "startLat": 70,
              "startLong": 100,
              "endLat": 75,
              "endLong": 110,
              "riderName": "Rajesh",
              "driverName": "Roy Miller",
              "driverVehicle": "GJ05RM4297"
          })
          .set('Content-Type', 'application/json')
          .expect(201)
          .expect((res) => {
            assert.strictEqual(res.body.status,true);
          })
          .end(done);
    });

    it('should fail with invalid initial position', (done) => {
      request(app)
          .post('/rides')
          .send({
            'startLat': 200,
            'startLong': 200,
            'endLat': 110,
            'endLong': 75,
            'riderName': 'Rajesh',
            'driverName': 'Roy Miller',
            'driverVehicle': 'GJ05RM4297'
          })
          .set('Content-Type', 'application/json')
          .expect(400)
          .expect((res) => {
            assert.strictEqual(res.body.error_code, 'VALIDATION_ERROR');
          })
          .end(done);
    });

    it('should fail with invalid final position', (done) => {
      request(app)
          .post('/rides')
          .send({
            'startLat': 100,
            'startLong': 70,
            'endLat': 200,
            'endLong': 200,
              'riderName': 'Rajesh',
              'driverName': 'Roy Miller',
              'driverVehicle': 'GJ05RM4297'
          })
          .set('Content-Type', 'application/json')
          .expect(400)
          .expect((res) => {
            assert.strictEqual(res.body.error_code, 'VALIDATION_ERROR');
          })
          .end(done);
    });

    it('should fail with invalid rider\'s name', (done) => {
      request(app)
          .post('/rides')
          .send({
              'startLat': 100,
              'startLong': 70,
              'endLat': 110,
              'endLong': 70,
              'riderName': '',
              'driverName': 'Roy Miller',
              'driverVehicle': 'GJ05RM4297'
          })
          .set('Content-Type', 'application/json')
          .expect(400)
          .expect((res) => {
            assert.strictEqual(res.body.error_code, 'VALIDATION_ERROR');
          })
          .end(done);
    });

    it('should fail with invalid driver\'s name', (done) => {
      request(app)
          .post('/rides')
          .send({
              'startLat': 100,
              'startLong': 70,
              'endLat': 110,
              'endLong': 70,
              'riderName': 'Raj',
              'driverName': '',
              'driverVehicle': 'GJ05RM4297'
          })
          .set('Content-Type', 'application/json')
          .expect(400)
          .expect((res) => {
            assert.strictEqual(res.body.error_code, 'VALIDATION_ERROR');
          })
          .end(done);
    });

    it('should fail with invalid driver\'s vehicle', (done) => {
      request(app)
          .post('/rides')
          .send({
              'startLat': 100,
              'startLong': 70,
              'endLat': 110,
              'endLong': 70,
              'riderName': 'Raj',
              'driverName': 'Sita',
              'driverVehicle': ''
          })
          .set('Content-Type', 'application/json')
          .expect(400)
          .expect((res) => {
            assert.strictEqual(res.body.error_code, 'VALIDATION_ERROR');
          })
          .end(done);
    });
      it('should not delete the DB', (done) => {
          request(app)
              .post('/rides')
              .send({
                  'startLat': 100,
                  'startLong': 70,
                  'endLat': 110,
                  'endLong': 75,
                  'riderName': 'DROP TABLE Rides',
                  'driverName': 'SaniTize this?><:)(*)',
                  'driverVehicle': 'GJ05RM4297',
              })
              .set('Content-Type', 'application/json')
              .expect(201)
              .expect((res) => {
                  assert.isNotNull(res.body.rideID);
                  assert.strictEqual(res.body.driverName, 'SaniTize this');
              })
              .end(done);
      });
  });
});
