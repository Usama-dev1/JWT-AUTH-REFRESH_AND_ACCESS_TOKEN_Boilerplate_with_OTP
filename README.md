# JWT Authentication & Session Management System

A robust Node.js authentication system featuring dynamic access and refresh token rotation, database-backed session management, role-based access control (RBAC), and OTP (One-Time Password) verification via Brevo.

## 🚀 Features

*   **Dual Token Authentication**: Short-lived Access Tokens and long-lived Refresh Tokens.
*   **Automatic Token Rotation**: Refresh tokens are rotated upon expiry or use to mitigate replay attacks.
*   **Database-Backed Sessions**: Active sessions are tracked in MongoDB, allowing for granular session management (e.g., logging out from all devices).
*   **OTP Verification**: Secure email-based OTP verification for user registration and password resets.
*   **Role-Based Authentication**: Middleware to restrict route access based on user roles (e.g., User, Admin).

---

## 🛠️ Database Architecture (Models)

The system is built around three core MongoDB schemas:

### 1. User Schema (`User`)
Handles user profiles, authentication credentials, registration states, and access control.
*   `email`: Unique identifier for the user.
*   `password`: Hashed password.
*   `role`: Defines user privileges (e.g., `user`, `admin`).
*   `isVerified`: Boolean flag managed by the OTP verification process.

### 2. Session Schema (`Session`)
Manages active user sessions and facilitates secure token rotation.
*   `userId`: Reference to the user who owns the session.
*   `refreshToken`: The current valid hashed refresh token.
*   `createdAt` / `expiresAt`: Used to automatically purge expired sessions.

### 3. OTP Schema (`OTP`)
Temporarily stores secure hashes for email verification.
*   `email`: Target email address for verification.
*   `otpHash`: Hashed version of the OTP for secure comparison.
*   `createdAt`: Timestamp utilized for automatic TTL (Time-To-Live) expiration (e.g., OTP expires in 5 minutes).

---

## ⚙️ Environment Configuration

To run this project, you need to configure your environment variables. Create a `.env` file in the root directory of your project and populate it with the variables below:

```env
# MongoDB Connection URI
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/your-db-name

# Server Environment
NODE_ENV="development"

# JWT Secrets (Use strong, unique secret strings for each)
JWT_SECRET=your_general_jwt_secret_here
ACCESS_TOKEN_SECRET=your_access_token_secret_here
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here

# Email Service Config (Brevo API)


💡 AI-Ready Specification
This repository includes an architectural JSON map (auth-flow.json or similar) explicitly designed for AI assistants, LLMs, and code generation agents. It allows AI tools to instantly understand the state, schemas, token rotation strategies, and endpoints of the codebase without needing to trace files manually.

# Note: You can swap this out for SendGrid, Mailgun, or Nodemailer if preferred.
BREVO_API_KEY=your_brevo_api_key_here
