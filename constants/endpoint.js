require('dotenv').config();

const STRIPE_ENDPOINT_SECRET =
  process.env.NODE_ENV === 'production'
    ? process.env.STRIPE_LIVE_ENDPOINT_SECRET
    : process.env.STRIPE_TEST_ENDPOINT_SECRET;

const endpoint = STRIPE_ENDPOINT_SECRET;

module.exports = endpoint;
