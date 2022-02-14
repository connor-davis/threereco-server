let { Router } = require('express');
let router = Router();
let r = require('rethinkdb');
let logger = require('../../utils/logger.js');
let moment = require('moment');

router.post('/', async (request, response) => {
  let { body } = request;

  let m1 = moment();
  let operationStarted =
    m1.milliseconds() +
    1000 * (m1.seconds() + 60 * (m1.minutes() + 60 * m1.hours()));

  let devmode = process.env.DEV_MODE;
let connection = devmode ? await r.connect() : await r.connect(process.env.RETHINK);

  console.log(body);

  let transactionObject =
    body.type === 'purchase'
      ? {
          user: request.user.id,
          purchaser: request.user,
          material: body.material,
          weight: body.weight,
          seller: body.seller,
          price: body.price,
          type: body.type,
          date: Date.now(),
        }
      : {
          user: request.user.id,
          purchaser: body.purchaser,
          material: body.material,
          weight: body.weight,
          seller: request.user,
          price: body.price,
          type: body.type,
          date: Date.now(),
        };

  r.db('threereco')
    .table('userTransactions')
    .insert(transactionObject)
    .run(connection, async (error, result) => {
      let m2 = moment();
      let operationEnded =
        m2.milliseconds() +
        1000 * (m2.seconds() + 60 * (m2.minutes() + 60 * m2.hours()));

      if (error) {
        response
          .status(500)
          .json({ message: 'Error while creating new user purchase.', error });

        logger.error(error);

        return logger.info(
          `Operation took ${operationEnded - operationStarted}ms.`
        );
      } else {
        if (result.inserted >= 1) {
          response.status(200).json({
            message: 'Created new user purchase successfully.',
            data: transactionObject,
          });

          logger.success('Created a new user purchase.');

          return logger.info(
            `Operation took ${operationEnded - operationStarted}ms.`
          );
        } else {
          response
            .status(500)
            .json({ message: 'Error while creating new user purchase.' });

          logger.error('Could not create new user purchase.');

          return logger.info(
            `Operation took ${operationEnded - operationStarted}ms.`
          );
        }
      }
    });
});

module.exports = router;
