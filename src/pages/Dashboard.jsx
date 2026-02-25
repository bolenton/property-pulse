import { useContext } from 'react';
import UserContext from '../context/UserContext';

function Dashboard() {
  const { user } = useContext(UserContext);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Welcome, {user?.email || 'User'}!</h2>
        <p className="text-gray-600">
          You are successfully logged in to Property Pulse. Use the navigation menu to access different sections of the application.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Criteria</h3>
          <p className="text-gray-600 mb-4">Define your property search criteria</p>
          <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none">
            Set Criteria
          </button>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Matches</h3>
          <p className="text-gray-600 mb-4">View properties matching your criteria</p>
          <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none">
            View Matches
          </button>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Settings</h3>
          <p className="text-gray-600 mb-4">Manage your account and preferences</p>
          <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none">
            Configure
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;