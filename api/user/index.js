let { Router } = require('express');
let router = Router();

let deleteUserRoute = require('./deleteUser');
let editUserRoute = require('./editUser');
let getUsersRoute = require('./getUsers');

router.use('/delete', deleteUserRoute);
router.use('/edit', editUserRoute);
router.use('/get', getUsersRoute);

module.exports = router;
