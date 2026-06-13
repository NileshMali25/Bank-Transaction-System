# Bank Transaction System Backend

A robust Express.js backend for a Bank Transaction / Ledger system. Features JWT-based authentication, password hashing, MongoDB database connection, and user registration/login endpoints.

## Features
- **User Authentication**: Secure registration and login using JSON Web Tokens (JWT) and cookies.
- **Security**: Password hashing using `bcryptjs`.
- **Database Integration**: MongoDB connection via Mongoose with custom DNS configuration.
- **RESTful Architecture**: Follows MVC structure with routes, controllers, and database models separated cleanly.

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Security & Auth**: JSON Web Token (JWT), bcryptjs, cookie-parser

## Project Structure
```text
BACKEND-LEDGER/
├── src/
│   ├── config/          # Database configuration
│   ├── controllers/     # Route controller functions
│   ├── models/          # Mongoose database models
│   ├── routes/          # Express API route handlers
│   └── app.js           # App initialization and middlewares
├── server.js            # Entry point of the server
├── package.json         # Node.js dependencies and scripts
└── .env                 # Environment variables (local-only)
```

## Getting Started

### Prerequisites
- Node.js installed on your machine
- MongoDB Atlas account or local MongoDB instance

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/NileshMali25/Bank-Transaction-System.git
   cd Bank-Transaction-System
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables. Create a `.env` file in the root directory and add the following:
   ```env
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   ```

4. Start the application:
   - For development (with nodemon):
     ```bash
     npm run dev
     ```
   - For production:
     ```bash
     npm start
     ```

## API Endpoints

### Authentication
- **Register User**
  - **URL**: `/api/auth/register`
  - **Method**: `POST`
  - **Request Body**:
    ```json
    {
      "name": "John Doe",
      "email": "john@example.com",
      "password": "securepassword"
    }
    ```
  - **Response**: Returns JWT token and sets it in the cookie.

- **Login User**
  - **URL**: `/api/auth/login`
  - **Method**: `POST`
  - **Request Body**:
    ```json
    {
      "email": "john@example.com",
      "password": "securepassword"
    }
    ```
  - **Response**: Returns JWT token and sets it in the cookie.
