import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';

function MatchesPage() {
  const { user } = useUser();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMatches();
    }
  }, [user]);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      // Get user's criteria IDs
      const { data: criteriaData } = await supabase
        .from('criteria')
        .select('id')
        .eq('user_id', user.id);

      if (criteriaData && criteriaData.length > 0) {
        const criteriaIds = criteriaData.map(c => c.id);
        const { data, error } = await supabase
          .from('matches')
          .select('*')
          .in('criteria_id', criteriaIds)
          .order('found_at', { ascending: false });

        if (!error) {
          setMatches(data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching matches:', err);
    }
    setLoading(false);
  };

  const getConfidenceColor = (confidence) => {
    switch (confidence) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Property Matches</h1>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Property Matches</h1>
      
      {matches.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-600 mb-4">No matching properties found yet.</p>
          <p className="text-sm text-gray-500">The agent will scan for matches based on your criteria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => (
            <div key={match.id} className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">
                      {match.property?.address || 'Unknown Address'}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded ${getConfidenceColor(match.confidence)}`}>
                      {match.confidence || 'unknown'} confidence
                    </span>
                  </div>
                  <p className="text-xl font-semibold text-blue-600 mb-2">
                    ${match.property?.price?.toLocaleString() || 'N/A'}
                  </p>
                  <div className="text-sm text-gray-600 mb-3">
                    {match.property?.beds && `• ${match.property.beds} beds`}
                    {match.property?.baths && ` • ${match.property.baths} baths`}
                    {match.property?.sqft && ` • ${match.property.sqft.toLocaleString()} sqft`}
                    {match.property?.source && ` • Source: ${match.property.source}`}
                  </div>
                  {match.match_reason && (
                    <div className="text-sm text-gray-700 mb-2">
                      <strong>Why it matches:</strong> {match.match_reason}
                    </div>
                  )}
                  {match.search_strategy && (
                    <div className="text-xs text-gray-500">
                      <strong>Search strategy:</strong> {match.search_strategy}
                    </div>
                  )}
                </div>
                {match.property?.sourceUrl && (
                  <a
                    href={match.property.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    View Listing
                  </a>
                )}
              </div>
              <div className="text-xs text-gray-400 mt-2">
                Found: {new Date(match.found_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MatchesPage;
