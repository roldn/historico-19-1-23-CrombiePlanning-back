import express, {
  ErrorRequestHandler,
  NextFunction,
  Request,
  Response
} from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

app.use(
  (err: ErrorRequestHandler, _: Request, res: Response, next: NextFunction) => {
    res.status(400).json({ error: 'Invalid JSON format' });
  }
);

app.get('/', (req, res) => {
  res.send('Backend Running');
});

export default app;
