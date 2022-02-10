let { Router } = require('express');
let passport = require('passport');
let router = Router();

let authenticationRoutes = require('./authentication');
let usersRoutes = require('./user');
let materialsRoutes = require('./materials');
let connectionsRoutes = require('./connections');
let transactionsRoutes = require('./transactions');
let globalMaterialsRoute = require('./globalMaterials');

router.get('/', async (request, response) => {
  response.render('pages/under-development');
});

router.use('/authentication', authenticationRoutes);
router.use(
  '/users',
  passport.authenticate('jwt', { session: false }),
  usersRoutes
);
router.use(
  '/materials',
  passport.authenticate('jwt', { session: false }),
  materialsRoutes
);
router.use(
  '/connections',
  passport.authenticate('jwt', { session: false }),
  connectionsRoutes
);
router.use(
  '/transactions',
  passport.authenticate('jwt', { session: false }),
  transactionsRoutes
);
router.use(
  '/globalMaterials',
  passport.authenticate('jwt', { session: false }),
  globalMaterialsRoute
);

module.exports = router;
