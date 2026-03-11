import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useWorkspaceSocket({ workspaceId, isPersonal, onEvent }) {
  const clientRef = useRef(null);

  useEffect(() => {
    // Only connect for shared workspaces
    if (!workspaceId || isPersonal) return;

    const token = localStorage.getItem('authToken');
    if (!token) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${BASE_URL}/ws`),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/workspace/${workspaceId}`, (message) => {
          try {
            const event = JSON.parse(message.body);
            onEvent?.(event);
          } catch {
            // ignore malformed messages
          }
        });
      },
      onStompError: (frame) => {
        console.error('STOMP error', frame);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [workspaceId, isPersonal]);
}
