import { sequelize } from '../src/config/database';

// Set up test environment variables
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'test_db';
process.env.DB_USER = 'root';
process.env.DB_PASSWORD = 'password';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';

// Global test setup
beforeAll(async () => {
  // Create test database if it doesn't exist
  await sequelize.query('CREATE DATABASE IF NOT EXISTS test_db;');
  await sequelize.sync({ force: true });
});

// Global test teardown
afterAll(async () => {
  await sequelize.close();
});
