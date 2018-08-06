const paymentApi = require('./payment');
const testWebhook = require('./testwebhook');

const configureRoutes = (app) => {
  testWebhook(app);
  paymentApi(app);
};

module.exports = configureRoutes;
