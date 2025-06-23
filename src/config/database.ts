import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  database: process.env.DB_NAME || 'contactdb',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'rootpassword',
  host: process.env.DB_HOST || 'db',
  port: parseInt(process.env.DB_PORT || '3306'),
  dialect: 'mysql' as const,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true,
  },
  dialectOptions: {
    connectTimeout: 60000,
    authPlugins: {
      mysql_native_password: () => require('mysql2/lib/auth_plugins/mysql_native_password'),
      caching_sha2_password: () => require('mysql2/lib/auth_plugins/caching_sha2_password')
    }
  }
};

export const sequelize = new Sequelize(dbConfig);

const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected...');
    
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
      console.log('Database synced');
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    setTimeout(initializeDatabase, 5000);
  }
};

initializeDatabase();
