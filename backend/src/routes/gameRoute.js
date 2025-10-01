import express from 'express';
import {
    startGame,
    saveGame,
    getHistory,
    getSuggestion,
    analyzeHistory,
    deleteGameHistory,
    recordLoan
} from '../controllers/gameController.js';

const router = express.Router();

// Route to start a new game and get initial hands/deck
router.get('/start', startGame);

// Route to save the result of a completed game
router.post('/save', saveGame);

// Route to get the game history for a specific user
router.get('/history/:userId', getHistory);

// Route to delete the game history for a specific user
router.delete('/history/:userId', deleteGameHistory);

// Route to get an AI suggestion for the current hand
router.post('/suggest', getSuggestion);

// Route to get an AI analysis of the player's history
router.post('/analyze', analyzeHistory);

// Route for recording a loan
router.post('/loan', recordLoan);

export default router;

