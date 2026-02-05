import { useState, useCallback } from 'react';
import { toast } from 'sonner';

// Persistent local storage for connection tracking
// This can be replaced with a real backend implementation later
const STORAGE_KEY = 'user_connections';

const getStoredConnections = (): Record<string, 'none' | 'requested' | 'connected'> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const saveConnections = (connections: Record<string, 'none' | 'requested' | 'connected'>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(connections));
  } catch {
    // Ignore storage errors
  }
};

export type ConnectionState = 'none' | 'requested' | 'connected';

export const useUserConnection = (userId: string | null) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(() => {
    if (!userId) return 'none';
    const stored = getStoredConnections();
    return stored[userId] || 'none';
  });
  const [isLoading, setIsLoading] = useState(false);

  const toggleConnection = useCallback(async () => {
    if (!userId) return;
    
    setIsLoading(true);
    
    // Simulate network request
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const connections = getStoredConnections();
    const currentState = connections[userId] || 'none';
    let newState: ConnectionState;
    
    if (currentState === 'none') {
      newState = 'requested';
      toast.success('Connection request sent!');
    } else if (currentState === 'requested') {
      newState = 'none';
      toast.info('Connection request cancelled');
    } else {
      newState = 'none';
      toast.info('Connection removed');
    }
    
    connections[userId] = newState;
    saveConnections(connections);
    setConnectionState(newState);
    setIsLoading(false);
  }, [userId]);

  const getConnectionLabel = useCallback(() => {
    switch (connectionState) {
      case 'requested': return 'Requested';
      case 'connected': return 'Connected';
      default: return 'Connect';
    }
  }, [connectionState]);

  return {
    connectionState,
    isLoading,
    toggleConnection,
    getConnectionLabel,
  };
};
