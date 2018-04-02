const stripe = require('../constants/stripe');

const postStripeCharge = res => (stripeErr, stripeRes) => {
  if (stripeErr) {
    console.log(stripeErr);

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
    const chargeObject = Object.assign({}, { ...req.body }, { source: req.body.token });
    stripe.charges.create(chargeObject, postStripeCharge(res));
  });

  return app;
};

module.exports = paymentApi;
