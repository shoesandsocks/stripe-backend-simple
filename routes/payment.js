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

const publishableKey =
  process.env.NODE_ENV === "production"
    ? "pk_live_LOHrtxPBcZ5LnlG9KeCV6e9H"
    : "pk_test_QBxssu5Kyu68z5R3grsjBgO0";

const saveUser = require("../dbase/connect");
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
    res.send({
      message: "Hello Stripe checkout server!",
      timestamp: new Date().toISOString(),
    });
  });

  app.post("/", async (req, res) => {
    console.log("handling POST");
    // const obj = JSON.parse(req.body); // FIXME: this is a bad idea. hackable from F.E.
    // Token is created using Stripe Checkout or Elements!
    // Get the payment token ID submitted by the form:
    const token = req.body.stripeToken; // Using Express

    const charge = await stripe.charges.create({
      amount: 999,
      currency: "usd",
      description: "Example charge",
      source: token,
    });
    if (charge.object !== "charge") {
      res.json({ error: charge.error });
    } else {
      res.json({ message: "success" });
    }
    // return stripe.charges.create({ ...obj })
    //   .then(() => {
    //     console.log('good');
    //     res.status(200).json({ response: 'done!' });
    //   })
    //   .catch(() => {
    //     console.log('bad');
    //     res.status(500).json({ response: 'payment failed' });
    //   });
  });

  app.get("/create-payment-intent", async (req, res) => {
    // const { items, currency } = req.body;
    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1099,
      currency: "USD",
    });

    // Send publishable key and PaymentIntent details to client
    res.send({
      publishableKey,
      clientSecret: paymentIntent.client_secret,
    });
  });

  app.post("/createsubscription", (req, res) => {
    const body = JSON.parse(req.body);
    stripe.subscriptions.create(
      {
        customer: body.customer,
        items: [
          {
            plan: body.plan, // plan_DBMUBdi4za2guX
          },
        ],
      },
      (err, subscription) => {
        if (!err) {
          return res.json(subscription);
        }
        return res.status(400).end();
      }
    );
  });

  app.get("/getcustomers", (req, res) => {
    stripe.customers.list({}, async (err, customers) => {
      if (!err) {
        // console.log(customers);
        return res.json({ customers: customers.data });
      }
      return res.status(400).end();
    });
  });

  app.post("/newcustomer", (req, res) => {
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
        return stripe.customers.create(
          {
            description: `create customer object for ${cust.email}`,
            source, // N.B. only the ID here, not the whole token.
            email: `${cust.email}`,
            metadata: {
              firstName: cust.firstName,
              lastName: cust.lastName,
            },
          },
          (err, customer) => {
            // console.log({ err, customer });
            if (err) return res.status(400).json({ err });
            userObjectToSave.stripe_id = customer.id;
            saveUser(userObjectToSave);
            return res.status(200).json({ customer });
          }
        );
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
