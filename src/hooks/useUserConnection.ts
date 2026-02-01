import { useState, useCallback } from 'react';
import { toast } from 'sonner';

// Simple local state for connection tracking
// This can be replaced with a real backend implementation later
const connectionStates = new Map<string, 'none' | 'requested' | 'connected'>();

export type ConnectionState = 'none' | 'requested' | 'connected';

export const useUserConnection = (userId: string | null) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(() => {
    if (!userId) return 'none';
    return connectionStates.get(userId) || 'none';
  });
  const [isLoading, setIsLoading] = useState(false);

  const toggleConnection = useCallback(async () => {
    if (!userId) return;
    
    setIsLoading(true);
    
    // Simulate network request
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const currentState = connectionStates.get(userId) || 'none';
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
    
    connectionStates.set(userId, newState);
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
