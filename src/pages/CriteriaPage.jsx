import { useState, useEffect, useContext } from 'react';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';
import { analyzeCriteria } from '../lib/agent';

function CriteriaPage() {
  const { user } = useUser();
  const [savedCriteria, setSavedCriteria] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    property_type: '',
    location: '',
    price_min: '',
    price_max: '',
    beds_min: '',
    baths_min: '',
    keywords: '',
    sources: ['zillow', 'redfin'],
    min_confidence: 'all',
    active: true,
    notify_days: 7 // Default to 7 days
  });

  useEffect(() => {
    if (user) {
      fetchCriteria();
    }
  }, [user]);

  const fetchCriteria = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('criteria')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (!error) {
      setSavedCriteria(data || []);
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    setSaving(true);
    try {
      // Build criteria object for AI analysis
      const criteriaObj = {
        name: form.name,
        property_type: form.property_type,
        location: form.location,
        price_min: form.price_min ? parseInt(form.price_min) : null,
        price_max: form.price_max ? parseInt(form.price_max) : null,
        beds_min: form.beds_min ? parseInt(form.beds_min) : null,
        baths_min: form.baths_min ? parseInt(form.baths_min) : null,
        keywords: form.keywords
      };

      // Try to get AI suggestions
      let aiSuggestions = null;
      try {
        const result = await analyzeCriteria(criteriaObj);
        if (result && !result.error) {
          aiSuggestions = result;
        }
      } catch (aiErr) {
        console.warn('AI analysis failed:', aiErr);
      }

      const { data, error } = await supabase
        .from('criteria')
        .insert({
          user_id: user.id,
          name: form.name,
          property_type: form.property_type,
          location: form.location,
          price_min: form.price_min ? parseInt(form.price_min) : null,
          price_max: form.price_max ? parseInt(form.price_max) : null,
          beds_min: form.beds_min ? parseInt(form.beds_min) : null,
          baths_min: form.baths_min ? parseInt(form.baths_min) : null,
          keywords: form.keywords,
          sources: form.sources,
          min_confidence: form.min_confidence,
          active: form.active,
          notify_until: new Date(Date.now() + form.notify_days * 24 * 60 * 60 * 1000).toISOString()
        })
        .select();

      if (error) throw error;

      setForm({
        name: '',
        property_type: '',
        location: '',
        price_min: '',
        price_max: '',
        beds_min: '',
        baths_min: '',
        keywords: '',
        sources: ['zillow', 'redfin'],
        min_confidence: 'all',
        active: true
      });
      
      fetchCriteria();
      alert('Criteria saved successfully!' + (aiSuggestions ? ' AI suggestions applied.' : ''));
    } catch (err) {
      console.error('Error saving criteria:', err);
      alert('Error saving criteria: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this criteria?')) return;
    
    const { error } = await supabase
      .from('criteria')
      .delete()
      .eq('id', id);
    
    if (!error) {
      fetchCriteria();
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Search Criteria</h1>
      
      {savedCriteria.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Your Saved Criteria</h2>
          <div className="space-y-3">
            {savedCriteria.map(c => (
              <div key={c.id} className="border rounded-lg p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-gray-900">{c.name}</h3>
                  <p className="text-sm text-gray-500">
                    {c.location} • ${c.price_min || 0} - ${c.price_max || 'Any'}
                    {c.beds_min && ` • ${c.beds_min}+ beds`}
                  </p>
                  {c.ai_suggestions && c.ai_suggestions.suggestions && c.ai_suggestions.suggestions.length > 0 && (
                    <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                      <span className="font-medium">AI Suggestions:</span>
                      <ul className="mt-1">
                        {c.ai_suggestions.suggestions.slice(0, 2).map((s, i) => (
                          <li key={i} className="text-blue-700">
                            {s.suggested_value}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Add New Criteria</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="e.g., Assisted Living - DFW"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
              <select
                name="property_type"
                value={form.property_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Any</option>
                <option value="house">House</option>
                <option value="apartment">Apartment</option>
                <option value="condo">Condo</option>
                <option value="townhouse">Townhouse</option>
                <option value="lot">Lot</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Arlington, Grand Prairie, TX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Price</label>
              <input
                type="number"
                name="price_min"
                value={form.price_min}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
              <input
                type="number"
                name="price_max"
                value={form.price_max}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Any"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Bedrooms</label>
              <input
                type="number"
                name="beds_min"
                value={form.beds_min}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Any"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Bathrooms</label>
              <input
                type="number"
                name="baths_min"
                value={form.baths_min}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Any"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
            <input
              type="text"
              name="keywords"
              value={form.keywords}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="assisted living, care home, ADA, ramp"
            />
            <p className="text-xs text-gray-500 mt-1">Separate keywords with commas</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Confidence</label>
            <select
              name="min_confidence"
              value={form.min_confidence}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">All matches</option>
              <option value="high">High confidence only</option>
              <option value="medium">High + Medium</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="active"
              checked={form.active}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">Active (scan automatically)</label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notify for</label>
            <select
              name="notify_days"
              value={form.notify_days}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value={3}>3 days</option>
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Auto-stop scanning after this period</p>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Criteria'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CriteriaPage;
