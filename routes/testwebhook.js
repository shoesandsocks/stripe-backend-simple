require('dotenv').config();

const fetch = require('node-fetch');
const configureStripe = require('stripe');
const convert = require('../constants/convert');

const stripe = configureStripe(process.env.STRIPE_TEST_SECRET);
const testEndpoint = process.env.STRIPE_TEST_ENDPOINT_SECRET;

const sendMessageToSlack = (msg) => {
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

const testWebhookApi = (app) => {
  // TESTSTRIPE and TESTENDPOINT, instead, for test webhooks
  app.post('/testwebhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    try {
      const event = stripe.webhooks.constructEvent(req.body, sig, testEndpoint);
      const slackReply = await sendMessageToSlack(JSON.stringify(event));
      if (slackReply.status === 200) {
        res.status(200).send('message sent to slack');
      }
      res.status(200).send('nothing from slack');
    } catch (err) {
      console.log(err); // eslint-disable-line
      res.status(400).end();
    }
  });

  return app;
};

module.exports = testWebhookApi;
