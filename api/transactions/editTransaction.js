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

  let devmode = process.env.DEV_MODE;
let connection = devmode ? await r.connect() : await r.connect(process.env.RETHINK);

  body.material.materialStock = body.material.materialStock + body.weight;

  let purchaseObject = {
    purchaser: request.user.id,
    material: body.material,
    weight: body.weight,
    seller: body.seller,
    price: body.price,
    date: new Date(),
  };

  r.db('threereco')
    .table('userPurchases')
    .get(body.id)
    .update(purchaseObject)
    .run(connection, async (error, result) => {
      let m2 = moment();
      let operationEnded =
        m2.milliseconds() +
        1000 * (m2.seconds() + 60 * (m2.minutes() + 60 * m2.hours()));

      if (error) {
        response
          .status(500)
          .json({ message: 'Error while updating user purchase.', error });

        logger.error(error);

        return logger.info(
          `Operation took ${operationEnded - operationStarted}ms.`
        );
      } else {
        if (result.replaced >= 1) {
          let material = purchaseObject.material;

          r.db('threereco')
            .table('userMaterials')
            .get(purchaseObject.material.id)
            .update(material)
            .run(connection, async (error, result) => {
              if (error) {
                response.status(500).json({
                  message: 'Error while updating user purchase.',
                  error,
                });

                logger.error(error);

                return logger.info(
                  `Operation took ${operationEnded - operationStarted}ms.`
                );
              } else {
                response.status(200).json({
                  message: 'Updated user purchase successfully.',
                  data: purchaseObject,
                });

                logger.success('Updated a user purchase.');

                return logger.info(
                  `Operation took ${operationEnded - operationStarted}ms.`
                );
              }
            });
        } else {
          response
            .status(500)
            .json({ message: 'Error while updating user purchase.' });

          logger.error('Could not update user purchase.');

          return logger.info(
            `Operation took ${operationEnded - operationStarted}ms.`
          );
        }
      }
    });
});

module.exports = router;
