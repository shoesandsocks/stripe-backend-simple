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
    console.log(req.body);
    const chargeObject = Object.assign({}, ...req.body, { source: req.body.token });
    console.log(chargeObject);
    stripe.charges.create(chargeObject, postStripeCharge(res));
  });

  return app;
};

module.exports = paymentApi;
