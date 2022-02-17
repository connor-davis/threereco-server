let { Router } = require('express');
let fs = require('fs');
let router = Router();
let r = require('rethinkdb');
let bcrypt = require('bcrypt');
let jwt = require('jsonwebtoken');

router.post('/', async (request, response) => {
  let { body } = request;

  let devmode = process.env.DEV_MODE === "true";
  let connection = await r.connect({
      host: devmode ? 'localhost' : process.env.RETHINK,
      port: 28015,
      user: "admin",
      password: process.env.ROOT_PASSWORD
    });

  let privateKey = fs.readFileSync('certs/privateKey.pem', {
    encoding: 'utf-8',
  });

  r.db('threereco')
    .table('users')
    .filter({ userIdNumber: body.idNumber })
    .run(connection, async (error, result) => {
      if (error) {
        response
          .status(500)
          .json({ message: 'Error while searching for user.', error });
        return logger.error(error);
      } else {
        let data = await result.toArray();
        let user = data[0];

        if (user) {
          if (bcrypt.compareSync(body.password, user.userPassword)) {
            let token = jwt.sign(
              {
                sub: user.id,
              },
              privateKey,
              { expiresIn: '1d', algorithm: 'RS256' }
            );

            response.status(200).json({
              message: 'Authenticated successfully.',
              data: {
                ...user,
                userPassword: undefined,
                userAuthenticationToken: token,
              },
            });
          } else {
            response.status(401).json({ message: 'Password does not match.' });
          }
        } else {
          response.status(404).json({ message: 'User does not exist.' });
        }
      }
    });
});

module.exports = router;
