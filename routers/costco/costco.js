var express = require("express");
var router = express.Router();
let cstScrp = require("../../scraps/costco/costco");
router.get("/", async function (req, res) {
  const q = req.query;
  res.status(200).send(await cstScrp.firstOne(q));
});
module.exports = router;
