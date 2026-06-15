import "dotenv/config";

if (!process.env.MONGO_URI) {
  throw new Error("MONGO URI not defined in environment variables");
}
if (!process.env.ACCESS_TOKEN_SECRET) {
  throw new Error("Access token secret not defined in environment variables");
}
if (!process.env.REFRESH_TOKEN_SECRET) {
  throw new Error("Refresh token secret not defined in environment variables");
}

if (!process.env.JWT_SECRET) {
  throw new Error("JWT secret not defined in environment variables");
}
if (!process.env.NODE_ENV) {
  throw new Error("Node env not defined in environment variables");
}

if (!process.env.BREVO_API_KEY) {
  throw new Error("No BREVO api key in environment variables");
}

const config = {
  MONGO_URI: process.env.MONGO_URI,
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  NODE_ENV: process.env.NODE_ENV,
  JWT_SECRET: process.env.JWT_SECRET,
  BREVO_API_KEY: process.env.BREVO_API_KEY,
};

export default config;
