const cors = require('cors');
const bodyParser = require('body-parser');

const CORS_WHITELIST = require('./constants/frontend');

const testOrigin = o => CORS_WHITELIST.indexOf(o) !== -1 || o === undefined;

const corsOptions = {
  origin: (origin, callback) =>
    (testOrigin(origin) ? callback(null, true) : callback(new Error('Not allowed by CORS'))),
};

// see https://github.com/stripe/stripe-node/blob/master/examples/webhook-signing/express.js
function addRawBody(req, res, next) {
  // req.setEncoding('utf8');
  let data = '';
  req.on('data', (chunk) => {
    data += chunk;
  });
  req.on('end', () => {
    req.rawBody = data;
    next();
  });
}

const configureServer = (app) => {
  app.use(cors(corsOptions));
  app.use(addRawBody);
  // app.use(bodyParser.raw({ type: '*/*' })); // see https://stripe.com/docs/webhooks
  app.use(bodyParser.json());
};

module.exports = configureServer;
