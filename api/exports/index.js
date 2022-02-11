let { Router } = require('express');
let router = Router();

let exportConnectionsRoute = require('./exportConnections');
let exportMaterialsRoute = require('./exportMaterials');
let exportTransactionsRoute = require('./exportTransactions');

router.use('/connections', exportConnectionsRoute);
router.use('/materials', exportMaterialsRoute);
router.use('/transactions', exportTransactionsRoute);

module.exports = router;
