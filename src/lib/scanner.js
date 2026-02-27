/**
 * Property Scanner - Mock Implementation
 * 
 * This simulates property scanning for demo purposes.
 * In production, this would call real APIs (Zillow, Redfin, etc.)
 */

const MOCK_PROPERTIES = [
  {
    address: '1234 Oak Street, Arlington, TX 76010',
    price: 450000,
    beds: 4,
    baths: 3,
    sqft: 2400,
    source: 'zillow',
    sourceUrl: 'https://zillow.com',
    keywords: ['assisted living', 'ramp', 'ADA']
  },
  {
    address: '567 Maple Ave, Grand Prairie, TX 75050',
    price: 385000,
    beds: 3,
    baths: 2,
    sqft: 1800,
    source: 'redfin',
    sourceUrl: 'https://redfin.com',
    keywords: ['care home', 'zoning']
  },
  {
    address: '890 Pine Road, Dallas, TX 75201',
    price: 625000,
    beds: 5,
    baths: 4,
    sqft: 3200,
    source: 'zillow',
    sourceUrl: 'https://zillow.com',
    keywords: ['commercial', 'multi-family']
  },
  {
    address: '321 Cedar Lane, Fort Worth, TX 76102',
    price: 275000,
    beds: 2,
    baths: 2,
    sqft: 1200,
    source: 'redfin',
    sourceUrl: 'https://redfin.com',
    keywords: ['lot', 'development']
  },
  {
    address: '456 Birch Blvd, Irving, TX 75060',
    price: 520000,
    beds: 4,
    baths: 3,
    sqft: 2600,
    source: 'zillow',
    sourceUrl: 'https://zillow.com',
    keywords: ['assisted living', 'nursing']
  }
];

/**
 * Scan for properties matching criteria
 * 
 * @param {object} criteria - Search criteria
 * @returns {Promise<Array>} Array of matching properties
 */
export async function scanProperties(criteria) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
  
  const matches = [];
  
  for (const property of MOCK_PROPERTIES) {
    const score = calculateMatchScore(property, criteria);
    
    if (score > 0) {
      matches.push({
        property,
        confidence: score >= 80 ? 'high' : score >= 50 ? 'medium' : 'low',
        match_reason: generateMatchReason(property, criteria),
        search_strategy: 'keyword_matching'
      });
    }
  }
  
  // Sort by confidence
  matches.sort((a, b) => {
    const confidenceOrder = { high: 3, medium: 2, low: 1 };
    return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
  });
  
  return matches;
}

/**
 * Calculate match score (0-100)
 */
function calculateMatchScore(property, criteria) {
  let score = 0;
  
  // Price matching
  if (criteria.price_min && property.price < criteria.price_min) return 0;
  if (criteria.price_max && property.price > criteria.price_max) return 0;
  score += 20;
  
  // Beds matching
  if (criteria.beds_min && property.beds < criteria.beds_min) {
    score -= 10;
  } else if (criteria.beds_min) {
    score += 15;
  }
  
  // Baths matching
  if (criteria.baths_min && property.baths < criteria.baths_min) {
    score -= 10;
  } else if (criteria.baths_min) {
    score += 15;
  }
  
  // Property type matching
  if (criteria.property_type) {
    const propType = criteria.property_type.toLowerCase();
    if (propType === 'house' && property.beds >= 3) score += 20;
    else if (propType === 'commercial') score += 20;
    else score += 10;
  }
  
  // Keyword matching
  if (criteria.keywords) {
    const keywords = criteria.keywords.toLowerCase().split(',').map(k => k.trim());
    const propertyKeywords = property.keywords.join(' ').toLowerCase();
    const matchedKeywords = keywords.filter(k => propertyKeywords.includes(k));
    score += matchedKeywords.length * 10;
  }
  
  return Math.min(100, Math.max(0, score));
}

/**
 * Generate human-readable match reason
 */
function generateMatchReason(property, criteria) {
  const reasons = [];
  
  if (criteria.keywords) {
    const keywords = criteria.keywords.toLowerCase().split(',').map(k => k.trim());
    const propertyKeywords = property.keywords.join(' ').toLowerCase();
    const matched = keywords.filter(k => propertyKeywords.includes(k));
    if (matched.length > 0) {
      reasons.push(`Matched keywords: ${matched.join(', ')}`);
    }
  }
  
  if (criteria.price_min || criteria.price_max) {
    reasons.push(`Price within range: $${property.price.toLocaleString()}`);
  }
  
  if (criteria.beds_min && property.beds >= criteria.beds_min) {
    reasons.push(`${property.beds} bedrooms (min: ${criteria.beds_min})`);
  }
  
  return reasons.join('. ') || 'General match';
}

/**
 * Run a full scan for all user criteria (for cron job)
 * 
 * @param {object} supabase - Supabase client
 * @returns {Promise<number>} Number of new matches found
 */
export async function runFullScan(supabase) {
  // Get all active criteria
  const { data: allCriteria } = await supabase
    .from('criteria')
    .select('*')
    .eq('active', true);
  
  let newMatches = 0;
  
  for (const criteria of allCriteria || []) {
    const matches = await scanProperties(criteria);
    
    for (const match of matches) {
      // Check if we already have this property
      const { data: existing } = await supabase
        .from('matches')
        .select('id')
        .eq('criteria_id', criteria.id)
        .eq('property->>address', match.property.address)
        .single();
      
      if (!existing) {
        await supabase.from('matches').insert({
          criteria_id: criteria.id,
          property: match.property,
          confidence: match.confidence,
          match_reason: match.match_reason,
          search_strategy: match.search_strategy
        });
        newMatches++;
      }
    }
  }
  
  return newMatches;
}

export default {
  scanProperties,
  runFullScan
};
