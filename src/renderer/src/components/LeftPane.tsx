import { Link } from 'react-router-dom';
import ProjectDropdown from './ProjectDropdown';

function LeftPane(): JSX.Element {
  return (
    <div className="w-1/4 bg-gray-100 p-4">
      {/* Left Pane */}
      <ProjectDropdown />
      <Link to="/settings">
        <button className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Settings</button>
      </Link>
    </div>
  );
}

export default LeftPane;
