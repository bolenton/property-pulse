/**
 * Property Pulse - AI Agent Client
 * 
 * Frontend utility to call the Edge Function AI agent
 */

import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Initialize Supabase client (only if credentials are provided)
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Call the AI Agent Edge Function
 * 
 * @param {string} action - 'analyze' or 'insights'
 * @param {object} criteria - The search criteria to analyze
 * @param {object} marketData - Optional market data for insights
 * @returns {Promise<object>}
 */
export async function callAgent(action, criteria, marketData = {}) {
  if (!supabase) {
    console.warn('Supabase not configured');
    return { error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase.functions.invoke('agent', {
      body: {
        action,
        criteria,
        marketData
      }
    });

    if (error) {
      console.error('Agent error:', error);
      return { error: error.message };
    }

    return data;
  } catch (err) {
    console.error('Failed to call agent:', err);
    return { error: err.message };
  }
}

/**
 * Analyze property search criteria
 * 
 * @param {object} criteria - Search criteria to analyze
 * @returns {Promise<object>} Analysis with suggestions
 */
export async function analyzeCriteria(criteria) {
  return callAgent('analyze', criteria);
}

/**
 * Generate market insights
 * 
 * @param {object} criteria - Search criteria
 * @param {object} marketData - Optional market context
 * @returns {Promise<object>} Market insights
 */
export async function generateInsights(criteria, marketData = {}) {
  return callAgent('insights', criteria, marketData);
}

export default {
  supabase,
  callAgent,
  analyzeCriteria,
  generateInsights
};
