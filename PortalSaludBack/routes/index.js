var express = require('express');
var router = express.Router();

router.get('/', (req, res) => {
  console.log('Hello World!')
  return res.send('Hello World!')
})

module.exports = router;
