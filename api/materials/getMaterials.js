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

  let devmode = process.env.DEV_MODE === "true";
  let connection = await r.connect({
      host: devmode ? 'localhost' : process.env.RETHINK,
      port: 28015,
      user: "admin",
      password: process.env.ROOT_PASSWORD
    });

  r.db('threereco')
    .table('userMaterials')
    .filter({ user: request.user.id })
    .changes()
    .run(connection, (error, cursor) => {
      if (error) logger.error(error);
      else {
        cursor.each((error, row) => {
          if (error) logger.error(error);
          else {
            request.io.emit('change_userMaterials', row);
          }
        });
      }
    });

  r.db('threereco')
    .table('userMaterials')
    .filter({ user: request.user.id })
    .run(connection, async (error, result) => {
      let data = await result.toArray();

      let m2 = moment();
      let operationEnded =
        m2.milliseconds() +
        1000 * (m2.seconds() + 60 * (m2.minutes() + 60 * m2.hours()));

      if (error) {
        response
          .status(500)
          .json({ message: 'Error while finding user materials', error });

        logger.error(error);

        return logger.info(
          `Operation took ${operationEnded - operationStarted}ms.`
        );
      } else {
        if (data.length >= 1) {
          response.status(200).json({
            message: 'Found user materials successfully.',
            data,
          });

          logger.success('Found user materials.');

          return logger.info(
            `Operation took ${operationEnded - operationStarted}ms.`
          );
        } else {
          response
            .status(200)
            .json({ message: 'Error while finding user materials.', data: [] });

          logger.error('Could not find user materials.');

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

  let devmode = process.env.DEV_MODE === "true";
  let connection = await r.connect({
      host: devmode ? 'localhost' : process.env.RETHINK,
      port: 28015,
      user: "admin",
      password: process.env.ROOT_PASSWORD
    });

  r.db('threereco')
    .table('userMaterials')
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
          .json({ message: 'Error while finding user material.', error });

        logger.error(error);

        return logger.info(
          `Operation took ${operationEnded - operationStarted}ms.`
        );
      } else {
        if (data) {
          response.status(200).json({
            message: 'Found user material successfully.',
            data,
          });

          logger.success('Found user material.');

          return logger.info(
            `Operation took ${operationEnded - operationStarted}ms.`
          );
        } else {
          response
            .status(200)
            .json({ message: 'Error while finding user material.', data: [] });

          logger.error('Could not find user material.');

          return logger.info(
            `Operation took ${operationEnded - operationStarted}ms.`
          );
        }
      }
    });
});

module.exports = router;
