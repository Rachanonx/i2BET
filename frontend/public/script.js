document.addEventListener('DOMContentLoaded', () => {
    // --- Global State & Constants ---
    const API_URL = 'http://54.88.103.230:3222/api';
    let deck = [];
    
    // Game State
    let dealerHand = [];
    let playerHands = [];
    let mainBets = [];
    let playerScores = [];
    let currentHandIndex = 0;
    let isGameInProgress = false;
    let hasSplitThisRound = false;

    // Bet Amounts
    let pairBet = 0;
    let twentyOnePlusThreeBet = 0;
    let insuranceBet = 0;
    
    let selectedBetType = 'main';
    let betHistory = [];
    let user = { id: null, userId: null, balance: 0 };

    // --- DOM Element References ---
    const screens = {
        auth: document.getElementById('auth-screen'),
        betting: document.getElementById('betting-screen'),
        game: document.getElementById('game-table'),
    };
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const authErrorEl = document.getElementById('auth-error');
    const logoutBtn = document.getElementById('logout-btn');
    const betAreas = document.querySelectorAll('.bet-area');
    const chipRack = document.querySelector('.chip-rack');
    const dealBtn = document.getElementById('deal-btn');
    const undoBtn = document.getElementById('undo-btn');
    const clearBetBtn = document.getElementById('clear-bet-btn');
    const mainBetAmountEl = document.getElementById('main-bet-amount');
    const pairBetAmountEl = document.getElementById('pair-bet-amount');
    const twentyoneBetAmountEl = document.getElementById('twentyone-bet-amount');
    const playerBalanceBettingEl = document.getElementById('player-balance-betting');
    const playerIdBettingEl = document.getElementById('player-id-betting');
    const dealerCardsEl = document.getElementById('dealer-cards');
    const playerHandsContainer = document.getElementById('player-hands-container');
    const dealerScoreEl = document.getElementById('dealer-score');
    const sideBetResultEl = document.getElementById('side-bet-result');
    const gameResultEl = document.getElementById('game-result');
    const currentMainBetEl = document.getElementById('current-main-bet');
    const currentPairBetEl = document.getElementById('current-pair-bet');
    const current21plus3BetEl = document.getElementById('current-21plus3-bet');
    const playerBalanceGameEl = document.getElementById('player-balance-game');
    const playerIdGameEl = document.getElementById('player-id-game');
    const hitBtn = document.getElementById('hit-btn');
    const standBtn = document.getElementById('stand-btn');
    const doubleDownBtn = document.getElementById('double-down-btn');
    const splitBtn = document.getElementById('split-btn');
    const aiSuggestionBtn = document.getElementById('ai-suggestion-btn');
    const historyBtn = document.getElementById('history-btn');
    const historyModal = document.getElementById('history-modal');
    const closeHistoryModalBtn = document.getElementById('close-history-modal');
    const historyContentEl = document.getElementById('history-content');
    const analyzeHistoryBtn = document.getElementById('analyze-history-btn');
    const aiAnalysisResultEl = document.getElementById('ai-analysis-result');
    const deleteHistoryBtn = document.getElementById('delete-history-btn');
    const confirmModal = document.getElementById('confirm-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    const loanBtn = document.getElementById('loan-btn');
    const historyBtnBetting = document.getElementById('history-btn-betting');
    const logoutBtnBetting = document.getElementById('logout-btn-betting');
    const customAlertModal = document.getElementById('custom-alert-modal');
    const customAlertTitle = document.getElementById('custom-alert-title');
    const customAlertMessage = document.getElementById('custom-alert-message');
    const customAlertCloseBtn = document.getElementById('custom-alert-close-btn');
    const insurancePrompt = document.getElementById('insurance-prompt');
    const insuranceYesBtn = document.getElementById('insurance-yes-btn');
    const insuranceNoBtn = document.getElementById('insurance-no-btn');

    // --- Screen Management & UI ---
    const switchScreen = (screenName) => {
        Object.values(screens).forEach(screen => screen.classList.remove('active'));
        if (screens[screenName]) screens[screenName].classList.add('active');
    };
    
    const showAlert = (message, title = 'Notification') => {
        customAlertTitle.textContent = title;
        customAlertMessage.textContent = message; // Using textContent allows \n to work with CSS white-space property
        customAlertModal.classList.add('active');
    };
    customAlertCloseBtn.addEventListener('click', () => customAlertModal.classList.remove('active'));

    // --- Authentication ---
    showRegisterLink.addEventListener('click', (e) => { e.preventDefault(); loginForm.style.display = 'none'; registerForm.style.display = 'block'; authErrorEl.textContent = ''; });
    showLoginLink.addEventListener('click', (e) => { e.preventDefault(); registerForm.style.display = 'none'; loginForm.style.display = 'block'; authErrorEl.textContent = ''; });

    loginBtn.addEventListener('click', async () => {
        const userId = document.getElementById('login-userid').value;
        const password = document.getElementById('login-password').value;
        if (!userId || !password) { authErrorEl.textContent = 'Please enter User ID and Password.'; return; }
        try {
            const res = await fetch(`${API_URL}/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            initializeUser(data.user);
        } catch (err) { authErrorEl.textContent = err.message; }
    });
    
    registerBtn.addEventListener('click', async () => {
        const userId = document.getElementById('register-userid').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        authErrorEl.textContent = '';
        if (!userId || !password || !confirmPassword) { authErrorEl.textContent = 'Please fill in all fields.'; return; }
        if (password !== confirmPassword) { authErrorEl.textContent = 'Passwords do not match.'; return; }
        try {
            const res = await fetch(`${API_URL}/users/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            showAlert('Registration successful! Please log in.', 'Success');
            showLoginLink.click();
            if (registerForm) {
    const inputs = registerForm.querySelectorAll('input');
    inputs.forEach(input => input.value = '');
}
        } catch (err) { authErrorEl.textContent = err.message; }
    });

    const handleLogout = () => {
        user = { id: null, userId: null, balance: 0 };
        resetForNewRound();
        switchScreen('auth');
    };
    logoutBtn.addEventListener('click', handleLogout);
    logoutBtnBetting.addEventListener('click', handleLogout);

    const initializeUser = (userData) => {
        if (!userData) { authErrorEl.textContent = "Failed to initialize user data."; return; }
        user.id = userData._id;
        user.userId = userData.userId;
        user.balance = userData.balance !== undefined ? userData.balance : 10000;
        playerIdBettingEl.textContent = user.userId;
        playerIdGameEl.textContent = user.userId;
        updateBalanceDisplay();
        switchScreen('betting');
    };
    
    const updateBalanceDisplay = () => {
        playerBalanceBettingEl.textContent = Math.round(user.balance);
        playerBalanceGameEl.textContent = Math.round(user.balance);
    };
    
    // --- Betting & Loan ---
    betAreas.forEach(area => area.addEventListener('click', () => { selectedBetType = area.dataset.betType; betAreas.forEach(a => a.classList.remove('selected')); area.classList.add('selected'); }));

    chipRack.addEventListener('click', (e) => {
        if (e.target.classList.contains('chip')) {
            const value = parseInt(e.target.dataset.value);
            if (user.balance >= value) {
                user.balance -= value;
                betHistory.push({ type: selectedBetType, value });
                if (selectedBetType === 'main') mainBets[0] = (mainBets[0] || 0) + value;
                else if (selectedBetType === 'pair') pairBet += value;
                else if (selectedBetType === 'twentyone') twentyOnePlusThreeBet += value;
                updateBetDisplay();
            } else { showAlert("You do not have enough balance to place this bet.", "Insufficient Funds"); }
        }
    });

    undoBtn.addEventListener('click', () => {
        if (betHistory.length > 0) {
            const lastBet = betHistory.pop();
            user.balance += lastBet.value;
            if (lastBet.type === 'main') mainBets[0] -= lastBet.value;
            else if (lastBet.type === 'pair') pairBet -= lastBet.value;
            else if (lastBet.type === 'twentyone') twentyOnePlusThreeBet -= lastBet.value;
            updateBetDisplay();
        }
    });
    
    clearBetBtn.addEventListener('click', () => {
        const totalBet = (mainBets[0] || 0) + pairBet + twentyOnePlusThreeBet;
        user.balance += totalBet;
        mainBets = [0]; pairBet = 0; twentyOnePlusThreeBet = 0; betHistory = [];
        updateBetDisplay();
    });

    loanBtn.addEventListener('click', async () => {
        const loanAmount = 5000;
        user.balance += loanAmount;
        updateBalanceDisplay();
        try {
            await fetch(`${API_URL}/game/loan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, loanAmount }) });
            await updateUserBalanceOnServer();
            showAlert(`A loan of ${loanAmount} has been added to your balance.`, 'Loan Successful');
        } catch (error) { console.error("Failed to record loan:", error); user.balance -= loanAmount; updateBalanceDisplay(); showAlert('There was an error processing your loan.', 'Loan Failed'); }
    });

    const updateBetDisplay = () => {
        mainBetAmountEl.textContent = mainBets[0] || 0;
        pairBetAmountEl.textContent = pairBet;
        twentyoneBetAmountEl.textContent = twentyOnePlusThreeBet;
        updateBalanceDisplay();
        dealBtn.disabled = (mainBets[0] || 0) === 0;
    };

    // --- Game Flow ---
    dealBtn.addEventListener('click', async () => {
        switchScreen('game');
        currentMainBetEl.textContent = mainBets[0];
        currentPairBetEl.textContent = pairBet;
        current21plus3BetEl.textContent = twentyOnePlusThreeBet;
        try {
            const response = await fetch(`${API_URL}/game/start`);
            const data = await response.json();
            deck = data.deck;
            isGameInProgress = true;
            playerHands = [data.playerHand];
            dealerHand = data.dealerHand;
            startGame();
        } catch (error) { console.error("Failed to start game:", error); gameResultEl.textContent = 'Server error.'; }
    });
    
    const startGame = () => {
        currentHandIndex = 0;
        playerScores = [calculateScore(playerHands[0])];
        renderAll();
        checkSideBets();

        const playerHasBlackjack = playerScores[0] === 21;

        if (dealerHand[0].value === 'A') {
            insurancePrompt.style.display = 'block';
            setPlayerActions(false);
        } else if (playerHasBlackjack) {
            dealerTurn(); // If player has BJ, proceed to dealer's turn to check for push
        } else {
            setPlayerActions(true);
        }
    };

    const continueGameAfterInsurance = () => {
        insurancePrompt.style.display = 'none';
        const dealerHasBlackjack = calculateScore(dealerHand) === 21;

        if (dealerHasBlackjack) {
            isGameInProgress = false;
            setPlayerActions(false);
            renderAll(true);

            let insuranceWinnings = 0;
            let resultText = '';

            if (insuranceBet > 0) {
                const payout = insuranceBet * 2;
                user.balance += insuranceBet + payout;
                insuranceWinnings = payout;
                resultText += `Insurance Wins (+${payout}). `;
            }

            const playerHasBlackjack = playerScores[0] === 21;
            if (playerHasBlackjack) {
                resultText += "Main Bet: Push.";
                user.balance += mainBets[0];
            } else {
                resultText += "Main Bet: Loss.";
            }

            gameResultEl.textContent = resultText;
            updateBalanceDisplay();
            
            saveGameResult(resultText, 'insurance_payout', insuranceWinnings - mainBets[0], calculateScore(dealerHand));
            updateUserBalanceOnServer();
            setTimeout(resetForNewRound, 5000);

        } else {
            if (insuranceBet > 0) {
                showAlert('Insurance Lost.', 'Loss');
            }
            if (playerScores[0] === 21) {
                dealerTurn();
            } else {
                setPlayerActions(true);
            }
        }
    };

    insuranceYesBtn.addEventListener('click', () => {
        const cost = mainBets[0] / 2;
        if (user.balance >= cost) {
            user.balance -= cost;
            insuranceBet = cost;
            updateBalanceDisplay();
            continueGameAfterInsurance();
        } else {
            showAlert('Not enough balance for insurance.', 'Insufficient Funds');
        }
    });

    insuranceNoBtn.addEventListener('click', continueGameAfterInsurance);
    
    hitBtn.addEventListener('click', () => {
        if (!isGameInProgress) return;
        playerHands[currentHandIndex].push(deck.pop());
        playerScores[currentHandIndex] = calculateScore(playerHands[currentHandIndex]);
        renderAll();

        if (playerScores[currentHandIndex] >= 21) {
            playNextHand();
        } else {
            setPlayerActions(true);
        }
    });

    standBtn.addEventListener('click', () => {
        if (!isGameInProgress) return;
        playNextHand();
    });

    const playNextHand = () => {
        if (currentHandIndex < playerHands.length - 1) {
            currentHandIndex++;
            setPlayerActions(true);
            renderAll();
        } else {
            dealerTurn();
        }
    };
    
    doubleDownBtn.addEventListener('click', () => {
        if (!isGameInProgress) return;
        const bet = mainBets[currentHandIndex];
        if (user.balance >= bet) {
            user.balance -= bet;
            mainBets[currentHandIndex] *= 2;
            playerHands[currentHandIndex].push(deck.pop());
            playerScores[currentHandIndex] = calculateScore(playerHands[currentHandIndex]);
            renderAll();
            playNextHand();
        } else {
            showAlert("Not enough balance to double down.", "Insufficient Funds");
        }
    });

    splitBtn.addEventListener('click', () => {
        if (!isGameInProgress) return;
        const hand = playerHands[currentHandIndex];
        const bet = mainBets[currentHandIndex];
        if (user.balance >= bet) {
            user.balance -= bet;
            hasSplitThisRound = true;
            const newHand = [hand.pop()];
            playerHands.splice(currentHandIndex + 1, 0, newHand);
            mainBets.splice(currentHandIndex + 1, 0, bet);
            
            playerHands[currentHandIndex].push(deck.pop());
            playerHands[currentHandIndex + 1].push(deck.pop());
            
            playerScores = playerHands.map(calculateScore);
            setPlayerActions(true);
            renderAll();
        } else {
            showAlert('Not enough balance to split.', 'Insufficient Funds');
        }
    });

    const dealerTurn = () => {
        isGameInProgress = false;
        setPlayerActions(false);
        
        // If the player's first hand is a blackjack, the dealer only plays if they also might have blackjack.
        // In our simplified game, we let the dealer's turn play out to reveal their hand.
        const dealerInterval = setInterval(() => {
            let dealerScore = calculateScore(dealerHand);
            // Dealer hits on soft 17 as per common rules
            if (dealerScore < 17 || (dealerScore === 17 && dealerHand.some(c => c.value === 'A' && calculateScore(dealerHand) === 17))) {
                dealerHand.push(deck.pop());
                renderAll(true);
            } else {
                clearInterval(dealerInterval);
                endGame();
            }
        }, 1000);
        renderAll(true); // Initial reveal
    };
    
    // REVAMPED endGame function to correctly handle Blackjack payouts
    const endGame = async () => {
        const dealerScore = calculateScore(dealerHand);
        let finalWinnings = 0;
        let finalResultText = '';

        playerHands.forEach((hand, index) => {
            const playerScore = calculateScore(hand);
            const bet = mainBets[index];
            let resultText;

            // Check for player's natural blackjack (only on first hand, not after split)
            const playerHasBlackjack = playerScore === 21 && hand.length === 2 && playerHands.length === 1 && !hasSplitThisRound;
            const dealerHasBlackjack = dealerScore === 21 && dealerHand.length === 2;

            if (playerHasBlackjack && !dealerHasBlackjack) {
                resultText = 'Blackjack!';
                const winnings = bet * 1.5;
                user.balance += bet + winnings; // Return original bet + 3:2 winnings
                finalWinnings += winnings;
            } else if (playerScore > 21) {
                resultText = 'Player Bust!';
                finalWinnings -= bet; // Loss is already deducted from balance when betting
            } else if (dealerHasBlackjack && !playerHasBlackjack) {
                resultText = 'Player Loss.'; // Dealer Blackjack wins
                finalWinnings -= bet;
            } else if (dealerScore > 21 || playerScore > dealerScore) {
                resultText = 'Player Win!';
                user.balance += bet * 2; // Payout for a normal win (1:1) + original bet
                finalWinnings += bet;
            } else if (playerScore < dealerScore) {
                resultText = 'Player Loss.';
                finalWinnings -= bet;
            } else { // This covers Player BJ vs Dealer BJ, and regular ties
                resultText = 'Player Push.';
                user.balance += bet; // Return original bet
            }
            
            if (playerHands.length > 1) {
                finalResultText += `Hand ${index + 1}: ${resultText}<br>`;
            } else {
                finalResultText = resultText;
            }
        });
        
        gameResultEl.innerHTML = finalResultText.trim();
        updateBalanceDisplay();
        
        await saveGameResult(finalResultText.replace(/<br>/g, ' '), 'n/a', finalWinnings, dealerScore);
        await updateUserBalanceOnServer();

        setTimeout(resetForNewRound, 5000);
    };
    
    const renderAll = (isDealerTurn = false) => {
        dealerCardsEl.innerHTML = dealerHand.map((card, index) => getCardHTML(card, index === 0 || isDealerTurn)).join('');
        const dealerScore = calculateScore(dealerHand);
        dealerScoreEl.textContent = isDealerTurn || !isGameInProgress ? dealerScore : calculateScore([dealerHand[0]]);
        
        playerHandsContainer.innerHTML = '';
        playerHands.forEach((hand, index) => {
            const handEl = document.createElement('div');
            handEl.className = `player-hand ${index === currentHandIndex && isGameInProgress ? 'active' : ''}`;
            const cardsEl = document.createElement('div');
            cardsEl.className = 'cards-container';
            cardsEl.innerHTML = hand.map(card => getCardHTML(card, true)).join('');
            const scoreEl = document.createElement('div');
            scoreEl.className = 'player-hand-score';
            scoreEl.textContent = `Score: ${calculateScore(hand)}`;
            handEl.appendChild(cardsEl);
            handEl.appendChild(scoreEl);
            playerHandsContainer.appendChild(handEl);
        });
    };
    
    const getCardHTML = (card, isRevealed) => {
        if (!card) return '';
        if (!isRevealed) return `<div class="card hidden"></div>`;
        const suitSymbols = { 'Hearts': '♥', 'Diamonds': '♦', 'Clubs': '♣', 'Spades': '♠' };
        const isRed = card.suit === 'Hearts' || card.suit === 'Diamonds';
        return `<div class="card ${isRed ? 'red' : ''}"><span class="value">${card.value}</span><span class="suit">${suitSymbols[card.suit]}</span></div>`;
    };

    const calculateScore = (hand) => {
        let score = 0, aceCount = 0;
        if (!hand) return 0;
        hand.forEach(card => {
            if (!card) return;
            if (['J', 'Q', 'K'].includes(card.value)) score += 10;
            else if (card.value === 'A') { aceCount++; score += 11; }
            else score += parseInt(card.value);
        });
        while (score > 21 && aceCount > 0) { score -= 10; aceCount--; }
        return score;
    };
    
    const setPlayerActions = (enabled) => {
        hitBtn.disabled = !enabled;
        standBtn.disabled = !enabled;
        
        const hand = playerHands[currentHandIndex];
        const bet = mainBets[currentHandIndex];
        if (!hand) return;

        doubleDownBtn.disabled = !(enabled && hand.length === 2 && user.balance >= bet);
        splitBtn.disabled = !(enabled && hand.length === 2 && hand[0].value === hand[1].value && user.balance >= bet && !hasSplitThisRound);
    };

    const resetForNewRound = () => {
        isGameInProgress = false;
        hasSplitThisRound = false;
        mainBets = [0]; pairBet = 0; twentyOnePlusThreeBet = 0; insuranceBet = 0; betHistory = [];
        playerHands = []; dealerHand = [];
        updateBetDisplay();
        switchScreen('betting');
        gameResultEl.textContent = ''; sideBetResultEl.textContent = '';
        playerHandsContainer.innerHTML = ''; dealerCardsEl.innerHTML = '';
        dealerScoreEl.textContent = '';
    };

    const checkSideBets = () => {
        let winnings = 0;
        let sideBetResult = 'none';
        const resultMessages = [];

        if (pairBet > 0) {
            if (playerHands[0][0].value === playerHands[0][1].value) {
                const winAmount = pairBet * 11;
                winnings += winAmount;
                resultMessages.push(`<span>Pair Bet: <strong class="win">Win (+${winAmount})</strong></span>`);
                sideBetResult = 'pair_win';
            } else {
                resultMessages.push(`<span>Pair Bet: <strong class="loss">Loss</strong></span>`);
            }
        }
        
        if (twentyOnePlusThreeBet > 0) {
            const threeCards = [playerHands[0][0], playerHands[0][1], dealerHand[0]];
            const result = checkPokerHand(threeCards);
            if(result.payout > 0) {
                 const winAmount = twentyOnePlusThreeBet * result.payout;
                 winnings += winAmount;
                 resultMessages.push(`<span>21+3 Bet: <strong class="win">Win (+${winAmount})</strong></span>`);
                 sideBetResult = sideBetResult === 'none' ? `21+3_win` : `${sideBetResult}_and_21+3_win`;
            } else {
                resultMessages.push(`<span>21+3 Bet: <strong class="loss">Loss</strong></span>`);
            }
        }
        
        sideBetResultEl.innerHTML = resultMessages.join('');
        user.balance += winnings;
        updateBalanceDisplay();
        return {winnings, result: sideBetResult};
    };
    
    const checkPokerHand = (cards) => {
        const values = cards.map(c => c.value);
        const suits = cards.map(c => c.suit);
        const isFlush = suits.every(s => s === suits[0]);
        const rankMap = {'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14};
        const ranks = values.map(v => rankMap[v]).sort((a,b) => a-b);
        const isStraight = ranks[2] - ranks[1] === 1 && ranks[1] - ranks[0] === 1;
        const isThreeOfAKind = values[0] === values[1] && values[1] === values[2];
        if (isStraight && isFlush) return { name: 'straight_flush', payout: 40 };
        if (isThreeOfAKind) return { name: 'three_of_a_kind', payout: 30 };
        if (isStraight) return { name: 'straight', payout: 10 };
        if (isFlush) return { name: 'flush', payout: 5 };
        return { name: 'none', payout: 0 };
    };

    const handleHistoryClick = async () => {
        if (!user.id) return;
        historyModal.classList.add('active');
        historyContentEl.innerHTML = '<p>Loading history...</p>';
        aiAnalysisResultEl.innerHTML = '';
        try {
            const res = await fetch(`${API_URL}/game/history/${user.id}`);
            const history = await res.json();
            if (history.length > 0) {
                historyContentEl.innerHTML = history.map(game => {
                    if (game.eventType === 'loan') {
                        return `<p style="color: #29b6f6;">
                                    <strong>${new Date(game.playedAt).toLocaleString()}</strong> - 
                                    Took a loan of: ${game.totalWinnings}
                                </p>`;
                    }
                    const playerScoresText = Array.isArray(game.playerScores) ? game.playerScores.join(', ') : game.playerScore;
                    return `<p>
                                <strong>${new Date(game.playedAt).toLocaleString()}</strong> - 
                                Result: ${game.result} (Winnings: ${game.totalWinnings})<br>
                                Your Hand(s): ${playerScoresText} | Dealer Hand: ${game.dealerScore}
                            </p>`;
                }).join('');
                analyzeHistoryBtn.style.display = 'inline-block';
                deleteHistoryBtn.style.display = 'inline-block';
            } else {
                historyContentEl.innerHTML = '<p>No game history found.</p>';
                analyzeHistoryBtn.style.display = 'none';
                deleteHistoryBtn.style.display = 'none';
            }
        } catch (err) {
            historyContentEl.innerHTML = '<p>Error loading history.</p>';
        }
    };
    historyBtn.addEventListener('click', handleHistoryClick);
    historyBtnBetting.addEventListener('click', handleHistoryClick);
    closeHistoryModalBtn.addEventListener('click', () => historyModal.classList.remove('active'));

    aiSuggestionBtn.addEventListener('click', async () => {
        aiSuggestionBtn.disabled = true;
        aiSuggestionBtn.textContent = 'Thinking...';
        try {
            const res = await fetch(`${API_URL}/game/suggest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerHand: playerHands[currentHandIndex],
                    dealerCard: dealerHand[0]
                })
            });
            const { suggestion, reason } = await res.json();
            showAlert(`AI Suggestion: ${suggestion}\n\nReason: ${reason}`, 'AI Advice');
        } catch (err) {
            showAlert('Could not get AI suggestion.', 'Error');
        } finally {
            aiSuggestionBtn.disabled = false;
            aiSuggestionBtn.textContent = 'Get AI Suggestion';
        }
    });

    analyzeHistoryBtn.addEventListener('click', async () => {
        analyzeHistoryBtn.disabled = true;
        analyzeHistoryBtn.textContent = 'Analyzing...';
        aiAnalysisResultEl.innerHTML = 'AI is analyzing your gameplay...';
        try {
            const res = await fetch(`${API_URL}/game/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id })
            });
            const { analysis } = await res.json();
            aiAnalysisResultEl.innerHTML = analysis;
        } catch (err) {
            aiAnalysisResultEl.innerHTML = 'Error getting analysis.';
        } finally {
            analyzeHistoryBtn.disabled = false;
            analyzeHistoryBtn.textContent = 'Analyze with AI';
        }
    });
    
    deleteHistoryBtn.addEventListener('click', () => confirmModal.classList.add('active'));
    cancelDeleteBtn.addEventListener('click', () => confirmModal.classList.remove('active'));
    confirmDeleteBtn.addEventListener('click', async () => {
        confirmDeleteBtn.disabled = true;
        confirmDeleteBtn.textContent = 'Deleting...';
        try {
            const res = await fetch(`${API_URL}/game/history/${user.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete history');
            const data = await res.json();
            
            user.balance = data.newBalance; 
            updateBalanceDisplay();
            
            historyContentEl.textContent = 'History has been cleared and balance reset to 10,000.';
            analyzeHistoryBtn.style.display = 'none';
            deleteHistoryBtn.style.display = 'none';
            aiAnalysisResultEl.innerHTML = '';
        } catch (err) {
            console.error(err);
        } finally {
            confirmModal.classList.remove('active');
            confirmDeleteBtn.disabled = false;
            confirmDeleteBtn.textContent = 'Yes, Delete';
        }
    });
    
    async function saveGameResult(result, sideBetResult, totalWinnings, dealerScore) {
        if (!user.id) return;
        try {
            await fetch(`${API_URL}/game/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    mainBets,
                    pairBet,
                    twentyOnePlusThreeBet,
                    result,
                    sideBetResult,
                    totalWinnings,
                    playerHands,
                    dealerHand,
                    playerScores: playerHands.map(calculateScore),
                    dealerScore,
                })
            });
        } catch (error) { console.error("Failed to save game result:", error); }
    }
    
    async function updateUserBalanceOnServer() {
         if (!user.id) return;
         try {
            await fetch(`${API_URL}/users/balance`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, newBalance: user.balance })
            });
        } catch (error) { console.error("Failed to update balance on server:", error); }
    }

    // --- Initialize ---
    switchScreen('auth');
});

