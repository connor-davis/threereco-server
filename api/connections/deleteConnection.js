let { Router } = require('express');
let router = Router();
let r = require('rethinkdb');
let logger = require('../../utils/logger.js');
let moment = require('moment');

let removeConnection = async (userId, request, response, callback) => {
  let connection = await r.connect();
  let database = r.db('threereco');

  database
    .table('userConnections')
    .filter(function (connection) {
      return connection('user')
        .eq(userId)
        .or(connection('connection').eq(userId));
    })
    .run(connection, async (error, result) => {
      if (error) {
        callback({ error, message: 'Unable to find connections.' }, false);
      } else {
        let data = await result.toArray();

        let first = data[0];
        let second = data[1];

        if (data.length > 1) {
          database
            .table('userConnections')
            .get(first.id)
            .delete()
            .run(connection, async (error, result) => {
              if (error) {
                callback(
                  {
                    message: 'Error while deleting a user connection.',
                    error,
                  },
                  false
                );
              } else {
                if (result.deleted >= 1) {
                  r.db('threereco')
                    .table('userConnections')
                    .get(second.id)
                    .delete()
                    .run(connection, async (error, result) => {
                      if (error) {
                        callback(
                          {
                            error,
                            message: 'Error while deleting a user connection.',
                          },
                          false
                        );
                      } else {
                        if (result.deleted >= 1) {
                          callback(false, {
                            message: 'Deleting a user connection.',
                          });
                        } else {
                          callback(
                            {
                              message: 'Could not deleting a user connection.',
                            },
                            false
                          );
                        }
                      }
                    });
                } else {
                  callback(
                    { message: 'Could not deleting a user connection.' },
                    false
                  );
                }
              }
            });
        } else {
          callback({ message: 'Unable to find connections.' }, false);
        }
      }
    });
};

router.post('/', async (request, response) => {
  let { body } = request;

  let m1 = moment();
  let operationStarted =
    m1.milliseconds() +
    1000 * (m1.seconds() + 60 * (m1.minutes() + 60 * m1.hours()));

  let connection = await r.connect();

  removeConnection(
    body.id,
    request,
    response,
    async ({ error, message }, result) => {
      let m2 = moment();
      let operationEnded =
        m2.milliseconds() +
        1000 * (m2.seconds() + 60 * (m2.minutes() + 60 * m2.hours()));

      if (error) {
        response.status(500).json({
          message,
          error,
        });

        logger.error(error);

        return logger.info(
          `Operation took ${operationEnded - operationStarted}ms.`
        );
      } else {
        if (result) {
          response.status(200).json(result);

          logger.success('Deleted user connection.');

          return logger.info(
            `Operation took ${operationEnded - operationStarted}ms.`
          );
        } else {
          response.status(500).json({
            message: 'Error while deleting user connection.',
          });

          logger.error('Could not delete user connection.');

          return logger.info(
            `Operation took ${operationEnded - operationStarted}ms.`
          );
        }
      }
    }
  );
});

module.exports = router;
