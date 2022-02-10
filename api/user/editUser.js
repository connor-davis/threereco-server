let { Router } = require('express');
let router = Router();
let r = require('rethinkdb');
let logger = require('../../utils/logger.js');
let moment = require('moment');

router.post('/', async (request, response) => {
  let { body } = request;

  let connection = await r.connect();

  let m1 = moment();
  let operationStarted =
    m1.milliseconds() +
    1000 * (m1.seconds() + 60 * (m1.minutes() + 60 * m1.hours()));

  r.db('threereco')
    .table('users')
    .get(request.user.id)
    .update(body)
    .run(connection, async (error, result) => {
      let m2 = moment();
      let operationEnded =
        m2.milliseconds() +
        1000 * (m2.seconds() + 60 * (m2.minutes() + 60 * m2.hours()));

      if (error) {
        response
          .status(500)
          .json({ message: 'Error while updating user.', error });

        logger.error(error);

        return logger.info(
          `Operation took ${operationEnded - operationStarted}ms.`
        );
      } else {
        if (result.replaced >= 1) {
          response.status(200).json({
            message: 'Updated user successfully.',
            data: body,
          });

          logger.success('Updated a user.');

          return logger.info(
            `Operation took ${operationEnded - operationStarted}ms.`
          );
        } else {
          response.status(500).json({ message: 'Error while updating user.' });

          logger.error('Could not update user.');

          return logger.info(
            `Operation took ${operationEnded - operationStarted}ms.`
          );
        }
      }
    });
});

module.exports = router;
