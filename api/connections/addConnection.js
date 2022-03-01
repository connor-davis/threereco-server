let { Router } = require('express');
let router = Router();
let r = require('rethinkdb');
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
    .table('users')
    .get(body.id)
    .run(connection, async (error, result) => {
      if (error) {
        callback({ error, message: 'Unable to find user.' }, false);
      } else {
        let data = await result;
        delete data['userPassword'];

        let user = request.user;
        delete user['userPassword'];

        let connectionObject = {
          initiator: user,
          connection: data,
          date: Date.now(),
        };

        if (data) {
          database
            .table('userConnections')
            .insert(connectionObject)
            .run(connection, async (error, result) => {
              if (error) {
                response.status(500).json({
                  message: 'Error while creating new user connection.',
                  error,
                });
              } else {
                if (result.inserted >= 1) {
                  response.status(200).json({
                    message: 'Created a new user connection.',
                    data: connectionObject,
                  });
                } else {
                  response.status(500).json({
                    message: 'Could not create new user connection.',
                  });
                }
              }
            });
        } else {
          response.status(500).json({ message: 'Unable to find user.' });
        }
      }
    });
});

module.exports = router;
