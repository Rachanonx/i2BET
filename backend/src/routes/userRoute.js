import { Router } from "express";
import { register, login, updateUserBalance } from "../controllers/userController.js";

const router = Router();

// Register route
router.post("/register", register);

// Login route
router.post("/login", login);

// Route to update user balance
router.put("/balance", updateUserBalance);

export default router;
