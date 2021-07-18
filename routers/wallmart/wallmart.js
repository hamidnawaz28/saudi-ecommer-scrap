var express = require("express");
var router = express.Router();
let walScrp = require("../../scraps/wallmart/walmart");
let walScrpSku = require("../../scraps/wallmart/walmartSku")
router.get("/", async function (req, res) {
  const q = req.query;
  res.status(200).send(await walScrp.firstOne(q));
});
router.get("/asin/:id", async function (req, res) {
  const id = req.params.id;
  console.log("walmart id----------->",id);
  res.status(200).send(await walScrpSku.firstOne(id));
});
module.exports = router;
