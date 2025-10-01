import GameHistory from '../models/gameModel.js';
import User from '../models/userModel.js'; // <-- FIX: Import the User model
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- Game Logic ---
const SUITS = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

const createDeck = () => {
    return SUITS.flatMap(suit => VALUES.map(value => ({ suit, value })));
};

const shuffleDeck = (deck) => {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
};

export const startGame = (req, res) => {
    try {
        const deck = shuffleDeck(createDeck());
    //         const playerHand = [
    //   { value: '8', suit: 'Diamonds' },
    //   { value: '8', suit: 'Clubs' }
    // ];
        const playerHand = [deck.pop(), deck.pop()];
        const dealerHand = [deck.pop(), deck.pop()];
    //     const dealerHand = [
    //   { value: 'A', suit: 'Diamonds' },
    //   { value: 'K', suit: 'Clubs' }
    // ];
        res.json({ deck, playerHand, dealerHand });
    } catch (error) {
        res.status(500).json({ message: "Error starting game", error: error.message });
    }
};

// --- History & Database ---
export const saveGame = async (req, res) => {
    try {
        // Explicitly destructure fields to ensure data integrity
        const {
            userId,
            mainBets,
            pairBet,
            twentyOnePlusThreeBet,
            result,
            sideBetResult,
            playerHands,
            dealerHand,
            playerScores,
            dealerScore,
            totalWinnings
        } = req.body;

        const newGame = new GameHistory({
            userId,
            mainBets,
            pairBet,
            twentyOnePlusThreeBet,
            result,
            sideBetResult,
            playerHands,
            dealerHand,
            playerScores,
            dealerScore,
            totalWinnings,
            eventType: 'game'
        });

        await newGame.save();
        res.status(201).json(newGame);
    } catch (error) {
        console.error("Error saving game:", error); // Log the full error on the server
        res.status(400).json({ message: "Error saving game data", error: error.message });
    }
};

export const recordLoan = async (req, res) => {
    try {
        const { userId, loanAmount } = req.body;
        const loanRecord = new GameHistory({
            userId,
            eventType: 'loan',
            totalWinnings: loanAmount,
        });
        await loanRecord.save();
        res.status(201).json(loanRecord);
    } catch (error) {
        res.status(400).json({ message: "Error recording loan", error: error.message });
    }
};

export const getHistory = async (req, res) => {
    try {
        const history = await GameHistory.find({ userId: req.params.userId }).sort({ playedAt: -1 });
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: "Error fetching history", error: error.message });
    }
};

export const deleteGameHistory = async (req, res) => {
    try {
        // Step 1: Delete all game history for the user
        await GameHistory.deleteMany({ userId: req.params.userId });
        
        // Step 2: Find the user and reset their balance to 10000
        const updatedUser = await User.findByIdAndUpdate(
            req.params.userId,
            { balance: 10000 },
            { new: true } // This option returns the updated document
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Step 3: Send a success response with the new balance
        res.status(200).json({ 
            message: 'History cleared and balance reset successfully',
            newBalance: updatedUser.balance 
        });

    } catch (error) {
        res.status(500).json({ message: 'Failed to clear history or reset balance', error: error.message });
    }
};

// --- AI Integration ---
export const getSuggestion = async (req, res) => {
    try {
        const { playerHand, dealerCard } = req.body;

        if (!playerHand || !Array.isArray(playerHand) || playerHand.length === 0 || !dealerCard || !dealerCard.value) {
            return res.status(400).json({ message: "Invalid player hand or dealer card data provided." });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
        const playerHandValues = playerHand.map(c => c.value).join(', ');
        
        // MODIFIED: Updated prompt to ask for a reason in a JSON format
        const prompt = `You are a Blackjack strategy expert. Given my hand and the dealer's up-card, provide a recommendation. My hand is [${playerHandValues}] and the dealer's up-card is ${dealerCard.value}. Return your answer as a valid JSON object with two keys: "suggestion" (one word: Hit, Stand, Double, or Split) and "reason" (a brief explanation for your choice, in 1-2 sentences).`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();

        // Clean the response to ensure it's a valid JSON string
        const jsonString = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');

        // Parse the JSON string and send the object to the frontend
        const aiResponse = JSON.parse(jsonString);
        
        res.json(aiResponse);

    } catch (error) {
        console.error("AI suggestion error:", error);
        res.status(500).json({ message: "Failed to get AI suggestion", error: error.message });
    }
};

export const analyzeHistory = async (req, res) => {
    try {
        const { userId } = req.body;
        const history = await GameHistory.find({ userId }).sort({ playedAt: -1 }).limit(50);
        
        if (history.length === 0) {
            return res.json({ analysis: "Not enough data to analyze." });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
        const historySummary = history.map(game => {
             if (game.eventType === 'loan') {
                return `Took a loan of ${game.totalWinnings}.`;
            }
            // Add a check to prevent crash if playerScores is not an array
            const scores = Array.isArray(game.playerScores) ? game.playerScores.join('/') : 'N/A';
            return `Player had ${scores}, Dealer had ${game.dealerScore}. Result: ${game.result}. Winnings: ${game.totalWinnings}.`;
        }).join('\n');

        const prompt = `Based on the following Blackjack game history, analyze the player's style and provide some simple advice. Be encouraging.\n\nHistory:\n${historySummary}\n\nAnalysis:`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const analysis = response.text();

        res.json({ analysis });

    } catch (error) {
        console.error("AI analysis error:", error);
        res.status(500).json({ message: "Failed to analyze history", error: error.message });
    }
};

