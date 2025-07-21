#!/usr/bin/env node

// Simple test script to verify Pexels API functionality
const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.PEXELS_API_KEY;
const BASE_URL = 'https://api.pexels.com/v1';
const VIDEOS_URL = 'https://api.pexels.com/videos';

async function testPexelsAPI() {
  console.log('🧪 Testing Pexels API Integration\n');
  
  if (!API_KEY || API_KEY === 'your_pexels_api_key_here') {
    console.error('❌ Error: Please set your PEXELS_API_KEY in the .env file');
    console.log('   1. Get your API key from: https://www.pexels.com/api/');
    console.log('   2. Copy .env.example to .env');
    console.log('   3. Replace "your_pexels_api_key_here" with your actual API key');
    process.exit(1);
  }
  
  console.log('✅ API Key found');
  
  // Test Photos API
  console.log('\n📸 Testing Photos API...');
  try {
    const photosResponse = await axios.get(`${BASE_URL}/search`, {
      headers: {
        'Authorization': API_KEY,
        'User-Agent': 'Wallpaper Manager Test'
      },
      params: {
        query: 'nature photography',
        page: 1,
        per_page: 5,
        orientation: 'landscape'
      }
    });
    
    console.log(`✅ Photos API working - Found ${photosResponse.data.photos.length} photos`);
    console.log(`   Total available: ${photosResponse.data.total_results}`);
    console.log(`   Per page: ${photosResponse.data.per_page}`);
    
    if (photosResponse.data.photos.length > 0) {
      const firstPhoto = photosResponse.data.photos[0];
      console.log(`   Sample photo: "${firstPhoto.alt}" by ${firstPhoto.photographer}`);
      console.log(`   Dimensions: ${firstPhoto.width}x${firstPhoto.height}`);
    }
    
  } catch (error) {
    console.error('❌ Photos API Error:', error.response?.data || error.message);
  }
  
  // Test Videos API
  console.log('\n🎥 Testing Videos API...');
  try {
    const videosResponse = await axios.get(`${VIDEOS_URL}/search`, {
      headers: {
        'Authorization': API_KEY,
        'User-Agent': 'Wallpaper Manager Test'
      },
      params: {
        query: 'nature',
        page: 1,
        per_page: 5,
        orientation: 'landscape'
      }
    });
    
    console.log(`✅ Videos API working - Found ${videosResponse.data.videos.length} videos`);
    console.log(`   Total available: ${videosResponse.data.total_results}`);
    console.log(`   Per page: ${videosResponse.data.per_page}`);
    
    if (videosResponse.data.videos.length > 0) {
      const firstVideo = videosResponse.data.videos[0];
      console.log(`   Sample video: by ${firstVideo.user.name}`);
      console.log(`   Duration: ${firstVideo.duration}s`);
      console.log(`   Video files: ${firstVideo.video_files.length} quality options`);
    }
    
  } catch (error) {
    console.error('❌ Videos API Error:', error.response?.data || error.message);
  }
  
  // Test different orientations
  console.log('\n🔄 Testing Orientation Filters...');
  
  const orientations = ['landscape', 'portrait', 'square'];
  for (const orientation of orientations) {
    try {
      const response = await axios.get(`${BASE_URL}/search`, {
        headers: {
          'Authorization': API_KEY,
          'User-Agent': 'Wallpaper Manager Test'
        },
        params: {
          query: 'nature',
          page: 1,
          per_page: 3,
          orientation: orientation
        }
      });
      
      console.log(`✅ ${orientation}: ${response.data.photos.length} photos found`);
      
    } catch (error) {
      console.error(`❌ ${orientation} filter error:`, error.response?.data || error.message);
    }
    
    // Small delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // Test search queries
  console.log('\n🔍 Testing Search Queries...');
  
  const queries = ['mountain', 'forest', 'ocean', 'sunset'];
  for (const query of queries) {
    try {
      const response = await axios.get(`${BASE_URL}/search`, {
        headers: {
          'Authorization': API_KEY,
          'User-Agent': 'Wallpaper Manager Test'
        },
        params: {
          query: query,
          page: 1,
          per_page: 3
        }
      });
      
      console.log(`✅ "${query}": ${response.data.photos.length} photos found`);
      
    } catch (error) {
      console.error(`❌ "${query}" search error:`, error.response?.data || error.message);
    }
    
    // Small delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log('\n🎉 API Testing Complete!');
  console.log('\n💡 Tips:');
  console.log('   - If you see rate limit errors, wait a few minutes before testing again');
  console.log('   - The free Pexels API allows 200 requests per hour');
  console.log('   - Make sure your API key has the correct permissions');
  console.log('\n🚀 You can now run the wallpaper app with: npm start');
}

// Run the test
testPexelsAPI().catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});
