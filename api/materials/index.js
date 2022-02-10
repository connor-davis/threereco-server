let { Router } = require('express');
let router = Router();

let addMaterialRoute = require('./addMaterial');
let editMaterialRoute = require('./editMaterial');
let deleteMaterialRoute = require('./deleteMaterial');
let getMaterialsRoute = require('./getMaterials');

router.use('/add', addMaterialRoute);
router.use('/edit', editMaterialRoute);
router.use('/delete', deleteMaterialRoute);
router.use('/get', getMaterialsRoute);

module.exports = router;
