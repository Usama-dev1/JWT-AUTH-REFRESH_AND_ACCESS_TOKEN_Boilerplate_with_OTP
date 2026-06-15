import jwt from "jsonwebtoken";
import userModel from "../models/user.model.js";
import config from "../config/config.js";
const auth = async (req, res, next) => {
  // Get token from header
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await userModel.findById(decoded.userId).select("-password");
  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }
  req.user = user;
  next();
};
export default auth;
