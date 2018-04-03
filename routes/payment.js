const stripe = require('../constants/stripe');

const postStripeCharge = res => (stripeErr, stripeRes) => {
  if (stripeErr) {
    res.status(500).send({ error: stripeErr });
  } else {
    res.status(200).send({ success: stripeRes });
  }
};

const paymentApi = (app) => {
  app.get('/', (req, res) => {
    res.send({ message: 'Hello Stripe checkout server!', timestamp: new Date().toISOString() });
  });

  app.post('/', (req, res) => {
    stripe.charges.create(req.body, postStripeCharge(res));
  });

  app.post('/webhook', (req, res) => {
    console.log(req.body);
    res.status(200).send('okay!');
  });

  return app;
};

module.exports = paymentApi;
