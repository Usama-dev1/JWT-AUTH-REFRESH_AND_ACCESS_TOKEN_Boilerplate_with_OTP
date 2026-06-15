import userModel from "../models/user.model.js";
import hashData from "../util/hashData.js";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import bcrypt from "bcryptjs";
import sessionModel from "../models/session.model.js";
import otpModel from "../models/otp.model.js";
import genOtp from "../util/genOtp.js";
import sendOtpEmail from "../util/sendOtpEmail.js";
import cryptoHash from "../util/cryptoHash.js";
//register controller
//route: /api/auth/register
export const register = async (req, res) => {
  //get user data
  const { username, email, password } = req.body;
  //if no data return error
  if (!username || !email || !password)
    return res.status(400).json({ message: "fields missing" });

  try {
    //if all fields are present check if user already exists
    const isExistingUser = await userModel.findOne({
      $or: [
        {
          username,
        },
        {
          email,
        },
      ],
    });
    //if user exists return error
    if (isExistingUser) {
      return res.status(409).json({
        message: "this user already exists",
      });
    }
    //if user does not exist hash the password and create the user
    const hashPassword = await hashData(password);
    //create user and return success message
    const user = await userModel.create({
      username,
      email,
      password: hashPassword,
    });

    const otp = genOtp();
    console.log(otp, "from genOTp");
    const otpHash = cryptoHash(otp);
    await otpModel.create({
      email,
      user: user._id,
      otpHash,
    });
    console.log(otp, email, "from register controller");
    const mail = await sendOtpEmail(email, otp);
    console.log(mail);

    //prepare user object to send back
    const sendUser = user.toObject();
    delete sendUser.password;
    //send response
    return res.status(201).json({
      message: "user created successfully",
      user: { email: sendUser.email, username: sendUser.username },
    });
  } catch (error) {
    console.error("[Register Controller]:User Registration failed", error);
    res.status(500).json({
      message: "Registration failed",
    });
  }
};

//login controller
//route: /api/auth/login
export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "fields missing" });

  try {
    const isExistingUser = await userModel.findOne({
      email,
    });

    if (!isExistingUser) {
      return res.status(401).json({
        message: "this user does not exists",
      });
    }

    if (!isExistingUser.verified) {
      return res.status(401).json({
        message: "Email not verified",
      });
    }
    const checkPassword = await bcrypt.compare(
      password,
      isExistingUser.password,
    );
    if (!checkPassword) {
      return res.status(401).json({ message: "Incorrect Credentials" });
    }

    // 1. Generate Access Token (Short-lived, e.g., 15 mins)
    const accessToken = jwt.sign(
      {
        userId: isExistingUser._id || isExistingUser.userId,
        email: isExistingUser.email,
      },
      config.JWT_SECRET,
      { expiresIn: "15m" },
    );

    // 2. Generate Refresh Token (Long-lived, e.g., 7 days)
    const refreshToken = jwt.sign(
      { userId: isExistingUser._id || isExistingUser.userId },
      config.JWT_SECRET,
      { expiresIn: "7d" },
    );

    // 3. Hash Refresh Token save it to db for 7 days
    const refreshTokenHash = await hashData(refreshToken, 4);
    await sessionModel.create({
      userId: isExistingUser._id || isExistingUser.userId,
      refreshTokenHash,
      ip: req.ip || req.headers["x-forwarded-for"],
      userAgent: req.headers["user-agent"] || "unknown",
    });

    // 4. Send the Refresh Token in an HttpOnly Cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true, // Prevents client-side JS from reading the cookie (XSS protection)
      secure: config.NODE_ENV === "production", // True in production (requires HTTPS)
      sameSite: config.NODE_ENV === "production" ? "strict" : "lax", // Prevents CSRF attacks
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });

    // 5. Prepare user object to send back
    const sendUser = isExistingUser.toObject();
    delete sendUser.password;

    // 6. Send Access Token and User data in JSON response
    return res.status(200).json({
      message: "user loggedIn successfully",
      user: sendUser,
      accessToken,
    });
  } catch (error) {
    console.error("[Login Controller]:User Login failed", error);
    res.status(500).json({
      message: "Login failed",
    });
  }
};

// handle fetching user data using the access token
//route: /api/auth/me
export const getMe = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    console.log(decoded);
    const user = await userModel
      .findById(decoded.userId || decoded._id)
      .select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ user });
  } catch (error) {
    console.error("[GetMe Controller]: Failed to fetch user data", error);
    return res.status(500).json({ message: "Failed to fetch user data" });
  }
};

export const refreshToken = async (req, res) => {
  //get token from request
  const refreshToken = req.cookies.refreshToken;
  //no token respond no token
  if (!refreshToken) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  //verify token is valid get user from token
  try {
    const decoded = jwt.verify(refreshToken, config.JWT_SECRET);
    //check the userId from the token
    const user = await userModel.findById(decoded.userId || decoded._id);
    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    const activeSessions = await sessionModel.find({
      userId: user._id || user.userId,
      revoke: false,
    });

    if (activeSessions.length === 0) {
      return res.status(404).json({ message: "No session found" });
    }

    let matchSession = null;
    for (const session of activeSessions) {
      const isMatch = await bcrypt.compare(
        refreshToken,
        session.refreshTokenHash,
      );
      if (isMatch) {
        matchSession = session;
        break;
      }
    }
    if (!matchSession) {
      // Revoke ALL sessions for this user (potential token theft)
      await sessionModel.updateMany(
        { userId: user._id || user.userId, revoke: false },
        { revoke: true },
      );
      return res
        .status(401)
        .json({ message: "Invalid session - all sessions revoked" });
    }

    const newAccessToken = jwt.sign(
      { userId: user._id, email: user.email },
      config.JWT_SECRET,
      { expiresIn: "15m" },
    );

    const newRefreshToken = jwt.sign(
      { userId: user._id || user.userId },
      config.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    const refreshTokenHash = await hashData(newRefreshToken, 4);
    matchSession.refreshTokenHash = refreshTokenHash;
    await matchSession.save();

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: config.NODE_ENV === "production",
      sameSite: config.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    console.error("[RefreshToken Controller]: Failed to refresh token", error);
    return res.status(500).json({ message: "Failed to refresh token" });
  }
};

export const logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const decoded = jwt.verify(refreshToken, config.JWT_SECRET);
    const activeSessions = await sessionModel.find({
      userId: decoded.userId || decoded._id,
      revoke: false,
    });
    if (activeSessions.length === 0) {
      return res.status(404).json({ message: "No session found" });
    }
    let matchSession = null;
    for (const session of activeSessions) {
      const isMatch = await bcrypt.compare(
        refreshToken,
        session.refreshTokenHash,
      );
      if (isMatch) {
        matchSession = session;
        break;
      }
    }
    if (!matchSession) {
      return res.status(401).json({ message: "Invalid session" });
    }
    matchSession.revoke = true;
    await matchSession.save();

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: config.NODE_ENV === "production",
      sameSite: config.NODE_ENV === "production" ? "strict" : "lax",
    });

    return res.status(200).json({ message: "user logged out" });
  } catch (error) {
    console.error("[logout controller]:Failed to log out", error);
    res.status(500).json({
      message: "failed to logout",
    });
  }
};

export const logoutAll = async (req, res) => {
  //get token from request
  const refreshToken = req.cookies.refreshToken;
  //no token respond no token
  if (!refreshToken) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  //verify token is valid get user from token
  try {
    const decoded = jwt.verify(refreshToken, config.JWT_SECRET);
    //check the userId from the token
    const user = await userModel.findById(decoded.userId || decoded._id);
    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    const activeSessions = await sessionModel.find({
      userId: user._id || user.userId,
      revoke: false,
    });

    if (activeSessions.length === 0) {
      return res.status(404).json({ message: "No session found" });
    }

    // Revoke ALL sessions for this user (potential token theft)
    await sessionModel.updateMany(
      { userId: user._id || user.userId, revoke: false },
      { revoke: true },
    );
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: config.NODE_ENV === "production",
      sameSite: config.NODE_ENV === "production" ? "strict" : "lax",
    });
    return res
      .status(200)
      .json({ message: "all sessions revoked user logged out" });
  } catch (error) {
    console.error("[RefreshToken Controller]: Failed to refresh token", error);
    return res.status(500).json({ message: "Failed to refresh token" });
  }
};

export const verifyEmail = async (req, res) => {
  const { otp, email } = req.body;
  if (!otp || !email) {
    return res.status(400).json({
      message: "Missing field",
    });
  }
  try {
    const otpHash = cryptoHash(otp);
    const userOtp = await otpModel.findOne({ email, otpHash });
    if (!userOtp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    console.log("userOtp", userOtp);
    console.log("otp from request", otp);
    const updateUser = await userModel.findByIdAndUpdate(
      userOtp.user,
      { verified: true },
      { returnDocument: "after" },
    );
    await otpModel.deleteMany({
      user: userOtp.user,
    });
    return res.status(200).json({
      message: "Email verified successfully",
      user: {
        username: updateUser.username,
        email: updateUser.email,
        verified: updateUser.verified,
      },
    });
  } catch (error) {
    console.error("[verify Email] controller error", error);
    res.status(500).json({
      message: "failed to verify email",
    });
  }
};
