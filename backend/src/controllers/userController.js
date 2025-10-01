import User, { findUserByUserId, createUser } from "../models/userModel.js";

// การสมัครสมาชิก
export async function register(req, res) {
  const { userId, password } = req.body;

  if (!userId || !password) {
    return res.status(400).json({ error: "User ID and password are required" });
  }

  try {
    const existingUser = await findUserByUserId(userId);
    if (existingUser) {
      return res.status(409).json({ error: "User ID already exists" });
    }

    const newUser = await createUser(userId, password);
    res.status(201).json({ user: newUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// การล็อกอิน
export async function login(req, res) {
  const { userId, password } = req.body;

  if (!userId || !password) {
    return res.status(400).json({ error: "User ID and password are required" });
  }

  try {
    const user = await findUserByUserId(userId);
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    // ส่งข้อมูล user กลับไปทั้งหมดเพื่อให้ frontend ใช้งานได้
    res.status(200).json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// --- ฟังก์ชันใหม่สำหรับอัปเดต Balance ---
export const updateUserBalance = async (req, res) => {
    try {
        const { userId, newBalance } = req.body;

        if (!userId || newBalance === undefined) {
            return res.status(400).json({ message: "User ID and new balance are required." });
        }
        
        const updatedUser = await User.findByIdAndUpdate(
            userId, 
            { balance: newBalance }, 
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "Balance updated successfully", user: updatedUser });
    } catch (error) {
        console.error("Error updating balance:", error);
        res.status(500).json({ message: "Server error while updating balance" });
    }
};

