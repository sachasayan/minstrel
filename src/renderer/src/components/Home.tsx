import React, { FC } from 'react';
import { useFolderContext } from '../context/FolderContext';
import Versions from './Versions';

const Home: FC = (): JSX.Element => {
  const { setFolderPath } = useFolderContext();

  const handleLoadFolder = async (): Promise<void> => {
    console.log('Load Folder button clicked');
    try {
      const result = await window.electron.dialog.showOpenDialog({
        properties: ['openDirectory']
      });

      if (result.filePaths && result.filePaths.length > 0) {
        setFolderPath(result.filePaths[0]);
        console.log('Selected folder:', result.filePaths[0]);
      } else {
        console.log('No folder selected');
      }
    } catch (error) {
      console.error('Error opening dialog:', error);
    }
  };

  return (
    <div>
      <h1>Home</h1>
      <button onClick={handleLoadFolder} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Load Folder
      </button>
      <Versions />
    </div>
  );
}

export default Home;
