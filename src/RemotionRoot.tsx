import React from 'react';

// Context untuk menyediakan Remotion APIs ke seluruh aplikasi
export const RemotionContext = React.createContext<{
  isReady: boolean;
}>({
  isReady: false,
});

interface RemotionRootProps {
  children: React.ReactNode;
}

export const RemotionRoot: React.FC<RemotionRootProps> = ({ children }) => {
  // Remotion Player sudah menguruskan interna
  // Component ini berfungsi sebagai wrapper untuk future extensibility
  
  return (
    <RemotionContext.Provider value={{ isReady: true }}>
      {children}
    </RemotionContext.Provider>
  );
};
