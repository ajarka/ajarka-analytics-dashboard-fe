// Test utility to verify GitHub token source
export const testTokenSource = () => {
  console.log('🧪 Testing GitHub Token Sources...');
  
  // Check auth token
  const authToken = localStorage.getItem('auth_token');
  const userData = JSON.parse(localStorage.getItem('auth_user') || '{}');
  
  console.log('📊 Token Source Analysis:');
  console.log('- Auth Session Token:', authToken ? `✅ Present (${authToken.substring(0, 20)}...)` : '❌ Missing');
  console.log('- User Data:', userData);
  console.log('- User Email:', userData.email || 'No user data');
  console.log('- OAuth GitHub Token:', userData.githubToken ? `✅ Present (${userData.githubToken.substring(0, 20)}...)` : '❌ Missing');
  console.log('- .env Fallback Token:', import.meta.env.VITE_GITHUB_TOKEN ? `⚠️ Available (${import.meta.env.VITE_GITHUB_TOKEN.substring(0, 20)}...)` : '❌ Not set');
  console.log('- Legacy localStorage Token:', localStorage.getItem('GITHUB_TOKEN') ? '⚠️ Present' : '✅ Clean');
  
  // Test which token would be used
  if (authToken && userData.githubToken) {
    console.log('🎯 RESULT: Should use OAuth token from authenticated user ✅');
    console.log('🔑 OAuth Token (first 30 chars):', userData.githubToken.substring(0, 30) + '...');
    return 'oauth';
  } else if (import.meta.env.VITE_GITHUB_TOKEN) {
    console.log('🎯 RESULT: Will fallback to .env token ⚠️');
    console.log('🔑 .env Token (first 30 chars):', import.meta.env.VITE_GITHUB_TOKEN.substring(0, 30) + '...');
    return 'env';
  } else {
    console.log('🎯 RESULT: No token available ❌');
    return 'none';
  }
};