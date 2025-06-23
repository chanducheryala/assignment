import 'reflect-metadata';
import dotenv from 'dotenv';
import { createApp } from './app';
import { sequelize } from './config/database';
import './models/contact.model'; 

dotenv.config();

process.env.PORT = process.env.PORT || '3000';
process.env.DB_NAME = process.env.DB_NAME || 'assignment';
process.env.DB_USER = process.env.DB_USER || 'root';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'root';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '3306';
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const PORT = parseInt(process.env.PORT);

const startServer = async () => {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    console.log('Syncing database...');
    await sequelize.sync();
    console.log('Database synchronized');
    
    const app = await createApp();
    

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });

    const shutdown = async () => {
      console.log('\n Shutting down server...');
      server.close(async () => {
        console.log('Server closed');
        await sequelize.close();
        console.log('Database connection closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};


startServer().catch(error => {
  console.error('Fatal error during server startup:', error);
  process.exit(1);
});
