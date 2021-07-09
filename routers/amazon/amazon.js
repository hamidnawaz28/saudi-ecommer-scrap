var express = require("express");
var router = express.Router();
let amzScrp = require("../../scraps/amazon/amazon");
router.get("/", async function (req, res) {
  const q = req.query;
  res.status(200).send(await amzScrp.firstOne(q));
});
module.exports = router;
