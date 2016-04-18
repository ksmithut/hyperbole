# hyperbole

[![NPM version](http://img.shields.io/npm/v/hyperbole.svg?style=flat)](https://www.npmjs.org/package/hyperbole)
[![Dependency Status](http://img.shields.io/david/ksmithut/hyperbole.svg?style=flat)](https://david-dm.org/ksmithut/hyperbole)
[![Dev Dependency Status](http://img.shields.io/david/dev/ksmithut/hyperbole.svg?style=flat)](https://david-dm.org/ksmithut/hyperbole#info=devDependencies&view=table)
[![Code Climate](http://img.shields.io/codeclimate/github/ksmithut/hyperbole.svg?style=flat)](https://codeclimate.com/github/ksmithut/hyperbole)
[![Build Status](http://img.shields.io/travis/ksmithut/hyperbole/master.svg?style=flat)](https://travis-ci.org/ksmithut/hyperbole)
[![Coverage Status](http://img.shields.io/codeclimate/coverage/github/ksmithut/hyperbole.svg?style=flat)](https://codeclimate.com/github/ksmithut/hyperbole)

Hyperbole is a Promise wrapper around the core node `http` and `https` modules.

# Installation

```bash
npm install --save hyperbole
```

# Usage

With express or other connect-like server handlers

```js
var express = require('express');
var app     = require('app');
var server  = require('hyperbole')(app, 3000);

app.use(function (req, res) {
  res.json({hello: 'world'});
});

server.start()
  .then(function () {
    console.log('Server started on port %s', server.port);
  })
  .catch(function (err) {
    console.log(err);
  });

```

To make it an https server, pass in the required options as the third parameter.

```js
var fs      = require('fs');
var express = require('express');
var app     = require('app');
var server  = require('hyperbole')(app, 443, {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
});

app.use(function (req, res) {
  res.json({hello: 'world'});
});

server.start()
  .then(function () {
    console.log('HTTPS server started on port %s', server.port);
  })
  .catch(function (err) {
    console.log(err);
  });
```

You can also have multiple servers.

```js
var fs = require('fs');
var express = require('express');
var createServer = require('hyperbole');
var app = require('app');
var httpServer = createServer(app, 80);
var httpsServer = createServer(app, 443, {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
});

// Only redirect the root
app.get('/', function (req, res, next) {
  if (!req.secure) {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});

// Send 426 "Upgrade Required" error to notify the user that they need to use
// https
app.use(function (req, res, next) {
  if (!req.secure) {
    return res.status(426).send('Switch to using https');
  }
  next();
});

app.use(function (req, res) {
  res.json({secure: true});
});

httpsServer.start()
  .then(httpServer.start)
  .then(function () {
    console.log('Both servers started');
  })
  .catch(function (err) {
    console.log(err);
  });
```

# API

The exported object is actually a `class`-like object, so technically, it's
probably better to do:

```js
var Server = require('hyperbole');
var server = new Server(app, port);
```

but for convenience, you can just use it as a function, and it will return the
new server instance.

It takes 3 arguments:

* `app` (Function) - The handler that takes in the request and response objects
to process each request. This is usually an express, koa, or connect app.
* `port` (Number/String) - The port to bind to.
* `secure` (Object) *optional* - If you want the server to be an https server,
then pass in the options object as described
[here](https://nodejs.org/api/https.html#https_https_createserver_options_requestlistener).

It returns a server instance.

Each instance has the following methods:

* `server.start()`

  Starts the server. Returns a promise with no arguments passed.

* `server.stop()`

  Stops the server. The server must have successfully started in order to stop it.

You can also access the http server object directly with `server.server` in case
you were using it for `socket.io` or something else.
