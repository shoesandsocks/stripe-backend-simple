const express = require("express");

const configureServer = require("./server");
const configureRoutes = require("./routes");

const app = express();
const port = process.env.PORT || 8080;

configureServer(app);
configureRoutes(app);

app.listen(port, (error) => {
  if (error) throw error;
  console.log(`Server running on port: ${port} in ${process.env.NODE_ENV}`);
});
