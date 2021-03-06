'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.io = exports.server = undefined;

var _path = require('path');

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _expressJwt = require('express-jwt');

var _expressJwt2 = _interopRequireDefault(_expressJwt);

var _expressGraphql = require('express-graphql');

var _expressGraphql2 = _interopRequireDefault(_expressGraphql);

var _socket = require('socket.io');

var _socket2 = _interopRequireDefault(_socket);

var _amqplib = require('amqplib');

var _amqplib2 = _interopRequireDefault(_amqplib);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _expressHistoryApiFallback = require('express-history-api-fallback');

var _expressHistoryApiFallback2 = _interopRequireDefault(_expressHistoryApiFallback);

var _compression = require('compression');

var _compression2 = _interopRequireDefault(_compression);

var _cors = require('cors');

var _cors2 = _interopRequireDefault(_cors);

var _morgan = require('morgan');

var _morgan2 = _interopRequireDefault(_morgan);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _routes = require('./routes');

var _graphql = require('./graphql');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const app = (0, _express2.default)();
const root = (0, _path.join)(__dirname, '../public');

app.set('port', process.env.PORT || 3000);
app.set('mongodb-uri', process.env.MONGODB_URI || 'mongodb://web-go:web-go@ds133961.mlab.com:33961/web-go-demo');
app.set('secret', process.env.SECRET || 'webgo');

_mongoose2.default.connect(app.get('mongodb-uri'));
_mongoose2.default.connection.on('error', console.error.bind(console, 'connection error:'));
_mongoose2.default.connection.once('open', () => console.log('DB: Connection Succeeded.'));

app.use((0, _compression2.default)());
app.use((0, _cors2.default)());
app.use((0, _morgan2.default)('tiny'));
app.use(_bodyParser2.default.json());
app.use(_bodyParser2.default.urlencoded({ extended: false }));

app.use((0, _expressJwt2.default)({ secret: Buffer.from(app.get('secret'), 'base64'), credentialsRequired: false }));

app.use('/__/graphql', (0, _expressGraphql2.default)(() => ({
  schema: _graphql.schema,
  rootValue: _graphql.rootValue,
  graphiql: true
})));

app.use('/__/list', _routes.listRoutes);

app.use(_express2.default.static(root));
app.use((0, _expressHistoryApiFallback2.default)('index.html', { root }));

const server = app.listen(app.get('port'), () => {
  console.log('App: Bootstrap Succeeded.');
  console.log(`Port: ${app.get('port')}.`);
});

const io = _socket2.default.listen(server);

io.on('connection', socket => {
  console.log('WS: Establish a connection.');
  socket.on('disconnect', () => console.log('WS: Disconnected'));

  socket.emit('A', { foo: 'bar' });
  socket.on('B', data => console.log(data));
});

_amqplib2.default.connect('amqp://gnnwevxx:V1PhfxZSO_-CJ6agZGipEBVmFX508N0P@black-boar.rmq.cloudamqp.com/gnnwevxx').then(conn => {
  process.once('SIGINT', () => conn.close());

  return conn.createChannel().then(channel => {
    let ok = channel.assertQueue('hello', { durable: false });

    ok = ok.then(() => {
      return channel.consume('hello', msg => {
        console.log(" [x] Received '%s'", msg.content.toString());
      }, { noAck: true });
    });

    return ok.then(() => {
      console.log(' [*] Waiting for messages. To exit press CTRL + C.');
    });
  });
}).catch(console.warn);

exports.server = server;
exports.io = io;