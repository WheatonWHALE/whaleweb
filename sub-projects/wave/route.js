var express = require('express');

var router = express.Router();

router.get('/', function(req, res) {
    res.render('wave.jade', { year: req.query.year || '2014-2015' });
});

module.exports = router;