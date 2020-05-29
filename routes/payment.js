require("dotenv").config();

const fetch = require("node-fetch");
const configureStripe = require("stripe");

const STRIPE_SECRET_KEY =
  process.env.NODE_ENV === "production"
    ? process.env.STRIPE_LIVE_SECRET
    : process.env.STRIPE_TEST_SECRET;

const STRIPE_SECRET_ENDPOINT =
  process.env.NODE_ENV === "production"
    ? process.env.STRIPE_LIVE_ENDPOINT_SECRET
    : process.env.STRIPE_TEST_ENDPOINT_SECRET;

const stripe = configureStripe(STRIPE_SECRET_KEY);
const liveEndpoint = STRIPE_SECRET_ENDPOINT;
// console.log(Object.keys(stripe));
// const publishableKey =
//   process.env.NODE_ENV === "production"
//     ? "pk_live_LOHrtxPBcZ5LnlG9KeCV6e9H"
//     : "pk_test_QBxssu5Kyu68z5R3grsjBgO0";

// const saveUser = require("../dbase/connect");
const convert = require("../constants/convert");

const sendMessageToSlack = (msg) => {
  // slack messages require a 'text' key. stringify that, with a string message as its value
  // and also, the convert function kinda pretty-prints the msg object, hopefully
  const body = JSON.stringify({ text: convert(msg) });
  return fetch(process.env.SLACK_HOOK, {
    method: "POST",
    body,
    headers: { "Content-Type": "application/json" },
  })
    .then((response) => response.status)
    .then((status) => ({ err: null, status }))
    .catch((err) => ({ err, status: 242 }));
};

const paymentApi = (app) => {
  app.get("/", (req, res) => {
    return res.send({
      message: "Hello Stripe checkout server!",
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/intent", async (req, res) => {
    // const { items, currency } = req.body;

    // in practice, get string from client, convert
    // to an amount here, and send client_secret back
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1099,
      currency: "USD",
    });
    // sendMessageToSlack(`created a paymentIntent on server`);
    return res.json({ client_secret: paymentIntent.client_secret });
  });

  app.post("/webhook", async (req, res) => {
    // verify: https://stripe.com/docs/webhooks/signatures
    const sig = req.headers["stripe-signature"];
    try {
      const event = stripe.webhooks.constructEvent(req.body, sig, liveEndpoint);
      const slackReply = await sendMessageToSlack(JSON.stringify(event));
      if (slackReply.status === 200) {
        return res.status(200).send("message sent to slack");
      }
      return res.status(200).send("nothing from slack");
    } catch (err) {
      console.log(err); // eslint-disable-line
      return res.status(400).end();
    }
  });

  return app;
};

module.exports = paymentApi;
