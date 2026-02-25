import { useState, useEffect } from 'react';

function MatchesPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would fetch from your API/database
    // Simulating some mock data
    setTimeout(() => {
      setMatches([
        {
          id: 1,
          address: "123 Main St",
          price: "$350,000",
          bedrooms: 3,
          bathrooms: 2,
          sqft: 1800,
          type: "House"
        },
        {
          id: 2,
          address: "456 Oak Ave",
          price: "$425,000",
          bedrooms: 4,
          bathrooms: 3,
          sqft: 2200,
          type: "House"
        },
        {
          id: 3,
          address: "789 Pine Rd",
          price: "$275,000",
          bedrooms: 2,
          bathrooms: 1,
          sqft: 1200,
          type: "Apartment"
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Property Matches</h1>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
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
          <p className="text-gray-600">No matching properties found. Try adjusting your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((match) => (
            <div key={match.id} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medium text-gray-900">{match.address}</h3>
                  <span className="text-lg font-semibold text-blue-600">{match.price}</span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Beds:</span> {match.bedrooms}
                  </div>
                  <div>
                    <span className="font-medium">Baths:</span> {match.bathrooms}
                  </div>
                  <div>
                    <span className="font-medium">Sq Ft:</span> {match.sqft}
                  </div>
                </div>
                <div className="mt-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {match.type}
                  </span>
                </div>
                <div className="mt-6 flex justify-between">
                  <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none">
                    View Details
                  </button>
                  <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none">
                    Save
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MatchesPage;