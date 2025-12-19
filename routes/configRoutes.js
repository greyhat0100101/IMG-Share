const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/configController');

router.get('/', ctrl.getConfig);
router.post('/', ctrl.updateConfig);

module.exports = router;
