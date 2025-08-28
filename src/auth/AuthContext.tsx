import { createContext, ParentComponent, createSignal, createEffect, useContext, Component, onMount, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { authService, LoginCredentials, User } from '../services/auth';
import { refreshGithubToken } from '../services/github';

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    login: (credentials: LoginCredentials) => Promise<boolean>;
    loginWithGitHub: (code: string) => Promise<boolean>;
    logout: () => void;
    githubToken: string | null;
    authChecked: boolean;
}

const initialAuthContext: AuthContextType = {
    isAuthenticated: false,
    user: null,
    login: async () => false,
    loginWithGitHub: async () => false,
    logout: () => {},
    githubToken: null,
    authChecked: false
};

export const AuthContext = createContext<AuthContextType>(initialAuthContext);

export const AuthProvider: ParentComponent = (props) => {
    // Check localStorage immediately during initialization
    const initialToken = localStorage.getItem('auth_token');
    const initialUserData = localStorage.getItem('auth_user');
    const hasInitialAuth = !!(initialToken && initialUserData);
    
    console.log('🚀 AuthProvider initializing...');
    console.log('- Initial token exists:', !!initialToken);
    console.log('- Initial user data exists:', !!initialUserData);
    
    const [isAuthenticated, setIsAuthenticated] = createSignal(hasInitialAuth);
    const [user, setUser] = createSignal<User | null>(
        hasInitialAuth ? JSON.parse(initialUserData!) : null
    );
    const [authChecked, setAuthChecked] = createSignal(hasInitialAuth);

    const login = async (credentials: LoginCredentials) => {
        try {
            console.log('🚀 Email Login - BYPASSED for staging deployment');
            
            // BYPASS: Auto-approve any email/password login for staging
            const mockUser = {
                id: 1,
                email: credentials.email,
                name: credentials.email.includes('admin') ? 'Administrator' : 'User',
                role: credentials.email.includes('admin') ? 'admin' : 'user'
            };
            
            const mockToken = `token_${Date.now()}_bypass`;
            
            console.log('✅ Auto-approved login for:', mockUser.email);
            console.log('🔄 Setting auth state...');
            
            setUser(mockUser);
            setIsAuthenticated(true);
            setAuthChecked(true); // Make sure auth is marked as checked
            authService.storeToken(mockToken);
            authService.storeUser(mockUser);
            
            console.log('✅ Auth state set - isAuthenticated:', true, 'authChecked:', true);
            
            return true;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    };

    const loginWithGitHub = async (code: string) => {
        try {
            const response = await authService.loginWithGitHub(code);
            
            if (response.success && response.user && response.token) {
                setUser(response.user);
                setIsAuthenticated(true);
                authService.storeToken(response.token);
                authService.storeUser(response.user);
                
                // Refresh GitHub API token since this is OAuth login
                console.log('🔄 Refreshing GitHub API token from OAuth login');
                refreshGithubToken();
                
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.error('GitHub login error:', error);
            return false;
        }
    };

    const logout = async () => {
        const token = authService.getStoredToken();
        if (token) {
            await authService.logout(token);
        }
        authService.removeToken();
        setIsAuthenticated(false);
        setUser(null);
    };

    onMount(() => {
        const checkStoredSession = async () => {
            console.log('🔍 AuthProvider - checking stored session on mount...');
            console.log('- Current auth state: isAuthenticated:', isAuthenticated(), 'authChecked:', authChecked());
            
            // If already initialized from localStorage, just validate
            if (isAuthenticated() && authChecked()) {
                console.log('✅ Auth already initialized from localStorage - skipping check');
                return;
            }
            
            const token = authService.getStoredToken();
            const userData = JSON.parse(localStorage.getItem('auth_user') || '{}');
            
            console.log('- Raw localStorage auth_token:', localStorage.getItem('auth_token'));
            console.log('- Raw localStorage auth_user:', localStorage.getItem('auth_user'));
            console.log('- Token from authService:', token);
            console.log('- Parsed user data:', userData);
            console.log('- Token exists:', !!token);
            console.log('- User data exists:', !!userData.email);
            
            if (token) {
                // Check if it's a bypass token (for staging)
                if (token.includes('_bypass') && userData.email) {
                    console.log('🔄 Restoring bypass session for:', userData.email);
                    setUser(userData);
                    setIsAuthenticated(true);
                    setAuthChecked(true);
                    console.log('✅ Bypass session restored - isAuthenticated: true, authChecked: true');
                    return;
                }
                
                // Regular session validation for OAuth tokens
                console.log('🔄 Validating OAuth session...');
                const sessionUser = await authService.validateSession(token);
                
                if (sessionUser) {
                    console.log('✅ OAuth session valid');
                    setUser(sessionUser);
                    setIsAuthenticated(true);
                    authService.storeUser(sessionUser);
                    
                    // Refresh GitHub API token if user has GitHub token
                    if (sessionUser.githubToken) {
                        console.log('🔄 Refreshing GitHub API token from session validation');
                        refreshGithubToken();
                    }
                } else {
                    console.log('❌ OAuth session invalid - cleaning up');
                    authService.removeToken();
                    setUser(null);
                    setIsAuthenticated(false);
                }
            } else {
                console.log('❌ No token found');
                setUser(null);
                setIsAuthenticated(false);
            }
            
            setAuthChecked(true);
            console.log('✅ Auth check completed - authChecked set to true');
        };

        checkStoredSession();
    });

    const authContextValue = {
        get isAuthenticated() { return isAuthenticated(); },
        get user() { return user(); },
        get authChecked() { return authChecked(); },
        get githubToken() { return user()?.githubToken || null; },
        login,
        loginWithGitHub,
        logout
    };

    return (
        <AuthContext.Provider value={authContextValue}>
            {authChecked() ? props.children : null}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const ProtectedRoute: ParentComponent = (props) => {
    const auth = useAuth();

    createEffect(() => {
        console.log('🔍 ProtectedRoute effect - authChecked:', auth.authChecked, 'isAuthenticated:', auth.isAuthenticated);
        
        // Only redirect if auth has been checked and user is not authenticated
        if (auth.authChecked && !auth.isAuthenticated) {
            console.log('❌ Redirecting to login - user not authenticated');
            setTimeout(() => {
                window.location.href = '/login';
            }, 50);
        }
    });

    return (
        <Show 
            when={auth.authChecked}
            fallback={
                <div class="flex items-center justify-center min-h-screen">
                    <div class="text-center">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4" />
                        <p class="text-gray-600">Checking authentication...</p>
                    </div>
                </div>
            }
        >
            <Show 
                when={auth.isAuthenticated}
                fallback={
                    <div class="flex items-center justify-center min-h-screen">
                        <div class="text-center">
                            <p class="text-gray-600">Redirecting to login...</p>
                        </div>
                    </div>
                }
            >
                {() => {
                    console.log('✅ Rendering protected content - user authenticated');
                    return <>{props.children}</>;
                }}
            </Show>
        </Show>
    );
};

export const OAuthCallbackPage: Component = () => {
    const auth = useAuth();

    createEffect(async () => {
        console.log('🔍 OAuth Callback Page loaded');
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        console.log('- URL Params:', window.location.search);
        console.log('- Auth Code:', code);

        if (code) {
            try {
                console.log('🚀 Starting OAuth login with code:', code);
                const loginSuccess = await auth.loginWithGitHub(code);
                
                console.log('🔄 OAuth login result:', loginSuccess);
                
                if (loginSuccess) {
                    console.log('✅ OAuth login successful, redirecting to dashboard');
                    
                    // Verify token storage
                    const authToken = localStorage.getItem('auth_token');
                    const userData = localStorage.getItem('auth_user');
                    console.log('🔍 Verification after login:');
                    console.log('- Auth Token stored:', authToken ? 'Yes' : 'No');
                    console.log('- User Data stored:', userData ? 'Yes' : 'No');
                    
                    window.location.href = '/dashboard';
                } else {
                    console.log('❌ OAuth login failed, redirecting to login');
                    window.location.href = '/login';
                }
            } catch (error) {
                console.error('❌ OAuth callback error:', error);
                window.location.href = '/login';
            }
        } else {
            console.log('❌ No OAuth code found, redirecting to login');
            window.location.href = '/login';
        }
    });

    return (
        <div class="flex items-center justify-center min-h-screen">
            <div class="text-center">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
                <p>Authenticating...</p>
            </div>
        </div>
    );
};