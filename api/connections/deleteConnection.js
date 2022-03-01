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

  let devmode = process.env.DEV_MODE === 'true';
  let connection = await r.connect({
    host: devmode ? 'localhost' : process.env.RETHINK,
    port: 28015,
    user: 'admin',
    password: process.env.ROOT_PASSWORD,
  });
  let database = r.db('threereco');

  database
    .table('userConnections')
    .get(body.id)
    .delete()
    .run(connection, async (error, result) => {
      if (error) {
        response.status(500).json({
          error,
          message: 'Error while deleting a user connection.',
        });

        logger.error('Error while deleting a user connection.');

        return logger.info(
          `Operation took ${operationEnded - operationStarted}ms.`
        );
      } else {
        if (result.deleted >= 1) {
          response.status(200).json({
            message: 'Deleting a user connection.',
          });

          logger.success('Deleted user connection.');

          return logger.info(
            `Operation took ${operationEnded - operationStarted}ms.`
          );
        } else {
          response.status(500).json({
            message: 'Could not deleting a user connection.',
          });

          logger.error('Could not delete user connection.');

          return logger.info(
            `Operation took ${operationEnded - operationStarted}ms.`
          );
        }
      }
    });
});

module.exports = router;
