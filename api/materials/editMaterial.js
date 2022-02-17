let { Router } = require('express');
let router = Router();
let r = require('rethinkdb');
let logger = require('../../utils/logger.js');
let moment = require('moment');

router.put('/', async (request, response) => {
  let { body } = request;

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

  let materialObject = {
    user: request.user.id,
    materialName: body.name,
    materialValue: body.value,
  };

  r.db('threereco')
    .table('userMaterials')
    .get(body.id)
    .update(materialObject)
    .run(connection, async (error, result) => {
      let m2 = moment();
      let operationEnded =
        m2.milliseconds() +
        1000 * (m2.seconds() + 60 * (m2.minutes() + 60 * m2.hours()));

      if (error) {
        response
          .status(500)
          .json({ message: 'Error while updating user material.', error });

        logger.error(error);

        return logger.info(
          `Operation took ${operationEnded - operationStarted}ms.`
        );
      } else {
        if (result.replaced >= 1) {
          response.status(200).json({
            message: 'Updated user material successfully.',
            data: materialObject,
          });

          logger.success('Updated a user material.');

          return logger.info(
            `Operation took ${operationEnded - operationStarted}ms.`
          );
        } else {
          response
            .status(500)
            .json({ message: 'Error while updating user material.' });

          logger.error('Could not update user material.');

          return logger.info(
            `Operation took ${operationEnded - operationStarted}ms.`
          );
        }
      }
    });
});

module.exports = router;
