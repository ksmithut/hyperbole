'use strict';

var http = require('http');
var https = require('https');
var Promise = Promise || require('bluebird');

function Server(app, port, secure) {
  // This allows you to use it as a function
  if (!(this instanceof Server)) { return new Server(app, port, secure); }

  var server = (secure)
    ? https.createServer(secure, app)
    : http.createServer(app);

  // Make port only a getter so it can't be modified
  Object.defineProperties(this, {
    port: {value: port},
    server: {value: server},
    start: {value: function start() {
      resetListeners(server);
      return new Promise(function (resolve, reject) {
        server.listen(port)
          .on('listening', resolve)
          .on('error', reject);
      });
    }},
    stop: {value: function stop() {
      resetListeners(server);
      return Promise.fromNode(function (cb) {
        server.close(cb);
      });
    }}
  });

}

function resetListeners(server) {
  server.removeAllListeners('listening');
  server.removeAllListeners('error');
  server.removeAllListeners('close');
}

module.exports = Server;
