import express from 'express';
import cors from 'cors';
import routes from './routes/index.ts';
import errorHandler from './middlewares/error.middleware.ts';

const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/v1', routes);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    error: {
      code: 'ROUTE_NOT_FOUND',
      details: null,
    },
  });
});

app.use(errorHandler);

export default app;
