const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/albumController');

router.get('/org/:organizationId', ctrl.getAlbumsByOrganization);
router.post('/', ctrl.createAlbum);
router.delete('/:id', ctrl.deleteAlbum);

module.exports = router;
