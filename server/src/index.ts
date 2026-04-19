import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import stripRouter from './routes/strip';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 4000;
const rawClientOrigin = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';
const allowedOrigins = rawClientOrigin
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const isAllowedOrigin = (origin: string | undefined): boolean => {
  if (!origin) {
    return true;
  }

  if (allowedOrigins.includes('*')) {
    return true;
  }

  return allowedOrigins.includes(origin);
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS.`));
    },
    credentials: false
  })
);

app.use(
  express.json({
    limit: '25mb'
  })
);

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'photo-strip-server',
    timestamp: new Date().toISOString()
  });
});

app.use('/', stripRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = err instanceof Error ? err.message : 'Unexpected server error.';
  res.status(500).json({ error: message });
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Photo strip server listening on http://localhost:${port}`);
});
