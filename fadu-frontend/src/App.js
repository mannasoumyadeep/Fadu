import React, { useState, useEffect } from 'react';
import './styles.css';

function App() {
  // Game state variables
  const [roomCode, setRoomCode] = useState('');
  const [isCreatingGame, setIsCreatingGame] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [numPlayers, setNumPlayers] = useState(2);
  const [numRounds, setNumRounds] = useState(5);
  const [currentRound, setCurrentRound] = useState(1);
  const [players, setPlayers] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [tableCard, setTableCard] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showWinner, setShowWinner] = useState(false);
  const [gameWinners, setGameWinners] = useState([]);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [socket, setSocket] = useState(null);
  const [showRoomCode, setShowRoomCode] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState('');

  const backendURL = "wss://fadu-backend.onrender.com";

  useEffect(() => {
    if (!playerName || !roomCode || !gameStarted) return;

    setIsConnecting(true);
    setConnectionError('');
    console.log(`Connecting to room ${roomCode} as ${playerName}`);
    
    const ws = new WebSocket(`${backendURL}/ws/${roomCode}/${playerName}`);
    
    ws.onopen = () => {
      console.log('Connected to game server');
      setIsConnecting(false);
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Received:", data);
      
      switch(data.type) {
        case "welcome":
          setPlayers(prevPlayers => {
            const newPlayer = { id: playerName, name: playerName, hand: data.hand, score: 0 };
            if (!prevPlayers.find(p => p.id === playerName)) {
              return [...prevPlayers, newPlayer];
            }
            return prevPlayers;
          });
          setCurrentTurn(data.current_turn);
          if (data.tableCard) setTableCard(data.tableCard);
          break;

        case "player_joined":
          console.log(`${data.user} joined the game`);
          if (data.players_in_room) {
            setPlayers(data.players_in_room.map(pid => ({
              id: pid,
              name: pid,
              hand: pid === playerName ? players.find(p => p.id === playerName)?.hand || [] : [],
              score: 0
            })));
          }
          break;

        case "update_hand":
          setPlayers(prevPlayers =>
            prevPlayers.map(player =>
              player.id === playerName ? { ...player, hand: data.hand } : player
            )
          );
          setHasDrawn(true);
          break;

        case "table_update":
          setTableCard(data.tableCard);
          setSelectedCard(null);
          setHasDrawn(false);
          break;

        case "turn_update":
          setCurrentTurn(data.current_turn);
          setHasDrawn(false);
          break;

        case "player_left":
          setPlayers(prevPlayers => prevPlayers.filter(p => p.id !== data.user));
          if (data.current_turn) setCurrentTurn(data.current_turn);
          break;

        case "error":
          setConnectionError(data.message);
          break;

        default:
          console.log("Unhandled message type:", data.type);
      }
    };
    
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setConnectionError('Failed to connect to game server');
      setIsConnecting(false);
    };
    
    ws.onclose = () => {
      console.log("Disconnected from game server");
      setIsConnecting(false);
    };
    
    setSocket(ws);
    
    return () => {
      ws.close();
    };
  }, [playerName, roomCode, gameStarted]);

  const handleCreateGame = () => {
    const newRoomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomCode(newRoomCode);
    setShowRoomCode(true);
    handleStartGame();
  };

  const handleJoinGame = () => {
    handleStartGame();
  };

  const handleStartGame = () => {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }
    setGameStarted(true);
  };

  const drawCard = () => {
    if (socket?.readyState === WebSocket.OPEN && currentTurn === playerName && !hasDrawn) {
      socket.send(JSON.stringify({ action: "draw_card" }));
    }
  };

  const playCard = () => {
    if (socket?.readyState === WebSocket.OPEN && currentTurn === playerName && selectedCard !== null) {
      socket.send(JSON.stringify({ action: "play_card", cardIndex: selectedCard }));
    }
  };

  const handleCall = () => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ action: "call" }));
    }
  };

  const resetGame = () => {
    setGameStarted(false);
    setShowWinner(false);
    setGameWinners([]);
    setPlayers([]);
    setTableCard(null);
    setSelectedCard(null);
    setCurrentRound(1);
    setHasDrawn(false);
    setPlayerName('');
    setRoomCode('');
    setShowRoomCode(false);
    setIsCreatingGame(true);
    if (socket?.readyState === WebSocket.OPEN) {
      socket.close();
    }
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

          <div className="game-mode-selector">
            <button 
              className={`mode-button ${isCreatingGame ? 'active' : ''}`}
              onClick={() => setIsCreatingGame(true)}
            >
              Create Room
            </button>
            <button 
              className={`mode-button ${!isCreatingGame ? 'active' : ''}`}
              onClick={() => setIsCreatingGame(false)}
            >
              Join Room
            </button>
          </div>

          {isCreatingGame ? (
            <>
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
            </>
          ) : (
            <div className="input-group">
              <label>Room Code:</label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter room code"
                required
              />
            </div>
          )}

          <button 
            className="start-button"
            onClick={isCreatingGame ? handleCreateGame : handleJoinGame}
            disabled={!playerName.trim() || (!isCreatingGame && !roomCode.trim())}
          >
            {isCreatingGame ? 'Create Room' : 'Join Room'}
          </button>

          {showRoomCode && (
            <div className="room-code-display">
              <p>Your Room Code: <strong>{roomCode}</strong></p>
              <p>Share this code with other players to join!</p>
            </div>
          )}

          {connectionError && (
            <div className="error-message">
              {connectionError}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="game-board">
        <div className="game-info">
          <div className="round-info">
            Round {currentRound} of {numRounds}
          </div>
          <div className="room-info">
            Room Code: {roomCode}
          </div>
        </div>
        
        <h1 className="title">Current Player: {currentTurn}</h1>
        
        <div className="players-list">
          {players.map(player => (
            <div key={player.id} className={`player-info ${currentTurn === player.id ? 'current-turn' : ''}`}>
              {player.name} {player.id === playerName ? '(You)' : ''} - Score: {player.score}
            </div>
          ))}
        </div>

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
            {players.find(p => p.id === playerName)?.hand.map((card, index) => (
              <div
                key={index}
                className={`card ${selectedCard === index ? 'selected' : ''}`}
                onClick={() => currentTurn === playerName && setSelectedCard(index)}
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
            disabled={currentTurn !== playerName || hasDrawn}
          >
            Draw Card
          </button>
          <button
            className="game-button"
            onClick={playCard}
            disabled={currentTurn !== playerName || selectedCard === null}
          >
            Play Card
          </button>
          <button 
            className="game-button" 
            onClick={handleCall}
            disabled={currentTurn !== playerName}
          >
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