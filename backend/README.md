# PropSync Backend

This is the backend service for the PropSync application. It is built using the [NestJS](https://nestjs.com/) framework and is designed to provide APIs for property management, user management, complaints, estimates, bills, payments, maintenance, and notifications.

## Project Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Copy the example environment file and adjust the values as necessary.
   ```bash
   cp .env.example .env
   ```

## Running the Application

```bash
# development
npm run start

```

The application will start on the port defined in your `.env` file (default is `3000`).

## Swagger API Documentation

This project uses Swagger for API documentation. 
Once the application is running, you can access the Swagger UI at:
- `http://localhost:<PORT>/api/docs`

## Tests

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```

## Structure overview
- `src/` - Application source code (controllers, modules, services)
- `test/` - E2E tests
- `uploads/` - Directory where uploaded files are stored (excluded from Git)
