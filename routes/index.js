const paymentApi = require('./payment');
const testWebhook = require('./testwebhook');

const configureRoutes = (app) => {
  paymentApi(app);
  testWebhook(app);
};

module.exports = configureRoutes;
