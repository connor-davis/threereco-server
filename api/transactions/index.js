let { Router } = require('express');
let router = Router();

let addTransactionRoute = require('./addTransaction');
let editTransactionRoute = require('./editTransaction');
let deleteTransactionRoute = require('./deleteTransaction');
let getTransactionsRoute = require('./getTransactions');

router.use('/add', addTransactionRoute);
router.use('/edit', editTransactionRoute);
router.use('/delete', deleteTransactionRoute);
router.use('/get', getTransactionsRoute);

module.exports = router;
