import { useState, useEffect } from 'react';

export type NetworkConnection = {
  downlink: number;
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
  saveData: boolean;
};

export function useNetworkSpeed() {
  const [connection, setConnection] = useState<NetworkConnection | null>(null);

  useEffect(() => {
    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (conn) {
      const updateConnectionStatus = () => {
        setConnection({
          downlink: conn.downlink,
          effectiveType: conn.effectiveType,
          saveData: conn.saveData,
        });
      };

      conn.addEventListener('change', updateConnectionStatus);
      updateConnectionStatus();

      return () => conn.removeEventListener('change', updateConnectionStatus);
    }
  }, []);

  return {
    connection,
    isSlow: connection ? ['slow-2g', '2g', '3g'].includes(connection.effectiveType) : false,
    saveData: connection?.saveData || false,
  };
}
