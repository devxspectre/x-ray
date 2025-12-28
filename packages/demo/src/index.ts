// X-Ray Demo - Competitor Product Selection Pipeline
// Shows how to use X-Ray to trace a 5-step pipeline

import 'dotenv/config';
import { CohereClient } from 'cohere-ai';
import * as xray from '@xray/sdk';
import { referenceProduct, mockCandidates, Product } from './mockData.js';

// Setup Cohere (for LLM steps)
// Need to initialize XRay instrumentation first
xray.initInstrumentation('competitor-selection-pipeline');

const cohere = xray.instrumentCohere(new CohereClient({
  token: process.env.COHERE_API_KEY || '',
}));

// Main function
async function main() {
  console.log('\n🚀 Starting Competitor Selection Pipeline\n');
  
  try {
    // Generate search keywords using LLM
    const keywords = await step1_generateKeywords();
    
    // Search for candidates
    const candidates = await step2_searchCandidates(keywords);
    
    // Filter candidates by price, rating, reviews
    const filtered = await step3_applyFilters(candidates);
    
    // Use LLM to check if they're real competitors
    const relevant = await step4_checkRelevance(filtered);
    
    // Pick the best one
    const winner = await step5_selectWinner(relevant);
    
    console.log('\n✅ Pipeline Complete!');
    console.log(`Selected Competitor: ${winner.title} ($${winner.price})`);
  } catch (error) {
    console.error('Pipeline failed:', error);
  }
}

// Generate search keywords
async function step1_generateKeywords(): Promise<string[]> {
  let keywords: string[];
  
  try {
    // Ask Cohere for keywords with a strict prompt
    const prompt = `Generate exactly 3 search keywords for finding competitor products to "${referenceProduct.title}".

Rules:
- Output the keywords, one per line
- No numbering, no bullets
- Each keyword should be 2-4 words

Example output format:
insulated water bottle
stainless steel bottle
32oz sports bottle`;
    
    const result = await cohere.chat({
      model: 'command-r7b-12-2024',
      message: prompt,
    });
    const text = result.text || '';
    
    // Parse and clean the keywords
    keywords = text
      .split('\n')
      .map((line: string) => {
        // Remove numbering (1., 2., 1), -. *, etc.)
        let cleaned = line.replace(/^[\d\.\-\*\)\]]+\s*/, '').trim();
        // Remove quotes
        cleaned = cleaned.replace(/^["']|["']$/g, '');
        return cleaned;
      })
      .filter((k: string) => {
        // Filter out empty lines and lines that look like preamble
        if (!k || k.length < 3) return false;
        const lower = k.toLowerCase();
        if (lower.includes('sure') || lower.includes('here are') || lower.includes('keywords')) return false;
        return true;
      })
      .slice(0, 3);
    
  } catch (error) {
    // If LLM fails, use fallback keywords
    console.error('⚠️ LLM Error in keyword generation:', error);
    keywords = ['water bottle insulated', 'steel bottle 32oz', 'sports water bottle'];
  }
  
  return keywords;
}

// Search for candidates (using mock data)
async function step2_searchCandidates(keywords: string[]): Promise<Product[]> {
  // Pretend to search (just use mock data)
  await new Promise(r => setTimeout(r, 200));
  const candidates = mockCandidates;
  
  return candidates;
}

// Apply filters
async function step3_applyFilters(candidates: Product[]): Promise<Product[]> {
  // Filter rules based on reference product
  const minPrice = referenceProduct.price * 0.5;
  const maxPrice = referenceProduct.price * 2;
  const minRating = 3.8;
  const minReviews = 100;
  
  const passed: Product[] = [];
  
  for (const candidate of candidates) {
    const priceOk = candidate.price >= minPrice && candidate.price <= maxPrice;
    const ratingOk = candidate.rating >= minRating;
    const reviewsOk = candidate.reviews >= minReviews;
    const allOk = priceOk && ratingOk && reviewsOk;
    
    if (allOk) {
      passed.push(candidate);
    }
  }
  
  return passed;
}

// Check if they're real competitors (using LLM)
async function step4_checkRelevance(candidates: Product[]): Promise<Product[]> {
  const relevant: Product[] = [];
  
  for (const candidate of candidates) {
    let isCompetitor = true;
    
    try {
      const prompt = `Is "${candidate.title}" a competitor to "${referenceProduct.title}"? 
      Answer with YES or NO on the first line.`;
      
      const result = await cohere.chat({
        model: 'command-r7b-12-2024',
        message: prompt,
      });
      const text = result.text || '';
      const lines = text.split('\n').filter((l: string) => l.trim());
      
      // Check if first line contains YES or NO
      isCompetitor = lines[0]?.toUpperCase().includes('YES') ?? false;
      
      // Get the reason - either second line, or everything after YES/NO
      if (lines.length > 1) {
      } else {
        // If single line, extract reason after YES/NO
      }
      
    } catch (error) {
      // Fallback: assume it's a competitor if it's in the water bottles category
      console.error(`⚠️ LLM Error for ${candidate.asin}:`, error);
      isCompetitor = candidate.category.includes('Water Bottles');
    }
    
    if (isCompetitor) {
      relevant.push(candidate);
    }
  }
  
  return relevant;
}

// Pick the best competitor
async function step5_selectWinner(candidates: Product[]): Promise<Product> {
  // Score each candidate
  const maxReviews = Math.max(...candidates.map(c => c.reviews));
  
  const scored = candidates.map(c => {
    const reviewScore = c.reviews / maxReviews;
    const ratingScore = c.rating / 5;
    const priceScore = 1 - Math.abs(c.price - referenceProduct.price) / referenceProduct.price;
    
    const total = (reviewScore * 0.4) + (ratingScore * 0.35) + (Math.max(0, priceScore) * 0.25);
    
    return { ...c, score: total };
  });
  
  // Sort by score (highest first)
  scored.sort((a, b) => b.score - a.score);
  
  const winner = scored[0];
  
  return winner;
}

// Run it!
main();
