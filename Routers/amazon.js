var express = require("express");
var router = express.Router();
let amazonScrap = require("../Helper/amazon");
router.get("/", async function (req, res) {
  const q = req.query;
  res.status(200).send(await amazonScrap.firstOne(q));
});
module.exports = router;
