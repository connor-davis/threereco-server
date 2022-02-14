let Strategy = require('passport-jwt').Strategy,
  ExtractJwt = require('passport-jwt').ExtractJwt;

let fs = require('fs');
let r = require('rethinkdb');

let pubKey = fs.readFileSync('certs/publicKey.pem', {
  encoding: 'utf8',
});

let options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: pubKey,
  algorithms: ['RS256'],
};

module.exports = new Strategy(options, async (payload, done) => {
  let devmode = process.env.DEV_MODE;
let connection = devmode ? await r.connect() : await r.connect(process.env.RETHINK);

  r.db('threereco')
    .table('users')
    .get(payload.sub)
    .run(connection, async (error, result) => {
      if (error) {
        return done(error, false);
      }

      let user = await result;

      if (user) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    });
});
