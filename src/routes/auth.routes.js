import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import auth from "../middleware/auth.middleware.js";
import role from "../middleware/role.middleware.js";
const authRouter = Router();

authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);
authRouter.get("/get-me", auth, authController.getMe);
authRouter.get("/refresh", auth, authController.refreshToken);
authRouter.post("/verify-email", authController.verifyEmail);
authRouter.post("/logout", auth, authController.logout);
authRouter.post("/logout-all", auth, role("admin"), authController.logoutAll);

export default authRouter;
