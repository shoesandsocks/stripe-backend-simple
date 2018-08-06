require('dotenv').config();

const fetch = require('node-fetch');
const configureStripe = require('stripe');

const stripe = configureStripe(process.env.STRIPE_LIVE_SECRET);

const liveEndpoint = process.env.STRIPE_LIVE_ENDPOINT_SECRET;

const saveUser = require('../dbase/connect');
const convert = require('../constants/convert');

const postStripeCharge = res => (stripeErr, stripeRes) => {
  if (stripeErr) {
    res.status(500).send({ error: stripeErr });
  } else {
    res.status(200).send({ success: stripeRes });
  }
};

const sendMessageToSlack = (msg) => {
  // slack messages require a 'text' key. stringify that, with a string message as its value
  // and also, the convert function kinda pretty-prints the msg object, hopefully
  const body = JSON.stringify({ text: convert(msg) });
  return fetch(process.env.SLACK_HOOK, {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'application/json' },
  })
    .then(response => response.status)
    .then(status => ({ err: null, status }))
    .catch(err => ({ err, status: 242 }));
};

const paymentApi = (app) => {
  app.get('/', (req, res) => {
    res.send({ message: 'Hello Stripe checkout server!', timestamp: new Date().toISOString() });
  });

  app.post('/', (req, res) => {
    stripe.charges.create(req.body, postStripeCharge(res));
  });

  app.post('/createsubscription', (req, res) => {
    const body = JSON.parse(req.body);
    stripe.subscriptions.create({
      customer: body.customer,
      items: [
        {
          plan: body.plan, // plan_DBMUBdi4za2guX
        },
      ],
    }, (err, subscription) => {
      if (!err) {
        return res.json(subscription);
      }
      return res.status(400).end();
    });
  });

  app.get('/getcustomers', (req, res) => {
    stripe.customers.list({}, async (err, customers) => {
      if (!err) {
        // console.log(customers);
        return res.json({ customers: customers.data });
      }
      return res.status(400).end();
    });
  });

  app.post('/newcustomer', (req, res) => {
    const cust = JSON.parse(req.body);
    const source = cust.token !== null ? cust.token.id : null;
    const userObjectToSave = {
      firstName: cust.firstName,
      lastName: cust.lastName,
      email: cust.email,
      stripe_id: null,
    };
    if (source) {
      try {
        return stripe.customers.create({
          description: `create customer object for ${cust.email}`,
          source, // N.B. only the ID here, not the whole token.
          email: `${cust.email}`,
          metadata: {
            firstName: cust.firstName,
            lastName: cust.lastName,
          },
        }, (err, customer) => {
          // console.log({ err, customer });
          if (err) return res.status(400).json({ err });
          userObjectToSave.stripe_id = customer.id;
          saveUser(userObjectToSave);
          return res.status(200).json({ customer });
        });
      } catch (err) {
        console.log(err); // eslint-disable-line
        return res.status(400).json({ err });
      }
    } else {
      try {
        saveUser(userObjectToSave);
        return res.status(200).json({ userObjectToSave });
      } catch (mlabError) {
        console.log(err); // eslint-disable-line
        return res.status(400).json({ err: mlabError });
      }
    }
  });

  app.post('/webhook', async (req, res) => {
    // verify: https://stripe.com/docs/webhooks/signatures
    const sig = req.headers['stripe-signature'];
    try {
      const event = stripe.webhooks.constructEvent(req.body, sig, liveEndpoint);
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
