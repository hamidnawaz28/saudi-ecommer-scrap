var express = require('express');
var router = express.Router();
let amazFtn = require('../Helper/amazFtn')
router.get('/', function(req, res){
    const q = req.query
    res.status(200).send(amazFtn.firstOne(q));
});
module.exports = router;