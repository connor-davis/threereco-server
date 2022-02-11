let { Router, request } = require('express');
let router = Router();
let r = require('rethinkdb');
let logger = require('../../utils/logger.js');
let moment = require('moment');
let uuid = require('uuid');

let generateConnection = async (
  userId,
  connectionUserId,
  request,
  response,
  callback
) => {
  let connection = await r.connect();
  let database = r.db('threereco');

  database
    .table('users')
    .get(connectionUserId)
    .run(connection, async (error, result) => {
      if (error) {
        callback({ error, message: 'Unable to find user.' }, false);
      } else {
        let data = await result;

        data.connection = data.id;
        data.id = uuid.v4();
        data.userPassword = undefined;

        if (data) {
          database
            .table('userConnections')
            .insert({ user: userId, ...data })
            .run(connection, async (error, result) => {
              if (error) {
                callback(
                  {
                    message: 'Error while creating new user connection.',
                    error,
                  },
                  false
                );
              } else {
                if (result.inserted >= 1) {
                  let data = request.user;

                  data.connection = data.id;
                  data.id = uuid.v4();
                  data.userPassword = undefined;

                  r.db('threereco')
                    .table('userConnections')
                    .insert({ user: connectionUserId, ...data })
                    .run(connection, async (error, result) => {
                      if (error) {
                        callback(
                          {
                            error,
                            message:
                              'Error while creating new user connection.',
                          },
                          false
                        );
                      } else {
                        if (result.inserted >= 1) {
                          callback(false, {
                            message: 'Created a new user connection.',
                            data: { user: userId, ...data },
                          });
                        } else {
                          callback(
                            {
                              message: 'Could not create new user connection.',
                            },
                            false
                          );
                        }
                      }
                    });
                } else {
                  callback(
                    { message: 'Could not create new user connection.' },
                    false
                  );
                }
              }
            });
        } else {
          callback({ message: 'Unable to find user.' }, false);
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

  await generateConnection(
    request.user.id,
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

          logger.success('Created a new user connection.');

          return logger.info(
            `Operation took ${operationEnded - operationStarted}ms.`
          );
        } else {
          response.status(500).json({
            message: 'Error while creating new user connection.',
          });

          logger.error('Could not create new user connection.');

          return logger.info(
            `Operation took ${operationEnded - operationStarted}ms.`
          );
        }
      }
    }
  );
});

module.exports = router;
