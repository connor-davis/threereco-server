let { Router } = require('express');
let router = Router();
let passport = require('passport');
let fs = require('fs');
let jwt = require('jsonwebtoken');
let logger = require('../../utils/logger');

let registerRoutes = require('./register.routes');
let loginRoutes = require('./login.routes');

let publicKey = fs.readFileSync('certs/publicKey.pem', {
  encoding: 'utf-8',
});

router.get(
  '/check',
  (request, response, next) => {
    const token = request.headers.authorization.replace('Bearer', '').trim(); // Get your token from the request

    if (token === 'undefined') return response.status(401).send('Unauthorized');

    jwt.verify(token, publicKey, function (error, _) {
      if (error) {
        logger.error(error);

        response.status(401).send('Unauthorized');
      }
      next();
    });
  },
  passport.authenticate('jwt', { session: false }),
  (request, response) => {
    response
      .status(200)
      .json({ message: 'Authorized', userType: request.user.userType });
  }
);

router.use('/register', registerRoutes);
router.use('/login', loginRoutes);

module.exports = router;
