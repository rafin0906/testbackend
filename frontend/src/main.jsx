import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { RoomProvider } from './context/RoomContext';
import { PlayerProvider } from './context/PlayerContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  
    <PlayerProvider>
      <RoomProvider>

        <App />
        
      </RoomProvider>
    </PlayerProvider>
 
);
