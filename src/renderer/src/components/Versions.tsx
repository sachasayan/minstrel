import { ReactNode, version } from 'react'

function Versions(): ReactNode {
  const versions = window?.electron?.process?.versions

  return (
    <ul className="versions">
      <li className="electron-version">Electron v{versions?.electron}</li>
      <li className="chrome-version">Chromium v{versions?.chrome}</li>
      <li className="node-version">Node v{versions?.node}</li>
      <li className="react-version">React v{version}</li>
    </ul>
  )
}

export default Versions
