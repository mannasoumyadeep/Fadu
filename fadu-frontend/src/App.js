import React, { useState, useEffect } from 'react';
import './styles.css';

function App() {
  // Game state variables
  const [gameStarted, setGameStarted] = useState(false);
  const [numPlayers, setNumPlayers] = useState(2);
  const [numRounds, setNumRounds] = useState(5);
  const [currentRound, setCurrentRound] = useState(1);
  const [players, setPlayers] = useState([]);
  const [deck, setDeck] = useState([]);
  const [tableCard, setTableCard] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showWinner, setShowWinner] = useState(false);
  const [gameWinners, setGameWinners] = useState([]);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [playerName, setPlayerName] = useState('');

  // WebSocket state
  const roomId = "room1";
  const userId = playerName || "player1";  
  const [socket, setSocket] = useState(null);

  // IMPORTANT: Update this URL with your actual Render backend URL.
  const backendURL = "wss://fadu-backend.onrender.com";

  // Establish WebSocket connection when playerName is provided.
  useEffect(() => {
    if (!playerName) return;  // Wait until a name is entered.
    const ws = new WebSocket(`${backendURL}/ws/${roomId}/${userId}`);
    
    ws.onopen = () => {
      console.log('Connected to WebSocket server');
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Received:", data);
      
      if (data.type === "welcome") {
        // Set the initial hand for the player.
        setPlayers([{ id: userId, name: playerName, hand: data.hand, score: 0 }]);
      } else if (data.type === "update_hand") {
        // Update only this player’s hand.
        setPlayers(prevPlayers =>
          prevPlayers.map(player =>
            player.id === userId ? { ...player, hand: data.hand } : player
          )
        );
      } else if (data.type === "table_update") {
        // Update the public table card.
        if (data.tableCard) {
          setTableCard(data.tableCard);
        }
        console.log("Broadcast:", data.message);
      } else {
        console.log("Message:", data.message);
      }
    };
    
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
    
    ws.onclose = () => {
      console.log("WebSocket connection closed");
    };
    
    setSocket(ws);
    
    // Clean up on component unmount.
    return () => {
      ws.close();
    };
  }, [playerName, userId, roomId]);

  // Functions for actions
  const drawCard = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ action: "draw_card" }));
      setHasDrawn(true);
    } else {
      console.error("WebSocket is not open");
    }
  };

  const playCard = () => {
    if (selectedCard === null) return;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ action: "play_card", cardIndex: selectedCard }));
    } else {
      console.error("WebSocket is not open");
    }
  };

  const handleCall = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ action: "call" }));
    }
  };

  const handleStartGame = () => {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }
    setGameStarted(true);
  };

  const resetGame = () => {
    setGameStarted(false);
    setShowWinner(false);
    setGameWinners([]);
    setPlayers([]);
    setDeck([]);
    setTableCard(null);
    setSelectedCard(null);
    setCurrentRound(1);
    setHasDrawn(false);
    setPlayerName('');
  };

  if (!gameStarted) {
    return (
      <div className="game-container">
        <div className="setup-form">
          <h1 className="title">Fadu Card Game</h1>
          <div className="input-group">
            <label>Your Name:</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              required
            />
          </div>
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
          <button 
            className="start-button" 
            onClick={handleStartGame}
            disabled={!playerName.trim()}
          >
            Start Game
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="game-board">
        <div className="round-info">
          Round {currentRound} of {numRounds}
        </div>
        <h1 className="title">Current Player: {playerName}</h1>
        <div className="table-area">
          {tableCard && (
            <div className="card">
              {tableCard.value} of {tableCard.suit}
            </div>
          )}
        </div>
        <div className="player-hand">
          <h2>Your Cards:</h2>
          <div className="cards-container">
            {players.find(p => p.id === userId)?.hand.map((card, index) => (
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
          <button
            className="game-button"
            onClick={drawCard}
            disabled={hasDrawn}
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
          <button className="game-button" onClick={handleCall}>
            Call
          </button>
        </div>
      </div>
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
                  <p key={winner.id}>
                    {winner.name} with {winner.score} points
                  </p>
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
