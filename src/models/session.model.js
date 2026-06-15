import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: [true, "User is required"],
    },

    refreshTokenHash: {
      type: String,
      required: [true, "Refresh Token hash is required"],
    },
    ip: {
      type: String,
      required: [true, "User ip is required"],
    },

    userAgent: {
      type: String,
      required: [true, "user agent is required"],
    },
    revoke: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);
// TTL index to auto-clean old sessions (7 days)
sessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

const sessionModel = mongoose.model("session", sessionSchema);

export default sessionModel;
