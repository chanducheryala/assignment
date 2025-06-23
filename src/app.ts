import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import 'reflect-metadata';
import router from './routes/contact.route';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

app.use("/api", router)

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Welcome to the Contact Identification Service',
    endpoints: {
      health: '/health',
      identify: '/api/identify (POST)'
    }
  });
});

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `The requested resource ${req.originalUrl} was not found`
  });
});



app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!'
  });
});

export { app };

export const createApp = async () => {
  return app;
};
