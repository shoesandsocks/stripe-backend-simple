const configureStripe = require('stripe');

require('dotenv').config();

// same problem here TODO:

const STRIPE_SECRET_KEY =
  process.env.NODE_ENV === 'production'
    ? process.env.STRIPE_TEST_SECRET
    : process.env.STRIPE_TEST_SECRET;

const stripe = configureStripe(STRIPE_SECRET_KEY);

module.exports = stripe;
