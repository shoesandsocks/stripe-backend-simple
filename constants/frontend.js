const FRONTEND_DEV_URLS = ["http://localhost:8080", "http://localhost:3000"]; // TODO: for blog

const FRONTEND_PROD_URLS = [
  "https://www.pineandvine.com",
  "https://pineandvine.com",
  "https://www.rich-text.net",
  "https://dev.rich-text.net",
  "https://dev1.rich-text.net",
];

console.log(process.env.NODE_ENV);
module.exports =
  process.env.NODE_ENV === "production"
    ? FRONTEND_PROD_URLS
    : FRONTEND_DEV_URLS;
