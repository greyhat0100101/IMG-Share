const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/organizationController');

router.get('/', ctrl.getOrganizations);
router.post('/', ctrl.createOrganization);
router.delete('/:id', ctrl.deleteOrganization);

module.exports = router;
