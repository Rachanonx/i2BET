import mongoose from "mongoose";

// สร้าง Schema สำหรับ User
const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  balance: {
     type: Number,
      default: 10000 },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// สร้าง Model จาก Schema
const User = mongoose.model("User", userSchema);

export async function createUser(userId, password) {
  const newUser = new User({ userId, password });
  await newUser.save();
  return newUser;
}

export async function findUserByUserId(userId) {
  return await User.findOne({ userId });
}

export async function findUserById(id) {
  return await User.findById(id);
}

export default User;
