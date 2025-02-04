import Versions from './components/Versions'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Settings from './components/Settings';
import LeftPane from './components/LeftPane';

function App(): JSX.Element {
  // const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  return (
    <Router>
      <div className="flex h-screen">
        <LeftPane />
        <div className="w-3/4 p-4">
          {/* Right Pane */}
          <Routes>
            <Route path="/" element={
              <>
                <div className="float-right text-blue-500">Hello world. </div>
                <Versions></Versions>
              </>
            } />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App
