var express = require("express");
var router = express.Router();
let amzScrp = require("../../scraps/amazon/amazon");
let amzScrpSku = require("../../scraps/amazon/amazonSku");

router.get("/", async function (req, res) {
  const q = req.query;
  res.status(200).send(await amzScrp.firstOne(q));
});
router.get("/:id", async function (req, res) {
  const sku = req.params.id;
  res.status(200).send(await amzScrpSku.firstOne(sku));
});
module.exports = router;
