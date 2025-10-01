import mongoose from "mongoose";

const gameSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    eventType: { type: String, default: 'game', enum: ['game', 'loan'] },
    
    // --- Fields for Game Events ---
    mainBets: { type: [Number], default: undefined }, // Changed from mainBet to handle splits
    pairBet: { type: Number, default: undefined },
    twentyOnePlusThreeBet: { type: Number, default: undefined },
    result: { type: String, default: undefined },
    sideBetResult: { type: String, default: undefined },
    playerHands: { type: Array, default: undefined }, // Changed from playerHand
    dealerHand: { type: Array, default: undefined },
    playerScores: { type: [Number], default: undefined }, // Changed from playerScore
    dealerScore: { type: Number, default: undefined },
    
    // --- Shared Field for Winnings/Loan Amount ---
    totalWinnings: { type: Number, required: true }, // Used for game winnings or loan amount
    
    playedAt: { type: Date, default: Date.now }
});

// Use a single model and differentiate by eventType
const GameHistory = mongoose.model("GameHistory", gameSchema);

export default GameHistory;

