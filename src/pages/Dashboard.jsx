import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';

function Dashboard() {
  const { user } = useUser();
  const [criteria, setCriteria] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch criteria
      const { data: criteriaData, error: criteriaError } = await supabase
        .from('criteria')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (criteriaError) throw criteriaError;
      setCriteria(criteriaData || []);

      // Fetch matches for these criteria
      if (criteriaData && criteriaData.length > 0) {
        const criteriaIds = criteriaData.map(c => c.id);
        const { data: matchesData, error: matchesError } = await supabase
          .from('matches')
          .select('*')
          .in('criteria_id', criteriaIds)
          .order('found_at', { ascending: false });

        if (matchesError) throw matchesError;
        setMatches(matchesData || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Welcome, {user?.email?.split('@')[0] || 'User'}!</h2>
        <p className="text-gray-600">
          You have {criteria.length} active search criteria and {matches.length} total matches.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link to="/criteria" className="bg-white shadow rounded-lg p-6 hover:shadow-md transition">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Criteria</h3>
          <p className="text-gray-600 mb-4">Define your property search criteria</p>
          <span className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600">
            {criteria.length > 0 ? 'Edit Criteria' : 'Set Criteria'}
          </span>
        </Link>

        <Link to="/matches" className="bg-white shadow rounded-lg p-6 hover:shadow-md transition">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Matches</h3>
          <p className="text-gray-600 mb-4">View properties matching your criteria</p>
          <span className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600">
            View {matches.length} Matches
          </span>
        </Link>

        <Link to="/settings" className="bg-white shadow rounded-lg p-6 hover:shadow-md transition">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Settings</h3>
          <p className="text-gray-600 mb-4">Manage your account and preferences</p>
          <span className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600">
            Configure
          </span>
        </Link>
      </div>

      {criteria.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Your Search Criteria</h3>
          <div className="space-y-3">
            {criteria.map(c => (
              <div key={c.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{c.name}</h4>
                    <p className="text-sm text-gray-500">
                      {c.location} • ${c.price_min?.toLocaleString() || '0'} - ${c.price_max?.toLocaleString() || 'Any'}
                      {c.beds_min && ` • ${c.beds_min}+ beds`}
                      {c.keywords && ` • Keywords: ${c.keywords}`}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${c.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {c.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
