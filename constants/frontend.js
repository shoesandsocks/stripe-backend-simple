const FRONTEND_DEV_URLS = [
  'http://localhost:3000',
  'http://localhost:8000',
  'https://f9000564.ngrok.io',
]; // TODO: for blog

const FRONTEND_PROD_URLS = [
  'https://www.pineandvine.com',
  'https://pineandvine.com',
];

module.exports = process.env.NODE_ENV === 'production' ? FRONTEND_PROD_URLS : FRONTEND_DEV_URLS;
