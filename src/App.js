import React, { useState } from 'react';
import './styles.css';

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [numPlayers, setNumPlayers] = useState(2);
  const [numRounds, setNumRounds] = useState(5);
  const [currentRound, setCurrentRound] = useState(1);
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [deck, setDeck] = useState([]);
  const [tableCard, setTableCard] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showWinner, setShowWinner] = useState(false);
  const [gameWinners, setGameWinners] = useState([]);
  // New flag to track whether the player has drawn a card this turn
  const [hasDrawn, setHasDrawn] = useState(false);

  // Initialize deck
  const initializeDeck = () => {
    const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
    const values = Array.from({ length: 13 }, (_, i) => i + 1);
    let newDeck = [];

    for (const suit of suits) {
      for (const value of values) {
        newDeck.push({ suit, value });
      }
    }

    return newDeck.sort(() => Math.random() - 0.5);
  };

  // Draw card from deck
  // Note: This function now just adds one card and sets a flag so that the player
  // can then play any card from their hand.
  const drawCard = () => {
    if (deck.length === 0) {
      reshuffleDeck();
      return;
    }
    // Prevent drawing more than one card per turn
    if (hasDrawn) return;

    const newDeck = [...deck];
    const newPlayers = [...players];
    const drawnCard = newDeck.pop();
    newPlayers[currentPlayer].hand.push(drawnCard);

    setDeck(newDeck);
    setPlayers(newPlayers);
    setHasDrawn(true);
  };

  // Reshuffle deck
  const reshuffleDeck = () => {
    const newDeck = initializeDeck();
    setDeck(newDeck);
  };

  // Play selected card
  const playCard = () => {
    if (selectedCard === null) return;

    const newPlayers = [...players];
    const playedCard = newPlayers[currentPlayer].hand[selectedCard];

    // If the player has not drawn a card this turn, enforce that the card must match the table card's value.
    // (This means the player is only allowed to play a non-matching card if they have drawn a card.)
    if (!hasDrawn && tableCard && playedCard.value !== tableCard.value) {
      alert("You must play a card that matches the table card's value!");
      return;
    }

    // Remove played card from hand
    newPlayers[currentPlayer].hand.splice(selectedCard, 1);

    // Check if the player has won by playing all cards
    if (newPlayers[currentPlayer].hand.length === 0) {
      handlePlayerWin();
      return;
    }

    // Update table card and reset state for next turn
    setTableCard(playedCard);
    setPlayers(newPlayers);
    setSelectedCard(null);
    setHasDrawn(false); // Reset draw flag since turn is over

    // Move to next player
    setCurrentPlayer((currentPlayer + 1) % players.length);
  };

  // Handle player winning by playing all cards
  const handlePlayerWin = () => {
    const newPlayers = [...players];
    newPlayers[currentPlayer].score += 4; // Bonus points for playing all cards
    setPlayers(newPlayers);
    startNewRound();
  };

  // Handle call (showing cards)
  const handleCall = () => {
    const newPlayers = [...players];
    let lowestSum = Infinity;
    let winners = [];

    // Calculate sums and find winners
    players.forEach((player, index) => {
      const sum = player.hand.reduce((total, card) => total + card.value, 0);
      if (sum < lowestSum) {
        lowestSum = sum;
        winners = [index];
      } else if (sum === lowestSum) {
        winners.push(index);
      }
    });

    // Update scores
    if (winners.includes(currentPlayer)) {
      newPlayers[currentPlayer].score += 3; // Caller wins
    } else {
      newPlayers[currentPlayer].score -= 2; // Caller loses
      winners.forEach(index => {
        newPlayers[index].score += 2; // Other winners
      });
    }

    setPlayers(newPlayers);
    startNewRound();
  };

  // Start new round
  const startNewRound = () => {
    setCurrentRound(prev => prev + 1);
    if (currentRound >= numRounds) {
      endGame();
      return;
    }

    const newDeck = initializeDeck();
    const newPlayers = players.map(player => ({
      ...player,
      hand: []
    }));

    // Deal new hands
    for (let i = 0; i < 5; i++) {
      for (let player of newPlayers) {
        player.hand.push(newDeck.pop());
      }
    }

    setDeck(newDeck);
    setPlayers(newPlayers);
    setTableCard(newDeck.pop());
    setCurrentPlayer(0);
    setHasDrawn(false);
  };

  // End game and determine winners
  const endGame = () => {
    const maxScore = Math.max(...players.map(p => p.score));
    const winners = players.filter(p => p.score === maxScore);
    setGameWinners(winners);
    setShowWinner(true);
  };

  // Start new game
  const handleStartGame = () => {
    const newDeck = initializeDeck();
    const newPlayers = Array.from({ length: numPlayers }, (_, i) => ({
      id: i,
      name: `Player ${i + 1}`,
      hand: [],
      score: 0
    }));

    // Deal initial cards
    for (let i = 0; i < 5; i++) {
      for (let player of newPlayers) {
        player.hand.push(newDeck.pop());
      }
    }

    setDeck(newDeck);
    setPlayers(newPlayers);
    setTableCard(newDeck.pop());
    setCurrentRound(1);
    setGameStarted(true);
    setCurrentPlayer(0);
    setHasDrawn(false);
  };

  // Reset game
  const resetGame = () => {
    setGameStarted(false);
    setShowWinner(false);
    setGameWinners([]);
    setPlayers([]);
    setDeck([]);
    setTableCard(null);
    setSelectedCard(null);
    setCurrentPlayer(0);
    setCurrentRound(1);
    setHasDrawn(false);
  };

  // If game has not started, show the setup screen.
  if (!gameStarted) {
    return (
      <div className="game-container">
        <div className="setup-form">
          <h1 className="title">Fadu Card Game</h1>
          
          <div className="input-group">
            <label>Number of Players:</label>
            <input
              type="number"
              min="2"
              max="8"
              value={numPlayers}
              onChange={(e) => setNumPlayers(parseInt(e.target.value))}
            />
          </div>

          <div className="input-group">
            <label>Number of Rounds:</label>
            <input
              type="number"
              min="1"
              value={numRounds}
              onChange={(e) => setNumRounds(parseInt(e.target.value))}
            />
          </div>

          <button className="start-button" onClick={handleStartGame}>
            Start Game
          </button>
        </div>
      </div>
    );
  }

  // Main game interface
  return (
    <div className="game-container">
      <div className="game-board">
        <div className="round-info">
          Round {currentRound} of {numRounds}
        </div>

        <h1 className="title">Current Player: {players[currentPlayer]?.name}</h1>
        
        <div className="scores-container">
          {players.map(player => (
            <div key={player.id} className="player-score">
              {player.name}: {player.score} points
            </div>
          ))}
        </div>

        <div className="table-area">
          {tableCard && (
            <div className="card">
              {tableCard.value} of {tableCard.suit}
            </div>
          )}
          <div className="deck-area">
            <div className="deck-card">
              Deck: {deck.length} cards
            </div>
          </div>
        </div>

        <div className="player-hand">
          <h2>Your Cards:</h2>
          <div className="cards-container">
            {players[currentPlayer]?.hand.map((card, index) => (
              <div
                key={index}
                className={`card ${selectedCard === index ? 'selected' : ''}`}
                onClick={() => setSelectedCard(index)}
              >
                {card.value} of {card.suit}
              </div>
            ))}
          </div>
        </div>

        <div className="controls">
          {/* 
              The Draw Card button is now disabled if:
              1. The player already drew a card this turn (hasDrawn is true), or 
              2. The player has at least one matching card in hand (so they must play that card).
          */}
          <button 
            className="game-button"
            onClick={drawCard}
            disabled={hasDrawn || (tableCard && players[currentPlayer]?.hand.some(
              card => card.value === tableCard.value
            ))}
          >
            Draw Card
          </button>
          <button 
            className="game-button"
            onClick={playCard}
            disabled={selectedCard === null}
          >
            Play Card
          </button>
          <button 
            className="game-button"
            onClick={handleCall}
          >
            Call
          </button>
        </div>
      </div>

      {/* Winner announcement overlay */}
      {showWinner && (
        <>
          <div className="overlay"></div>
          <div className="winner-announcement">
            <h2>Game Over!</h2>
            {gameWinners.length === 1 ? (
              <p>{gameWinners[0].name} wins with {gameWinners[0].score} points!</p>
            ) : (
              <div>
                <p>It's a tie between:</p>
                {gameWinners.map(winner => (
                  <p key={winner.id}>{winner.name} with {winner.score} points</p>
                ))}
              </div>
            )}
            <button className="start-button" onClick={resetGame}>
              Play Again
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
