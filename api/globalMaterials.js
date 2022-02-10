let { Router } = require('express');
let router = Router();
let r = require('rethinkdb');

router.get('/', async (request, response) => {
  let m1 = moment();
  let operationStarted =
    m1.milliseconds() +
    1000 * (m1.seconds() + 60 * (m1.minutes() + 60 * m1.hours()));

  let connection = await r.connect();

  r.db('threereco')
    .table('globalMaterials')
    .run(connection, async (error, result) => {
      let data = await result.toArray();

      let m2 = moment();
      let operationEnded =
        m2.milliseconds() +
        1000 * (m2.seconds() + 60 * (m2.minutes() + 60 * m2.hours()));

      if (error) {
        response
          .status(500)
          .json({ message: 'Error while finding global materials', error });

        logger.error(error);

        return logger.info(
          `Operation took ${operationEnded - operationStarted}ms.`
        );
      } else {
        if (data.length >= 1) {
          response.status(200).json({
            message: 'Found global materials successfully.',
            data,
          });

          logger.success('Found global materials.');

          return logger.info(
            `Operation took ${operationEnded - operationStarted}ms.`
          );
        } else {
          response
            .status(200)
            .json({
              message: 'Error while finding global materials.',
              data: [],
            });

          logger.error('Could not find global materials.');

          return logger.info(
            `Operation took ${operationEnded - operationStarted}ms.`
          );
        }
      }
    });
});

module.exports = router;
