import React, { createContext, useState, useContext } from 'react';

interface FolderContextType {
  folderPath: string | null;
  setFolderPath: (path: string | null) => void;
}

const FolderContext = createContext<FolderContextType | undefined>(undefined);

export const FolderContextProvider = ({ children } : { children: React.ReactNode }):JSX.Element => {
  const [folderPath, setFolderPath] = useState<string | null>(null);

  return (
    <FolderContext.Provider value={{ folderPath, setFolderPath }}>
      {children}
    </FolderContext.Provider>
  );
};

export const useFolderContext = () => {
  const context = useContext(FolderContext);
  if (!context) {
    throw new Error('useFolderContext must be used within a FolderContextProvider');
  }
  return context;
};
