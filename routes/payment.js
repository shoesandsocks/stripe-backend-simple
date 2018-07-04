const stripe = require('../constants/stripe');
const fetch = require('node-fetch');

require('dotenv').config();

const postStripeCharge = res => (stripeErr, stripeRes) => {
  if (stripeErr) {
    res.status(500).send({ error: stripeErr });
  } else {
    res.status(200).send({ success: stripeRes });
  }
};

const slackHook = process.env.SLACK_HOOK;

const sendMessageToSlack = (msg) => {
  // slack messages require a 'text' key. stringify that, with stringed message as its value
  const jMesg = JSON.stringify({ text: msg });
  return fetch(slackHook, {
    method: 'POST',
    body: jMesg,
    headers: { 'Content-Type': 'application/json' },
  })
    .then((response) => response.status)
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

  app.post('/webhook', async (req, res) => {
    // pretty hacky. stringify req body into a mess of text, send that to slack function
    const slackReply = await sendMessageToSlack(JSON.stringify(req.body));
    if (slackReply.status === 200) {
      return res.status(200).send('message sent to slack');
    }
    return res.status(200).send('nothing from slack');
  });

  return app;
};

module.exports = paymentApi;
