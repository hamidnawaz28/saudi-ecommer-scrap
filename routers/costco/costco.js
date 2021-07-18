var express = require("express");
var router = express.Router();
let cstScrp = require("../../scraps/costco/costco");
let costSkuFtn = require("../../scraps/costco/costcoSku")
router.get("/", async function (req, res) {
  const q = req.query;
  res.status(200).send(await cstScrp.firstOne(q));
});
router.get("/asin/:id", async function (req, res) {
  const asin = req.params.id;
  console.log("Costco asin----------->",asin);
  res.status(200).send(await costSkuFtn.firstOne(asin));
});
module.exports = router;
