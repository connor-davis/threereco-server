let { Router } = require('express');
let router = Router();
let r = require('rethinkdb');
let uuid = require('uuid');
let logger = require('../../utils/logger');
let bcrypt = require('bcrypt');
let jwt = require('jsonwebtoken');
let fs = require('fs');

router.post('/', async (request, response) => {
  let { body } = request;

  let devmode = process.env.DEV_MODE === 'true';
  let connection = await r.connect({
    host: devmode ? 'localhost' : process.env.RETHINK,
    port: 28015,
    user: 'admin',
    password: process.env.ROOT_PASSWORD,
  });

  let privateKey = fs.readFileSync('certs/privateKey.pem', {
    encoding: 'utf-8',
  });

  r.db('threereco')
    .table('users')
    .filter({ username: body.username })
    .run(connection, async (error, result) => {
      if (error) {
        response
          .status(200)
          .json({ message: 'Error while searching for user.', error });
        return logger.error(error);
      } else {
        let data = await result.toArray();
        let user = data[0];

        if (user) {
          response
            .status(200)
            .json({ message: 'User already exists.', error: 'auth-error' });
        } else {
          // Create the new user.

          let userObject = {
            id: uuid.v4(),
            username: body.username,
            userIdNumber: body.idNumber,
            userPassword: bcrypt.hashSync(body.password, 2048),
          };

          let token = jwt.sign(
            {
              sub: userObject.id,
            },
            privateKey,
            { expiresIn: '1d', algorithm: 'RS256' }
          );

          r.db('threereco')
            .table('users')
            .insert(userObject)
            .run(connection, async (error, result) => {
              if (error) {
                response
                  .status(200)
                  .json({ message: 'Error while creating new user.', error });

                return logger.error(error);
              } else {
                if (result.inserted >= 1) {
                  response.status(200).json({
                    message: 'Created new user successfully.',
                    data: {
                      ...userObject,
                      userPassword: undefined,
                      userAuthenticationToken: token,
                    },
                  });

                  return logger.success('Created a new user.');
                } else {
                  response
                    .status(200)
                    .json({
                      message: 'Error while creating new user.',
                      error: 'auth-error',
                    });

                  return logger.error('Could not create new user.');
                }
              }
            });
        }
      }
    });
});

module.exports = router;
