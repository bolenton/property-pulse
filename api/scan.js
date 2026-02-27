/**
 * Property Scanner API
 * 
 * POST /api/scan
 * Runs property scan for all active criteria
 * 
 * Cron: Every 3 hours from 6am-9pm CT (6 times/day)
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

// Mock properties (replace with real API in production)
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
  },
  {
    address: '789 Elm Street, Garland, TX 75040',
    price: 340000,
    beds: 3,
    baths: 2,
    sqft: 1600,
    source: 'redfin',
    sourceUrl: 'https://redfin.com',
    keywords: ['fixer', 'renovation']
  },
  {
    address: '101 Oak Creek Dr, Mansfield, TX 76063',
    price: 475000,
    beds: 4,
    baths: 3,
    sqft: 2500,
    source: 'zillow',
    sourceUrl: 'https://zillow.com',
    keywords: ['accessibility', 'single story']
  },
  {
    address: '202 Lakeview Way, Richardson, TX 75080',
    price: 580000,
    beds: 5,
    baths: 4,
    sqft: 3000,
    source: 'zillow',
    sourceUrl: 'https://zillow.com',
    keywords: ['investment', 'rental']
  }
];

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

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify cron secret (optional but recommended)
  const cronSecret = req.headers['x-cron-secret'];
  if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Get all active criteria that haven't expired
    const now = new Date();
    
    const { data: criteriaList, error: criteriaError } = await supabase
      .from('criteria')
      .select(`
        *,
        profiles!inner(email, phone, name)
      `)
      .eq('active', true)
      .or('notify_until.is.null,notify_until.gt.' + now.toISOString());
    
    if (criteriaError) {
      console.error('Error fetching criteria:', criteriaError);
      return res.status(500).json({ error: 'Failed to fetch criteria' });
    }
    
    if (!criteriaList || criteriaList.length === 0) {
      return res.status(200).json({ 
        message: 'No active criteria to scan',
        matchesFound: 0,
        usersNotified: 0
      });
    }
    
    let totalMatches = 0;
    let usersNotified = new Set();
    
    // Process each criteria
    for (const criteria of criteriaList) {
      const matches = [];
      
      for (const property of MOCK_PROPERTIES) {
        const score = calculateMatchScore(property, criteria);
        
        // Filter by confidence threshold
        if (score >= 50) {
          matches.push({
            property,
            confidence: score >= 80 ? 'high' : score >= 50 ? 'medium' : 'low',
            match_reason: generateMatchReason(property, criteria),
            search_strategy: 'keyword_matching',
            sources_searched: ['zillow', 'redfin']
          });
        }
      }
      
      // Save new matches (avoid duplicates)
      for (const match of matches) {
        // Check if we already have this property for this criteria
        const { data: existing } = await supabase
          .from('matches')
          .select('id')
          .eq('criteria_id', criteria.id)
          .eq('property->>address', match.property.address)
          .single();
        
        if (existing) {
          continue; // Skip duplicate
        }
        
        const { error: insertError } = await supabase
          .from('matches')
          .insert({
            criteria_id: criteria.id,
            property: match.property,
            match_reason: match.match_reason,
            confidence: match.confidence,
            confidence_reason: `Score: ${calculateMatchScore(match.property, criteria)}/100`,
            search_strategy: match.search_strategy,
            sources_searched: match.sources_searched,
            found_at: new Date().toISOString(),
            notified: false
          });
        
        if (!insertError) {
          totalMatches++;
          
          // Create notification
          if (criteria.profiles?.phone || criteria.profiles?.email) {
            await supabase
              .from('notifications')
              .insert({
                user_id: criteria.user_id,
                type: 'new_match',
                title: 'New Property Match Found',
                message: `Found a new match for "${criteria.name}": ${match.property.address} - $${match.property.price.toLocaleString()}`,
                match_id: null // Would need to fetch the inserted ID
              });
            
            usersNotified.add(criteria.user_id);
          }
        }
      }
      
      // Update last_scanned_at
      await supabase
        .from('criteria')
        .update({ last_scanned_at: new Date().toISOString() })
        .eq('id', criteria.id);
    }
    
    return res.status(200).json({
      message: 'Scan completed',
      criteriaScanned: criteriaList.length,
      matchesFound: totalMatches,
      usersNotified: usersNotified.size,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Scan error:', error);
    return res.status(500).json({ error: error.message });
  }
}
