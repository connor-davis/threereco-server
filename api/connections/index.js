let { Router } = require('express');
let router = Router();

let addConnectionRoute = require('./addConnection');
let deleteConnectionRoute = require('./deleteConnection');
let getConnectionsRoute = require('./getConnections');

router.use('/add', addConnectionRoute);
router.use('/delete', deleteConnectionRoute);
router.use('/get', getConnectionsRoute);

module.exports = router;
