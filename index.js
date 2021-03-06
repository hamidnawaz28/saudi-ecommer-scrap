var express = require("express");
var cors = require("cors");
var app = express();

var corsOptions = {
  origin: "http://example.com",
};
app.use(cors(corsOptions));

var amazon = require("./routers/amazon/amazon");
var costco = require("./routers/costco/costco");
var wallmart = require("./routers/wallmart/wallmart");

app.use("/amazon", amazon);
app.use("/costco", costco);
app.use("/walmart", wallmart);
const port = process.env.PORT || 3002;
app.listen(port);
