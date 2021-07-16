var express = require("express");
var router = express.Router();
let amzScrp = require("../../scraps/amazon/amazon");
let amzScrpSku = require("../../scraps/amazon/amazonSku");

router.get("/", async function (req, res) {
  const q = req.query;
  res.status(200).send(await amzScrp.firstOne(q));
});
router.get("/asin/:id", async function (req, res) {
  const asin = req.params.id;
  console.log("asin----------->",asin);
  res.status(200).send(await amzScrpSku.firstOne(asin));
});
module.exports = router;
