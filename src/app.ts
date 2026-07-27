import path from 'path';
import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import methodOverride from 'method-override';
import { Pool } from 'pg';
import { loadUser } from './middleware/auth';
import { csrfToken, verifyCsrf } from './middleware/csrf';
import { flashLocals } from './middleware/flash';
import { router } from './routes';

const PgSession = connectPgSimple(session);

export function createApp() {
  const app = express();
  const pgPool = new Pool({ connectionString: process.env.DATABASE_URL });

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '..', 'views'));

  app.use(express.static(path.join(__dirname, '..', 'public')));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(methodOverride('_method'));

  app.use(
    session({
      store: new PgSession({ pool: pgPool, tableName: 'session', createTableIfMissing: true }),
      secret: process.env.SESSION_SECRET ?? 'dev-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 1000 * 60 * 60 * 2 },
    })
  );

  app.use(csrfToken);
  app.use(flashLocals);
  app.use(loadUser);
  app.use((req, res, next) => {
    res.locals.currentPath = req.path;
    res.locals.request = { query: req.query, path: req.path };
    next();
  });

  app.use(verifyCsrf);
  app.use('/', router);

  return app;
}
