import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Game state
  const [playerRole, setPlayerRole] = useState(null);
  const [roleDescription, setRoleDescription] = useState('');
  const [players, setPlayers] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [roomCode, setRoomCode] = useState('');

  useEffect(() => {
    // Connect to server
    const newSocket = io('http://localhost:8000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    // Listen for role assignment (ONLY this player will receive this)
    newSocket.on('role-assigned', ({ role, description, roundId }) => {
      setPlayerRole(role);
      setRoleDescription(description);
      console.log('My role:', role);
    });

    // Listen for player list updates
    newSocket.on('players-updated', ({ players, playerCount }) => {
      setPlayers(players);
      console.log('Players in room:', playerCount);
    });

    // Listen for game start
    newSocket.on('game-started', () => {
      setGameStarted(true);
      console.log('Game started!');
    });

    // Listen for room full
    newSocket.on('room-full', () => {
      alert('Room is full! Cannot join.');
    });

    // Listen for player left
    newSocket.on('player-left', ({ players, playerCount }) => {
      setPlayers(players);
      setGameStarted(false);
      setPlayerRole(null);
      setRoleDescription('');
      console.log('Player left. Game reset.');
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Join room function
  const joinRoom = (roomCode, playerName) => {
    if (socket && isConnected) {
      setRoomCode(roomCode);
      socket.emit('join-room', { roomCode, playerName });
    }
  };

  return {
    socket,
    isConnected,
    playerRole,
    roleDescription,
    players,
    gameStarted,
    roomCode,
    joinRoom
  };
};

export default useSocket;