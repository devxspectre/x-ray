// X-Ray Demo - Competitor Product Selection Pipeline
// Shows how to use X-Ray to trace a 5-step pipeline

import 'dotenv/config';
import { CohereClient } from 'cohere-ai';
import * as xray from '@xray/sdk';
import { referenceProduct, mockCandidates, Product } from './mockData.js';

// Setup Cohere (for LLM steps)
const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY || '',
});

// Main function
async function main() {
  console.log('\n🚀 Starting Competitor Selection Pipeline\n');
  
  // Start tracking with X-Ray
  const session = xray.startSession('Competitor Selection', {
    product: referenceProduct.title
  });
  
  try {
    // Step 1: Generate search keywords using LLM
    const keywords = await step1_generateKeywords();
    
    // Step 2: Search for candidates
    const candidates = await step2_searchCandidates(keywords);
    
    // Step 3: Filter candidates by price, rating, reviews
    const filtered = await step3_applyFilters(candidates);
    
    // Step 4: Use LLM to check if they're real competitors
    const relevant = await step4_checkRelevance(filtered);
    
    // Step 5: Pick the best one
    const winner = await step5_selectWinner(relevant);
    
    console.log('\n✅ Pipeline Complete!');
    console.log(`Selected Competitor: ${winner.title} ($${winner.price})`);
    
    xray.endSession('completed');
  } catch (error) {
    console.error('Pipeline failed:', error);
    xray.endSession('failed');
  }
  
  // Print and save the results
  xray.printSession();
  await xray.exportSession();
}

// Step 1: Generate search keywords
async function step1_generateKeywords(): Promise<string[]> {
  const step = xray.startStep('keyword_generation', 'llm');
  xray.setInput(step, { product: referenceProduct.title });
  
  let keywords: string[];
  
  try {
    // Ask Cohere for keywords with a strict prompt
    const prompt = `Generate exactly 3 search keywords for finding competitor products to "${referenceProduct.title}".

Rules:
- Output ONLY the keywords, one per line
- No numbering, no bullets, no explanations
- No preamble like "Sure" or "Here are"
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
    
    xray.addMetric(step, 'keywords_count', keywords.length);
    xray.logInfo(step, `Generated ${keywords.length} keywords`);
    
  } catch (error) {
    // If LLM fails, use fallback keywords
    console.error('⚠️ LLM Error in keyword generation:', error);
    xray.logWarning(step, 'LLM failed, using fallback keywords');
    keywords = ['water bottle insulated', 'steel bottle 32oz', 'sports water bottle'];
  }
  
  xray.setOutput(step, { keywords });
  xray.setReasoning(step, `Generated ${keywords.length} keywords from product title`);
  xray.endStep(step);
  
  return keywords;
}

// Step 2: Search for candidates (using mock data)
async function step2_searchCandidates(keywords: string[]): Promise<Product[]> {
  const step = xray.startStep('candidate_search', 'search');
  xray.setInput(step, { keywords });
  
  // Pretend to search (just use mock data)
  await new Promise(r => setTimeout(r, 200));
  const candidates = mockCandidates;
  
  xray.addMetric(step, 'total_found', 2847);
  xray.addMetric(step, 'fetched', candidates.length);
  xray.logInfo(step, `Found ${candidates.length} candidates`);
  
  xray.setOutput(step, { count: candidates.length });
  xray.setReasoning(step, `Fetched top ${candidates.length} candidates from search`);
  xray.endStep(step);
  
  return candidates;
}

// Step 3: Apply filters
async function step3_applyFilters(candidates: Product[]): Promise<Product[]> {
  const step = xray.startStep('apply_filters', 'filter');
  
  // Filter rules based on reference product
  const minPrice = referenceProduct.price * 0.5;
  const maxPrice = referenceProduct.price * 2;
  const minRating = 3.8;
  const minReviews = 100;
  
  xray.setInput(step, {
    candidates: candidates.length,
    priceRange: `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`,
    minRating,
    minReviews
  });
  
  const passed: Product[] = [];
  
  for (const candidate of candidates) {
    const priceOk = candidate.price >= minPrice && candidate.price <= maxPrice;
    const ratingOk = candidate.rating >= minRating;
    const reviewsOk = candidate.reviews >= minReviews;
    const allOk = priceOk && ratingOk && reviewsOk;
    
    // Build a detailed reason showing which filters failed
    const failedFilters: string[] = [];
    if (!priceOk) failedFilters.push(`price $${candidate.price} not in $${minPrice.toFixed(2)}-$${maxPrice.toFixed(2)}`);
    if (!ratingOk) failedFilters.push(`rating ${candidate.rating} < ${minRating}`);
    if (!reviewsOk) failedFilters.push(`reviews ${candidate.reviews} < ${minReviews}`);
    
    const reason = allOk 
      ? 'Passed all filters' 
      : `Failed: ${failedFilters.join(', ')}`;
    
    // Record with detailed children showing each filter
    xray.addObservation(step, {
      id: candidate.asin,
      type: 'candidate',
      label: candidate.title,
      data: { price: `$${candidate.price}`, rating: candidate.rating, reviews: candidate.reviews },
      result: allOk ? 'pass' : 'fail',
      reason: reason,
      children: [
        {
          id: `${candidate.asin}_price`,
          type: 'filter',
          label: 'Price Range',
          data: { value: `$${candidate.price}`, range: `$${minPrice.toFixed(2)}-$${maxPrice.toFixed(2)}` },
          result: priceOk ? 'pass' : 'fail',
          reason: priceOk ? 'Price in range' : `$${candidate.price} outside range`,
          score: null,
          children: null
        },
        {
          id: `${candidate.asin}_rating`,
          type: 'filter',
          label: 'Min Rating',
          data: { value: candidate.rating, min: minRating },
          result: ratingOk ? 'pass' : 'fail',
          reason: ratingOk ? `${candidate.rating} >= ${minRating}` : `${candidate.rating} < ${minRating}`,
          score: null,
          children: null
        },
        {
          id: `${candidate.asin}_reviews`,
          type: 'filter',
          label: 'Min Reviews',
          data: { value: candidate.reviews, min: minReviews },
          result: reviewsOk ? 'pass' : 'fail',
          reason: reviewsOk ? `${candidate.reviews} >= ${minReviews}` : `${candidate.reviews} < ${minReviews}`,
          score: null,
          children: null
        }
      ]
    });
    
    if (allOk) {
      passed.push(candidate);
    }
  }
  
  xray.addMetric(step, 'passed', passed.length);
  xray.addMetric(step, 'failed', candidates.length - passed.length);
  
  xray.setOutput(step, { passed: passed.length, failed: candidates.length - passed.length });
  xray.setReasoning(step, `${passed.length} of ${candidates.length} candidates passed filters`);
  xray.endStep(step);
  
  return passed;
}

// Step 4: Check if they're real competitors (using LLM)
async function step4_checkRelevance(candidates: Product[]): Promise<Product[]> {
  const step = xray.startStep('llm_relevance', 'llm');
  xray.setInput(step, { candidates: candidates.length });
  
  const relevant: Product[] = [];
  
  for (const candidate of candidates) {
    let isCompetitor = true;
    let reason = '';
    
    try {
      const prompt = `Is "${candidate.title}" a competitor to "${referenceProduct.title}"? 
      Answer with YES or NO on the first line, then give a brief reason on the second line.`;
      
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
        reason = lines.slice(1).join(' ').trim().slice(0, 200);
      } else {
        // If single line, extract reason after YES/NO
        reason = text.replace(/^(YES|NO)[:\s]*/i, '').trim().slice(0, 200);
      }
      
      // If no reason captured, use a default
      if (!reason) {
        reason = isCompetitor ? 'LLM confirmed as competitor' : 'LLM rejected as non-competitor';
      }
    } catch (error) {
      // Fallback: assume it's a competitor if it's in the water bottles category
      console.error(`⚠️ LLM Error for ${candidate.asin}:`, error);
      isCompetitor = candidate.category.includes('Water Bottles');
      reason = isCompetitor ? 'Same category (fallback)' : 'Different category (fallback)';
      xray.logWarning(step, `LLM failed for ${candidate.asin}, using fallback`);
    }
    
    xray.addObservation(step, {
      id: candidate.asin,
      type: 'relevance',
      label: candidate.title,
      result: isCompetitor ? 'pass' : 'fail',
      reason: reason
    });
    
    if (isCompetitor) {
      relevant.push(candidate);
    }
  }
  
  xray.addMetric(step, 'confirmed', relevant.length);
  xray.addMetric(step, 'rejected', candidates.length - relevant.length);
  
  xray.setOutput(step, { confirmed: relevant.length });
  xray.setReasoning(step, `LLM confirmed ${relevant.length} as real competitors`);
  xray.endStep(step);
  
  return relevant;
}

// Step 5: Pick the best competitor
async function step5_selectWinner(candidates: Product[]): Promise<Product> {
  const step = xray.startStep('rank_and_select', 'rank');
  xray.setInput(step, { candidates: candidates.length });
  
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
  
  // Record each one
  for (let i = 0; i < scored.length; i++) {
    const c = scored[i];
    xray.addObservation(step, {
      id: c.asin,
      type: 'ranking',
      label: c.title,
      data: { price: c.price, rating: c.rating, reviews: c.reviews },
      result: i === 0 ? 'selected' : 'ranked',
      reason: i === 0 ? `Winner with score ${c.score.toFixed(3)}` : `#${i + 1} with score ${c.score.toFixed(3)}`,
      score: c.score
    });
  }
  
  const winner = scored[0];
  
  xray.logDecision(step, `Selected ${winner.title}`, { score: winner.score });
  xray.addMetric(step, 'winner_score', winner.score);
  
  xray.setOutput(step, { winner: winner.title, score: winner.score });
  xray.setReasoning(step, `Picked ${winner.title} with highest score (${winner.score.toFixed(3)})`);
  xray.endStep(step);
  
  return winner;
}

// Run it!
main();
