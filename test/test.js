'use strict';


process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var path          = require('path');
var fs            = require('fs');
var expect        = require('chai').expect;
var express       = require('express');
var Promise       = require('bluebird');
var port          = 3001;
var securePort    = 3002;
var supertest     = require('supertest-as-promised');
var request       = supertest('http://localhost:' + port);
var secureRequest = supertest('https://localhost:' + securePort);
var Server        = require('../');

var sslOptions = {
  key: fs.readFileSync(path.join(__dirname, 'fixtures', 'server.key')),
  cert: fs.readFileSync(path.join(__dirname, 'fixtures', 'server.crt'))
};

var app = express();
app.get('/', function (req, res) {
  res.send('home');
});
app.use(function (req, res) {
  res.status(404).send('not found');
});

describe('hyperbole', function () {

  it('should start and stop a server', function () {
    var server = new Server(app, port);
    return server.start()
      .then(function () {
        return request.get('/')
          .expect(200)
          .expect('home');
      })
      .then(function () {
        return server.stop();
      })
      .then(function () {
        return request.get('/');
      })
      .then(function () {
        throw new Error('ECONNREFUSED should have happened');
      })
      .catch(function (err) {
        expect(err.message).to.be.equal('connect ECONNREFUSED');
      });
  });

  it('should start https server', function () {
    var server = new Server(app, securePort, sslOptions);
    return server.start()
      .then(function () {
        return secureRequest.get('/')
          .expect(200)
          .expect('home');
      })
      .then(function () {
        return server.stop();
      });
  });

  it('should use it as a function (without new)', function () {
    var server = require('../')(app, port);
    return server.start()
      .then(function () {
        return request.get('/')
          .expect(200)
          .expect('home');
      })
      .then(function () {
        return server.stop();
      });
  });

  it('should fail if .stop() is called when server is not up', function () {
    var server = new Server(app, port);
    return server.stop()
      .then(function () {
        throw new Error('error should have happened');
      })
      .catch(function (err) {
        expect(err.message).to.be.equal('Not running');
      });
  });

  it('should be able to run more than one server', function () {
    var http = new Server(app, port);
    var https = new Server(app, securePort, sslOptions);
    return http.start()
      .then(function () {
        return https.start();
      })
      .then(function () {
        return request.get('/')
          .expect(200)
          .expect('home');
      })
      .then(function () {
        return secureRequest.get('/')
          .expect(200)
          .expect('home');
      })
      .then(function () {
        return http.stop();
      })
      .then(function () {
        return https.stop();
      });
  });

  it('should throw error if context was lost', function () {
    var server = new Server(app, port);
    return Promise.resolve()
      .then(server.start)
      .then(function () {
        throw new Error('should have failed');
      })
      .catch(function (err) {
        expect(err.message).to.be
          .equal('Context was lost when calling server.start');
      })
      .then(server.stop)
      .then(function () {
        throw new Error('should have failed');
      })
      .catch(function (err) {
        expect(err.message).to.be
          .equal('Context was lost when calling server.stop');
      });
  });

});
