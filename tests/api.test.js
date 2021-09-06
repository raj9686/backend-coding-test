'use strict';

const request = require('supertest');
const assert = require('assert');

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

const app = require('../src/app')(db);
const buildSchemas = require('../src/schemas');

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
                .expect(200)
                .expect((res) => {
                    assert(res.body.errorCode === 'RIDES NOT FOUND ERROR');
                })
                .end(done);
        });

        it('should return server error', (done) => {
            request(app)
                .get('/rides')
                .expect(200)
                .expect((res) => {
                    assert(res.body.errorCode === 'RIDES NOT FOUND ERROR');
                })
                .end(done);
        });

        it('should return fine', (done) => {
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
                .expect(200)
                .then((res) => {
                    request(app)
                        .get(`/rides`)
                        .expect(200)
                        .expect((getResponse) => {
                            assert(getResponse.body[0].rideID === res.body.rideID);
                        })
                        .end(done);
                });
        });
    });

    describe('GET /rides/{id}', () => {
        it('should return not found', (done) => {
            request(app)
                .get('/rides/1')
                .expect(200)
                .expect((res) => {
                    assert(res.body.errorCode === 'RIDES NOT FOUND ERROR');
                })
                .end(done);
        });

        it('should return fine', (done) => {
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
                .expect(200)
                .then((res) => {
                    request(app)
                        .get(`/rides/${res.body.rideID}`)
                        .expect(200)
                        .expect((getResponse) => {
                            // console.log(getResponse);
                            assert(getResponse.body.rideID === res.body.rideID);
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
                    "startLat": 90,
                    "startLong": 100,
                    "endLat": 45,
                    "endLong": 65,
                    "riderName": "Bob Marakis",
                    "driverName": "Joy Walter",
                    "driverVehicle": "XD054585"
                })
                .set('Content-Type', 'application/json')
                .expect(200)
                .expect((res) => {
                    assert(res.body.rideID != null);
                })
                .end(done);
        });

        it('should fail with invalid initial position', (done) => {
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
                .expect((res) => {
                    assert(res.body.errorCode === 'VALIDATION ERROR');
                })
                .end(done);
        });

        it('should fail with invalid final position', (done) => {
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
                .expect((res) => {
                    assert(res.body.errorCode === 'VALIDATION ERROR');
                })
                .end(done);
        });

        it('should fail with invalid rider\'s name', (done) => {
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
                .expect((res) => {
                    assert(res.body.errorCode === 'VALIDATION ERROR');
                })
                .end(done);
        });

        it('should fail with invalid driver\'s name', (done) => {
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
                .expect((res) => {
                    assert(res.body.errorCode === 'VALIDATION ERROR');
                })
                .end(done);
        });

        it('should fail with invalid driver\'s name', (done) => {
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
                .expect((res) => {
                    assert(res.body.errorCode === 'VALIDATION ERROR');
                })
                .end(done);
        });
    });
});