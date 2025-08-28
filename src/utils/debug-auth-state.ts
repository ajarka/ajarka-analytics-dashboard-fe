// Debug current authentication state
export const debugAuthState = () => {
    console.log('🔍 Current Authentication State:');
    console.log('===============================');
    
    // Check localStorage items
    const authToken = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('auth_user');
    const legacyToken = localStorage.getItem('GITHUB_TOKEN');
    
    console.log('📦 LocalStorage Items:');
    console.log('- auth_token:', authToken ? `Present (${authToken.substring(0, 20)}...)` : 'Missing');
    console.log('- auth_user:', userData ? 'Present' : 'Missing');
    console.log('- GITHUB_TOKEN (legacy):', legacyToken ? `Present (${legacyToken.substring(0, 20)}...)` : 'Missing');
    
    if (userData) {
        try {
            const user = JSON.parse(userData);
            console.log('👤 User Data:');
            console.log('- ID:', user.id);
            console.log('- Email:', user.email);
            console.log('- Name:', user.name);
            console.log('- Role:', user.role);
            console.log('- GitHub Token:', user.githubToken ? `Present (${user.githubToken.substring(0, 20)}...)` : 'Missing');
            console.log('- GitHub Login:', user.githubLogin || 'N/A');
        } catch (e) {
            console.error('❌ Error parsing user data:', e);
        }
    }
    
    // Environment check
    console.log('🌍 Environment Variables:');
    console.log('- VITE_GITHUB_CLIENT_ID:', import.meta.env.VITE_GITHUB_CLIENT_ID || 'Missing');
    console.log('- VITE_GITHUB_CLIENT_SECRET:', import.meta.env.VITE_GITHUB_CLIENT_SECRET ? 'Present' : 'Missing');
    console.log('- VITE_GITHUB_TOKEN:', import.meta.env.VITE_GITHUB_TOKEN ? `Present (${import.meta.env.VITE_GITHUB_TOKEN.substring(0, 20)}...)` : 'Missing');
    
    console.log('===============================');
};

// Clear all auth data for testing
export const clearAuthState = () => {
    console.log('🧹 Clearing all authentication data...');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('GITHUB_TOKEN');
    console.log('✅ Auth state cleared');
};

// Add to window for easy testing
if (typeof window !== 'undefined') {
    (window as any).debugAuthState = debugAuthState;
    (window as any).clearAuthState = clearAuthState;
    console.log('🔧 Debug functions added to window: debugAuthState(), clearAuthState()');
}