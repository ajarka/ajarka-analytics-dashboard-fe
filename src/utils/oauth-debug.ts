// OAuth Debug Helper
export const debugOAuthConfig = () => {
    const currentUrl = window.location.origin;
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    const expectedCallback = `${currentUrl}/oauth-callback`;
    
    console.log('🔍 OAuth Debug Configuration:');
    console.log('- Current Origin:', currentUrl);
    console.log('- Client ID:', clientId || '❌ MISSING');
    console.log('- Expected Callback URL:', expectedCallback);
    console.log('');
    console.log('📋 GitHub OAuth App Settings Should Be:');
    console.log(`- Homepage URL: ${currentUrl}`);
    console.log(`- Authorization callback URL: ${expectedCallback}`);
    console.log('');
    
    if (!clientId) {
        console.error('❌ GitHub OAuth not configured - missing VITE_GITHUB_CLIENT_ID');
        return false;
    }
    
    return {
        currentUrl,
        clientId,
        callbackUrl: expectedCallback
    };
};

// Test OAuth URL generation
export const testOAuthUrl = () => {
    const config = debugOAuthConfig();
    if (config) {
        const scope = 'repo,read:org,read:user';
        const oauthUrl = `https://github.com/login/oauth/authorize?client_id=${config.clientId}&redirect_uri=${config.callbackUrl}&scope=${scope}&state=oauth`;
        
        console.log('🔗 Generated OAuth URL:');
        console.log(oauthUrl);
        
        return oauthUrl;
    }
    return null;
};