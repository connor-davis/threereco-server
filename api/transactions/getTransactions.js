let { Router } = require('express');
let router = Router();
let r = require('rethinkdb');
let logger = require('../../utils/logger.js');
let moment = require('moment');

router.get('/', async (request, response) => {
  let m1 = moment();
  let operationStarted =
    m1.milliseconds() +
    1000 * (m1.seconds() + 60 * (m1.minutes() + 60 * m1.hours()));

  let devmode = process.env.DEV_MODE;
let connection = devmode ? await r.connect() : await r.connect(process.env.RETHINK);

  r.db('threereco')
    .table('userTransactions')
    .run(connection, async (error, result) => {
      let data = await result.toArray();

      data = data.filter(
        (d) =>
          d.purchaser.id === request.user.id || d.seller.id == request.user.id
      );

      let m2 = moment();
      let operationEnded =
        m2.milliseconds() +
        1000 * (m2.seconds() + 60 * (m2.minutes() + 60 * m2.hours()));

      if (error) {
        response
          .status(500)
          .json({ message: 'Error while finding user transactions.', error });

        logger.error(error);

        return logger.info(
          `Operation took ${operationEnded - operationStarted}ms.`
        );
      } else {
        if (data.length >= 1) {
          response.status(200).json({
            message: 'Found user transactions successfully.',
            data,
          });

          logger.success('Found user transactions.');

          return logger.info(
            `Operation took ${operationEnded - operationStarted}ms.`
          );
        } else {
          response.status(200).json({
            message: 'Error while finding user transactions.',
            data: [],
          });

          logger.error('Could not find user transactions.');

          return logger.info(
            `Operation took ${operationEnded - operationStarted}ms.`
          );
        }
      }
    });
});

router.get('/:id', async (request, response) => {
  let m1 = moment();
  let operationStarted =
    m1.milliseconds() +
    1000 * (m1.seconds() + 60 * (m1.minutes() + 60 * m1.hours()));

  let devmode = process.env.DEV_MODE;
let connection = devmode ? await r.connect() : await r.connect(process.env.RETHINK);

  r.db('threereco')
    .table('userTransactions')
    .get(request.params.id)
    .run(connection, async (error, result) => {
      let data = await result;

      let m2 = moment();
      let operationEnded =
        m2.milliseconds() +
        1000 * (m2.seconds() + 60 * (m2.minutes() + 60 * m2.hours()));

      if (error) {
        response
          .status(500)
          .json({ message: 'Error while finding user transaction.', error });

        logger.error(error);

        return logger.info(
          `Operation took ${operationEnded - operationStarted}ms.`
        );
      } else {
        if (data) {
          response.status(200).json({
            message: 'Found user transaction successfully.',
            data,
          });

          logger.success('Found user transaction.');

          return logger.info(
            `Operation took ${operationEnded - operationStarted}ms.`
          );
        } else {
          response.status(200).json({
            message: 'Error while finding user transaction.',
            data: [],
          });

          logger.error('Could not find user transaction.');

          return logger.info(
            `Operation took ${operationEnded - operationStarted}ms.`
          );
        }
      }
    });
});

module.exports = router;
