# Node.js + TypeScript Backend with MySQL and Sequelize

A simple and clean Node.js backend with TypeScript, Express, MySQL, and Sequelize ORM.

## Prerequisites

- Node.js (v14 or later)
- MySQL Server (v5.7 or later)
- npm or yarn

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd assignment
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   - Make sure MySQL server is running
   - Create a new MySQL database named `assignment`
   ```sql
   CREATE DATABASE assignment;
   ```

4. **Configure environment variables**
   - Update the `.env` file with your database credentials

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

The server will start on `http://localhost:3000` by default.

## API Endpoints

### Health Check
- `GET /health` - Check if the server is running

## Project Structure

```
src/
├── config/           # Database configuration
├── app.ts            # Express application setup
└── index.ts          # Application entry point
```

## License

ISC
