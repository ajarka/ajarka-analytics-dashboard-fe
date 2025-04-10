import { Component, createSignal, onMount } from 'solid-js';
import { useAuth } from '../auth/AuthContext';
import { 
    VStack, 
    Text, 
    Box, 
    Button, 
    Input, 
    Tabs, 
    TabList, 
    Tab 
} from '@hope-ui/solid';
import { FaBrandsGg } from 'solid-icons/fa';

export const LoginPage: Component = () => {
    const auth = useAuth();
    const [activeTab, setActiveTab] = createSignal(0);
    const [githubToken, setGithubToken] = createSignal('');
    const [error, setError] = createSignal('');
    const [isLoading, setIsLoading] = createSignal(false);

    onMount(() => {
        // Log storage contents for debugging
        (window as any).DebugLogger.log('Stored tokens:', {
            token: localStorage.getItem('GITHUB_TOKEN'),
            rawStorage: localStorage
        });

        // Redirect to home if already authenticated
        if (auth.isAuthenticated) {
            (window as any).DebugLogger.log('Already authenticated, redirecting to home');
            window.location.href = '/';
            return;
        }
    });

    const handleTokenLogin = async () => {
        const token = githubToken().trim();
        
        // Log raw input for debugging
        (window as any).DebugLogger.log('Raw token input:', token);

        if (!token) {
            setError('Please enter a GitHub token');
            return;
        }

        // Remove any unexpected prefixes
        const cleanToken = token.replace(/^GITHUB_TOKEN/, '').trim();
        
        (window as any).DebugLogger.log('Cleaned token:', cleanToken);

        // Basic token format validation
        const tokenRegex = /^(ghp_)?[a-zA-Z0-9]{36,255}$/;
        if (!tokenRegex.test(cleanToken)) {
            setError('Invalid GitHub token format');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // Attempt to login
            const success = await auth.login(cleanToken);
            
            if (success) {
                (window as any).DebugLogger.log('Login successful, redirecting to home');
                // Redirect to home page
                window.location.href = '/';
            } else {
                (window as any).DebugLogger.log('Login failed');
                setError('Authentication failed. Please check your token.');
            }
        } catch (err) {
            (window as any).DebugLogger.error('Login error:', err);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGitHubOAuth = () => {
        // GitHub OAuth flow configuration
        const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
        const redirectUri = import.meta.env.VITE_GITHUB_REDIRECT_URI;
        const scope = 'repo,read:org,read:user';

        const githubOAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
        
        // Redirect to GitHub OAuth
        window.location.href = githubOAuthUrl;
    };

    return (
        <div class="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center px-4">
            <Box 
                w="$full" 
                maxW="$md" 
                bg="white" 
                p="$8" 
                rounded="$lg" 
                shadow="$xl"
                borderWidth="1px"
                borderColor="$neutral4"
            >
                <VStack spacing="$6" w="$full">
                    <Box textAlign="center">
                        <Text 
                            fontSize="$2xl" 
                            fontWeight="$bold" 
                            color="$primary11"
                        >
                            GitHub Team Analytics
                        </Text>
                        <Text 
                            color="$neutral11" 
                            mt="$2"
                        >
                            Secure Access Required
                        </Text>
                    </Box>

                    <Tabs 
                        variant="enclosed" 
                        w="$full" 
                        index={activeTab()} 
                        onChange={(index: any) => {
                            setActiveTab(index);
                            // Reset error and token when switching tabs
                            setError('');
                            setGithubToken('');
                        }}
                    >
                        <TabList>
                            <Tab w="$full">Personal Token</Tab>
                            <Tab w="$full">OAuth Login</Tab>
                        </TabList>
                        
                        {activeTab() === 0 && (
                            <VStack spacing="$4" mt="$4">
                                <Input 
                                    type="password"
                                    variant="outlined"
                                    placeholder="Enter GitHub Personal Access Token"
                                    value={githubToken()}
                                    onInput={(e: { currentTarget: { value: any; }; }) => setGithubToken(e.currentTarget.value)}
                                    w="$full"
                                />
                                {error() && (
                                    <Text color="$danger11" fontSize="$sm">
                                        {error()}
                                    </Text>
                                )}
                                <Button 
                                    w="$full" 
                                    colorScheme="primary"
                                    onClick={handleTokenLogin}
                                    disabled={isLoading()}
                                >
                                    {isLoading() ? 'Authenticating...' : 'Login with Token'}
                                </Button>
                                <Text 
                                    fontSize="$xs" 
                                    color="$neutral11" 
                                    textAlign="center"
                                >
                                    Ensure your token has 'repo', 'read:org', and 'read:user' scopes
                                </Text>
                            </VStack>
                        )}

                        {activeTab() === 1 && (
                            <VStack spacing="$4" mt="$4">
                                <Button 
                                    w="$full" 
                                    colorScheme="success" 
                                    leftIcon={<FaBrandsGg />}
                                    onClick={handleGitHubOAuth}
                                >
                                    Continue with GitHub
                                </Button>
                                <Text 
                                    fontSize="$xs" 
                                    color="$neutral11" 
                                    textAlign="center"
                                >
                                    You'll be redirected to GitHub for authentication
                                </Text>
                            </VStack>
                        )}
                    </Tabs>
                </VStack>
            </Box>
        </div>
    );
};

export default LoginPage;