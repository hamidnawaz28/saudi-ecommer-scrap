var express = require("express");
var router = express.Router();
let walScrp = require("../../scraps/wallmart/walmart");
router.get("/", async function (req, res) {
  const q = req.query;
  res.status(200).send(await walScrp.firstOne(q));
});
module.exports = router;
