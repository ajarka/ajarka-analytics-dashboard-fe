import { Component, createSignal, onMount } from 'solid-js';
import { useAuth } from '../auth/AuthContext';
import { useNavigate, useLocation } from '@solidjs/router';
import { 
    VStack, 
    Text, 
    Box, 
    Button, 
    Input,
    HStack
} from '@hope-ui/solid';
import { FaBrandsGithub, FaSolidUser } from 'solid-icons/fa';

// Helper function untuk generate stars seperti di HomePage
const generateStars = (count: number) => {
  return Array.from({ length: count }).map((_, ) => ({
    size: Math.random() * 3,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: 5 + Math.random() * 10,
    delay: Math.random() * 5
  }));
};

export const LoginPage: Component = () => {
    const auth = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [activeMethod] = createSignal(0);
    const [email, setEmail] = createSignal('');
    const [password, setPassword] = createSignal('');
    const [error, setError] = createSignal('');
    const [isLoading, setIsLoading] = createSignal(false);

    const stars = generateStars(100);

    onMount(() => {
        // Check URL parameters for OAuth callback
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (code) {
            handleGitHubCallback(code);
            return;
        }

        // Redirect to intended route if already authenticated
        if (auth.isAuthenticated) {
            const redirectTo = (location.state as any)?.redirectTo || '/dashboard';
            navigate(redirectTo);
        }
    });

    const handleGitHubCallback = async (code: string) => {
        setIsLoading(true);
        try {
            const success = await auth.loginWithGitHub(code);
            if (success) {
                const redirectTo = (location.state as any)?.redirectTo || '/dashboard';
                navigate(redirectTo);
            } else {
                setError('GitHub authentication failed');
            }
        } catch (err) {
            setError('An error occurred during GitHub authentication');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmailLogin = async () => {
        if (!email() || !password()) {
            setError('Please enter both email and password');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const success = await auth.login({
                email: email(),
                password: password()
            });
            
            if (success) {
                const redirectTo = (location.state as any)?.redirectTo || '/dashboard';
                console.log('🚀 Login successful, navigating to:', redirectTo);
                navigate(redirectTo);
            } else {
                console.log('❌ Login failed');
                setError('Invalid email or password');
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGitHubOAuth = () => {
        const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
        const redirectUri = `${window.location.origin}/oauth-callback`;
        const scope = 'repo,read:org,read:user';

        console.log('🚀 Starting GitHub OAuth flow...');
        console.log('- Client ID:', clientId);
        console.log('- Redirect URI:', redirectUri);
        console.log('- Current Origin:', window.location.origin);

        if (!clientId) {
            setError('GitHub OAuth is not configured. Please use email login or contact administrator.');
            return;
        }

        const githubOAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=oauth`;
        
        console.log('🔗 OAuth URL:', githubOAuthUrl);
        console.log('⚠️ Make sure GitHub OAuth App callback URL matches:', redirectUri);
        
        window.location.href = githubOAuthUrl;
    };

    return (
        <div class="relative min-h-screen bg-[#0B1026] overflow-hidden">
            {/* Enhanced Animated Background - sama seperti HomePage */}
            <div class="fixed inset-0 z-0">
                {/* Deep Space Gradient */}
                <div class="absolute inset-0 bg-gradient-radial from-blue-900/20 via-[#0B1026] to-[#0B1026]" />
                
                {/* Animated Stars */}
                <div class="absolute inset-0">
                    {stars.map((star,) => (
                        <div
                            class="absolute rounded-full bg-white animate-twinkle"
                            style={{
                                width: `${star.size}px`,
                                height: `${star.size}px`,
                                top: `${star.y}%`,
                                left: `${star.x}%`,
                                opacity: Math.random() * 0.7 + 0.3,
                                animation: `twinkle ${star.duration}s ease-in-out infinite`,
                                'animation-delay': `${star.delay}s`
                            }}
                        />
                    ))}
                </div>

                {/* Nebula Effect */}
                <div class="absolute inset-0 opacity-30">
                    <div class="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-blue-500/10 animate-aurora" />
                    <div class="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent animate-aurora-vertical" />
                </div>

                {/* Enhanced Grid Pattern */}
                <div 
                    class="absolute inset-0 opacity-[0.07]"
                    style={{
                        'background-image': `
                            linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
                        `,
                        'background-size': '100px 100px',
                        'mask-image': 'radial-gradient(circle at 50% 50%, black 0%, transparent 70%)'
                    }}
                />

                {/* Dynamic Glow Effects */}
                <div class="absolute inset-0">
                    <div class="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-blue-500/20 blur-[150px] animate-pulse-slow" />
                    <div class="absolute top-1/3 left-1/3 w-1/3 h-1/3 bg-purple-500/20 blur-[150px] animate-pulse-slower" />
                </div>
            </div>

            {/* Main Login Content */}
            <div class="relative z-10 min-h-screen flex items-center justify-center px-4">
                <div class="w-full max-w-6xl mx-auto">
                    {/* Header with Dashboard Monitoring theme */}
                    <Box textAlign="center" mb="$12" class="text-white">
                        <div class="mb-6 transform transition-transform hover:scale-110">
                            <svg class="w-16 h-16 mx-auto text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                            </svg>
                        </div>
                        <Text size="4xl" fontWeight="bold" class="mb-4 tracking-tight text-white">
                            Dashboard Monitoring
                        </Text>
                        <Text size="xl" class="text-blue-200 mb-2">
                            Track and manage in real-time
                        </Text>
                        <Text size="lg" class="text-white/80 max-w-2xl mx-auto leading-relaxed">
                            Interactive Dashboard monitoring system for management and infrastructure tracking
                        </Text>
                    </Box>

                    {/* Login Cards Grid - sesuai dengan tema Dashboard Monitoring */}
                    <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {/* Email/Password Login Card */}
                        <div class="relative">
                            <div 
                                class="absolute inset-0 rounded-2xl transition-all duration-500"
                                style={{
                                    'background': 'linear-gradient(to bottom right, rgb(4 40 118 / 75%), rgb(26 20 124 / 79%))'
                                }}
                            />
                            <div class="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md border border-white/10">
                                <VStack spacing="$6" alignItems="flex-start" p="$8" class="h-full">
                                    {/* Icon */}
                                    <Box class="mx-auto mb-4">
                                        <div class="p-4 rounded-xl bg-white/20 backdrop-blur-sm">
                                            <FaSolidUser class="w-8 h-8 text-white" />
                                        </div>
                                    </Box>

                                    <Box class="w-full text-center text-white">
                                        <Text size="xl" fontWeight="bold" class="mb-2">Email Authentication</Text>
                                        <Text class="text-white/80 text-sm mb-6">
                                            Sign in with your Smartelco credentials
                                        </Text>
                                    </Box>

                                    {/* Email Form */}
                                    <VStack spacing="$4" class="w-full">
                                        <Input 
                                            type="email"
                                            placeholder="admin@smartelco.com"
                                            value={email()}
                                            onInput={(e: { currentTarget: { value: any; }; }) => setEmail(e.currentTarget.value)}
                                            w="$full"
                                            class="bg-white/10 border-white/20 text-white placeholder-white/60 backdrop-blur-sm"
                                        />
                                        
                                        <Input 
                                            type="password"
                                            placeholder="Enter your password"
                                            value={password()}
                                            onInput={(e: { currentTarget: { value: any; }; }) => setPassword(e.currentTarget.value)}
                                            w="$full"
                                            class="bg-white/10 border-white/20 text-white placeholder-white/60 backdrop-blur-sm"
                                            onKeyDown={(e: KeyboardEvent) => {
                                                if (e.key === 'Enter') {
                                                    handleEmailLogin();
                                                }
                                            }}
                                        />
                                    </VStack>

                                    {error() && activeMethod() === 0 && (
                                        <Box class="w-full bg-red-500/20 border border-red-400/30 rounded-lg p-3 backdrop-blur-sm">
                                            <Text class="text-red-200 text-sm">
                                                {error()}
                                            </Text>
                                        </Box>
                                    )}

                                    {/* Staging Mode Info */}
                                    <Box class="w-full bg-green-500/20 border border-green-400/30 rounded-lg p-4 backdrop-blur-sm">
                                        <Text class="text-green-200 text-xs font-medium mb-2">
                                            🚀 Staging Mode - Login Bypassed:
                                        </Text>
                                        <Text class="text-green-100 text-xs block mb-1">
                                            Any email/password will work!
                                        </Text>
                                        <Text class="text-green-100 text-xs">
                                            Try: admin@smartelco.com / any_password
                                        </Text>
                                    </Box>

                                    {/* Login Button */}
                                    <Button
                                        w="$full"
                                        size="lg"
                                        onClick={handleEmailLogin}
                                        disabled={isLoading()}
                                        class="bg-white/95 hover:bg-white text-gray-900 font-bold transform transition-all hover:scale-105 hover:shadow-xl"
                                    >
                                        <HStack spacing="$2">
                                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                                            </svg>
                                            <span>{isLoading() ? 'Signing In...' : 'Launch Dashboard'}</span>
                                        </HStack>
                                    </Button>
                                </VStack>
                            </div>
                        </div>

                        {/* GitHub OAuth Login Card */}
                        <div class="relative">
                            <div 
                                class="absolute inset-0 rounded-2xl transition-all duration-500"
                                style={{
                                    'background': 'linear-gradient(to bottom right, rgb(55 65 81 / 75%), rgb(17 24 39 / 79%))'
                                }}
                            />
                            <div class="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md border border-white/10">
                                <VStack spacing="$6" alignItems="flex-start" p="$8" class="h-full">
                                    {/* Icon */}
                                    <Box class="mx-auto mb-4">
                                        <div class="p-4 rounded-xl bg-gray-900/80 backdrop-blur-sm">
                                            <FaBrandsGithub class="w-8 h-8 text-white" />
                                        </div>
                                    </Box>

                                    <Box class="w-full text-center text-white">
                                        <Text size="xl" fontWeight="bold" class="mb-2">GitHub OAuth</Text>
                                        <Text class="text-white/80 text-sm mb-6">
                                            Connect with GitHub for enhanced access
                                        </Text>
                                    </Box>

                                    {/* OAuth Benefits */}
                                    <VStack spacing="$3" class="w-full">
                                        <Box class="flex items-center space-x-2 text-sm text-white/80">
                                            <div class="w-2 h-2 bg-green-400 rounded-full"></div>
                                            <span>Real GitHub API tokens</span>
                                        </Box>
                                        <Box class="flex items-center space-x-2 text-sm text-white/80">
                                            <div class="w-2 h-2 bg-green-400 rounded-full"></div>
                                            <span>Enhanced repository access</span>
                                        </Box>
                                        <Box class="flex items-center space-x-2 text-sm text-white/80">
                                            <div class="w-2 h-2 bg-green-400 rounded-full"></div>
                                            <span>Secure OAuth authentication</span>
                                        </Box>
                                    </VStack>

                                    {error() && activeMethod() === 1 && (
                                        <Box class="w-full bg-red-500/20 border border-red-400/30 rounded-lg p-3 backdrop-blur-sm">
                                            <Text class="text-red-200 text-sm">
                                                {error()}
                                            </Text>
                                        </Box>
                                    )}

                                    {/* OAuth Notice */}
                                    <Box class="w-full bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-4 backdrop-blur-sm">
                                        <Text class="text-yellow-200 text-xs text-center">
                                            Note: GitHub OAuth requires application setup in GitHub Developer Settings
                                        </Text>
                                    </Box>

                                    {/* OAuth Button */}
                                    <Button
                                        w="$full"
                                        size="lg"
                                        onClick={handleGitHubOAuth}
                                        disabled={isLoading()}
                                        class="bg-gray-900 hover:bg-gray-800 text-white font-bold transform transition-all hover:scale-105 hover:shadow-xl"
                                    >
                                        <HStack spacing="$3">
                                            <FaBrandsGithub class="w-5 h-5" />
                                            <span>{isLoading() ? 'Connecting...' : 'Continue with GitHub'}</span>
                                        </HStack>
                                    </Button>
                                </VStack>
                            </div>
                        </div>
                    </div>

                    {/* Back to Home */}
                    <div class="text-center mt-12">
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/')}
                            class="text-white/60 hover:text-white transition-colors"
                        >
                            ← Back to Home
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;