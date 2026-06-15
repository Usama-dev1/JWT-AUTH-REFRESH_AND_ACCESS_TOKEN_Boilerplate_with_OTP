import bcrypt from "bcryptjs";

const hashData = async (data, salt = 10) => {
  try {
    return await bcrypt.hash(data, salt);
  } catch (error) {
    throw new Error(`Hashing failed: ${error.message}`);
  }
};

export default hashData;
