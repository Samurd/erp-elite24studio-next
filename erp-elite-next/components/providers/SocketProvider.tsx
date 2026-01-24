'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

const SocketContext = createContext<Socket | null>(null);

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const isErrorShownRef = useRef(false);

    useEffect(() => {
        // Connect to NestJS backend
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
        const newSocket = io(socketUrl, {
            transports: ['websocket'],
            autoConnect: true,
            // Example auth: extraHeaders: { Authorization: `Bearer ${token}` }
        });

        newSocket.on('connect', () => {
            // console.log('✅ Socket.IO connected:', newSocket.id);
            isErrorShownRef.current = false;
            toast.success('Conexión en tiempo real establecida');
        });

        newSocket.on('disconnect', () => {
            // console.log('❌ Socket.IO disconnected');
            if (!isErrorShownRef.current) {
                toast.error('Desconectado del servidor en tiempo real. Intentando reconectar...');
                isErrorShownRef.current = true;
            }
        });

        newSocket.on('connect_error', (error) => {
            // console.error('🔴 Socket.IO connection error:', error);
            if (!isErrorShownRef.current) {
                toast.error('Error de conexión en tiempo real: ' + error);
                isErrorShownRef.current = true;
            }
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
