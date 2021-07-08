var express = require("express");
var cors = require("cors");
var app = express();
var corsOptions = {
  origin: "http://example.com",
};
app.use(cors(corsOptions));
var amazon = require("./Routers/amazon");
app.use("/amazon", amazon);
app.listen(3001);
