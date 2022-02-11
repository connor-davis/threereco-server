'use strict';
let dotenv = require('dotenv');
dotenv.config();

let logger = require('./utils/logger');

let express = require('express');
let app = express();
let fs = require('fs');
let path = require('path');
let http = require('http').createServer(app);
// let https = require("https").createServer(
//   {
//     cert: fs.readFileSync("./ssl/server.cert"),
//     key: fs.readFileSync("./certs/server.key"),
//   },
//   app
// );

let compression = require('compression');
let cors = require('cors');
let { json, urlencoded } = require('body-parser');
let passport = require('passport');

let JwtStrategy = require('./strategies/jwt');
let session = require('express-session');

let r = require('rethinkdb');

let api = require('./api');
// let routes = require('./routes');

let port = process.env.PORT || 3000;

let io = require('socket.io')(http);

io.on('connection', (socket) => {
  logger.info('a user connected to socket io');
});

(async () => {
  app.use(cors("*"));
  app.use(compression());
  app.use(json());
  app.use(urlencoded({ extended: false }));
  app.use(session({ secret: process.env.ROOT_PASSWORD }));
  app.use(passport.initialize());
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'ejs');
  app.use(express.static(__dirname + '/public'));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    let connection = await r.connect();

    r.db('threereco')
      .table('users')
      .get(id)
      .run(connection, async (error, result) => {
        let data = await result.toArray();
        let user = data[0];

        return done(error, user);
      });
  });

  passport.use('jwt', JwtStrategy);

  app.use(
    '/api',
    (request, response, next) => {
      request.io = io;

      next();
    },
    api
  );

  // app.get('/', async (request, response) => {
  //   response.render('pages/welcome');
  // });

  app.get('/**', async (request, response) => {
    response.render('pages/404.ejs');
  });

  r.connect(async (error, connection) => {
    if (error) return console.log(error);
    else {
      r.dbCreate('threereco').run(connection, (error, _) => {
        if (error)
          return logger.warning(
            'Database could not be created. Already exists.'
          );
        else return logger.success('Database threereco created.');
      });

      r.db('threereco')
        .tableCreate('users')
        .run(connection, (error, _) => {
          if (error)
            return logger.warning(
              'Users table could not be created. Already exists.'
            );
          else return logger.success('Users table created.');
        });

      return logger.success(
        `Connected to RethinkDB on http://${connection.host}:${connection.port}`
      );
    }
  });

  http.listen(port, () =>
    logger.success(`Listening on http://localhost:${port}`)
  );
  //   https.listen(443, () => console.log(`Listening on http://localhost:443`));
})();
