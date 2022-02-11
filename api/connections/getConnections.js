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

  let connection = await r.connect();

  r.db('threereco')
    .table('userConnections')
    .filter({ user: request.user.id })
    .changes()
    .run(connection, (error, cursor) => {
      if (error) logger.error(error);
      else {
        cursor.each((error, row) => {
          if (error) logger.error(error);
          else {
            logger.info(row);
            request.io.emit('change_userConnections', row);
          }
        });
      }
    });

  r.db('threereco')
    .table('userConnections')
    .filter({ user: request.user.id })
    .run(connection, async (error, result) => {
      let data = await result.toArray();

      data.map((d) => {
        return { ...d, userPassword: undefined };
      });

      let m2 = moment();
      let operationEnded =
        m2.milliseconds() +
        1000 * (m2.seconds() + 60 * (m2.minutes() + 60 * m2.hours()));

      if (error) {
        response
          .status(500)
          .json({ message: 'Error while finding user connections', error });

        logger.error(error);

        return logger.info(
          `Operation took ${operationEnded - operationStarted}ms.`
        );
      } else {
        if (data.length >= 1) {
          response.status(200).json({
            message: 'Found user connections successfully.',
            data,
          });

          logger.success('Found user connections.');

          return logger.info(
            `Operation took ${operationEnded - operationStarted}ms.`
          );
        } else {
          response.status(200).json({
            message: 'Error while finding user connections.',
            data: [],
          });

          logger.error('Could not find user connections.');

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

  let connection = await r.connect();

  r.db('threereco')
    .table('userConnections')
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
          .json({ message: 'Error while finding user connections', error });

        logger.error(error);

        return logger.info(
          `Operation took ${operationEnded - operationStarted}ms.`
        );
      } else {
        if (data) {
          response.status(200).json({
            message: 'Found user connections successfully.',
            data,
          });

          logger.success('Found user connections.');

          return logger.info(
            `Operation took ${operationEnded - operationStarted}ms.`
          );
        } else {
          response.status(200).json({
            message: 'Error while finding user connections.',
            data: [],
          });

          logger.error('Could not find user connections.');

          return logger.info(
            `Operation took ${operationEnded - operationStarted}ms.`
          );
        }
      }
    });
});

module.exports = router;
