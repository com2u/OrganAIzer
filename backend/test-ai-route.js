// Test script to check if AI route can be loaded
const path = require('path');

console.log('Testing AI route loading...');

try {
  // Set up basic environment
  process.env.NODE_ENV = 'development';
  
  // Try to require the AI route
  const aiRoute = require('./routes/ai');
  console.log('✓ AI route loaded successfully');
  console.log('Route type:', typeof aiRoute);
  console.log('Route methods:', Object.getOwnPropertyNames(aiRoute));
  
  // Check if it's an Express router
  if (aiRoute && typeof aiRoute.use === 'function') {
    console.log('✓ AI route is a valid Express router');
  } else {
    console.log('✗ AI route is not a valid Express router');
  }
  
} catch (error) {
  console.error('✗ Failed to load AI route:', error.message);
  console.error('Stack:', error.stack);
}
