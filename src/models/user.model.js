import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "User name is required"],
      unique: [true, "User name must be unique"],
    },
    email: {
      type: String,
      required: [true, "User name is required"],
      unique: [true, "User name must be unique"],
    },
    password: {
      type: String,
      required: [true, "User name is required"],
    },
    role: {
      type: String,
      enum: ["user", "employer", "admin"],
      required: true,
      default: "user",
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

const userModel = mongoose.model("users", userSchema);

export default userModel;
