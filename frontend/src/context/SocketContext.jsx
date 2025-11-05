import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

// provide safe defaults so useSocket() won't be undefined if provider is missing
const SocketContext = createContext({
    socket: null,
    setRegisterData: () => { },
});

export function SocketProvider({ children }) {
    const [socket, setSocket] = useState(null);
    const [registerData, setRegisterData] = useState(null); // { userId, roomId }

    useEffect(() => {
        if (!registerData) return;
        if (socket) return; // already connected

        const url = process.env.REACT_APP_SOCKET_URL || window.location.origin;
        const s = io(url, { withCredentials: true });
        setSocket(s);

        s.on("connect", () => {
            console.log("socket connected:", s.id);
            // emit register to server so server can map socketId -> user and join room
            s.emit("register", { userId: registerData.userId, roomId: registerData.roomId });
        });

        s.on("connect_error", (err) => {
            console.error("socket connect_error:", err);
        });

        return () => {
            if (s) s.disconnect();
            setSocket(null);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [registerData]);

    return (
        <SocketContext.Provider value={{ socket, setRegisterData }}>
            {children}
        </SocketContext.Provider>
    );
}

export const useSocket = () => useContext(SocketContext);