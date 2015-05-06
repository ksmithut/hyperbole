'use strict';

var http = require('http');
var https = require('https');
var Promise = Promise || require('bluebird');

function Server(app, port, secure) {
  // This allows you to use it as a function
  if (!Server.isServer(this)) {
    return new Server(app, port, secure);
  }

  this.server = (secure)
    ? https.createServer(secure, app)
    : http.createServer(app);

  // Make port only a getter so it can't be modified
  Object.defineProperty(this, 'port', {get: function () {
    return port;
  }});

}

Server.prototype.start = function start() {
  return new Promise(function (resolve, reject) {
    if (!Server.isServer(this)) {
      return reject(new Error('Context was lost when calling server.start'));
    }
    this.server.listen(this.port)
      .on('listening', resolve)
      .on('error', reject);
  }.bind(this));
};

Server.prototype.stop = function stop() {
  return new Promise(function (resolve, reject) {
    if (!Server.isServer(this)) {
      return reject(new Error('Context was lost when calling server.stop'));
    }
    this.server.close(function (err) {
      if (err) { return reject(err); }
      this.server.removeAllListeners('listening');
      this.server.removeAllListeners('error');
      resolve();
    }.bind(this));
  }.bind(this));
};

Server.isServer = function (context) {
  return context instanceof Server;
};

module.exports = Server;
