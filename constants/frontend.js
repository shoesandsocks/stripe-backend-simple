const FRONTEND_DEV_URLS = ["http://localhost:8080"]; // TODO: for blog

const FRONTEND_PROD_URLS = [
  "https://www.pineandvine.com",
  "https://pineandvine.com",
  "https://www.rich-text.net",
  "https://b76bf8f9.ngrok.io",
];

module.exports =
  process.env.NODE_ENV === "production"
    ? FRONTEND_PROD_URLS
    : FRONTEND_DEV_URLS;
