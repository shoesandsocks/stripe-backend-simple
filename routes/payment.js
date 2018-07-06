const fetch = require('node-fetch');

const stripe = require('../constants/stripe');
const endpoint = require('../constants/endpoint');

require('dotenv').config();

const postStripeCharge = res => (stripeErr, stripeRes) => {
  if (stripeErr) {
    res.status(500).send({ error: stripeErr });
  } else {
    res.status(200).send({ success: stripeRes });
  }
};

const sendMessageToSlack = (msg) => {
  // slack messages require a 'text' key. stringify that, with a string message as its value
  const body = JSON.stringify({ text: msg });
  return fetch(process.env.SLACK_HOOK, {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'application/json' },
  })
    .then(response => response.status)
    .then(status => ({ err: null, status }))
    .catch(err => ({ err, status: 400 }));
};

const paymentApi = (app) => {
  app.get('/', (req, res) => {
    res.send({ message: 'Hello Stripe checkout server!', timestamp: new Date().toISOString() });
  });

  app.post('/', (req, res) => {
    stripe.charges.create(req.body, postStripeCharge(res));
  });

  app.post('/newcustomer', (req, res) => {
    const cust = JSON.parse(req.body);
    try {
      return stripe.customers.create({
        email: `${cust.email}`,
        metadata: {
          firstName: cust.firstName,
          lastName: cust.lastName,
          creationInfo: cust.info || null,
        },
        description: `create customer object for ${cust.email}`,
      }, (err, customer) => {
        if (err) return res.status(400).end();
        return res.status(200).send(customer);
      });
    } catch (err) {
      console.log(err); // eslint-disable-line
      return res.status(400).end();
    }
  });

  app.post('/webhook', async (req, res) => {
    // verify: https://stripe.com/docs/webhooks/signatures
    const sig = req.headers['stripe-signature'];
    try {
      const event = stripe.webhooks.constructEvent(req.rawBody, sig, endpoint);
      const slackReply = await sendMessageToSlack(JSON.stringify(event));
      if (slackReply.status === 200) {
        return res.status(200).send('message sent to slack');
      }
      return res.status(200).send('nothing from slack');
    } catch (err) {
      console.log(err); // eslint-disable-line
      return res.status(400).end();
    }
  });

  return app;
};

module.exports = paymentApi;
