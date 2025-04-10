import { createContext, ParentComponent, createSignal, createEffect, useContext, Component } from 'solid-js';
import axios from 'axios';

interface AuthContextType {
    isAuthenticated: boolean;
    login: (token: string) => Promise<boolean>;
    logout: () => void;
    token: string | null;
}

const initialAuthContext: AuthContextType = {
    isAuthenticated: false,
    login: async () => false,
    logout: () => {},
    token: null
};

export const AuthContext = createContext<AuthContextType>(initialAuthContext);

export const AuthProvider: ParentComponent = (props) => {
    const [isAuthenticated, setIsAuthenticated] = createSignal(false);
    const [token, setToken] = createSignal<string | null>(null);
    const [authChecked, setAuthChecked] = createSignal(false);

    const validateToken = async (githubToken: string) => {
        try {
            (window as any).DebugLogger.log('Validating token:', githubToken); // Debug log
            const response = await axios.get('https://api.github.com/user', {
                headers: {
                    'Authorization': `Bearer ${githubToken}`
                }
            });

            return response.status === 200;
        } catch (error) {
            (window as any).DebugLogger.error('Token validation failed:', error);
            return false;
        }
    };

    const login = async (githubToken: string) => {
        try {
            const cleanToken = githubToken.trim().replace(/^GITHUB_TOKEN/, '');
            
            const isValid = await validateToken(cleanToken);
            
            if (isValid) {
                (window as any).DebugLogger.log('Token is valid'); // Debug log
                
                // Ensure clean storage
                localStorage.removeItem('GITHUB_TOKEN');
                localStorage.setItem('GITHUB_TOKEN', cleanToken);
                
                setToken(cleanToken);
                setIsAuthenticated(true);
                return true;
            } else {
                (window as any).DebugLogger.log('Token is invalid'); // Debug log
                localStorage.removeItem('GITHUB_TOKEN');
                setToken(null);
                setIsAuthenticated(false);
                return false;
            }
        } catch (error) {
            (window as any).DebugLogger.error('Login error:', error);
            localStorage.removeItem('GITHUB_TOKEN');
            setToken(null);
            setIsAuthenticated(false);
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('GITHUB_TOKEN');
        setIsAuthenticated(false);
        setToken(null);
    };

    createEffect(() => {
        const checkStoredToken = async () => {
            let storedToken = localStorage.getItem('GITHUB_TOKEN');
            
            // Clean the token if it has unexpected prefixes
            if (storedToken) {
                storedToken = storedToken.trim().replace(/^GITHUB_TOKEN/, '');
                
                (window as any).DebugLogger.log('Checking stored token:', storedToken); // Debug log
                
                const isValid = await validateToken(storedToken);
                
                if (isValid) {
                    localStorage.setItem('GITHUB_TOKEN', storedToken);
                    setToken(storedToken);
                    setIsAuthenticated(true);
                } else {
                    localStorage.removeItem('GITHUB_TOKEN');
                    setToken(null);
                    setIsAuthenticated(false);
                }
            }
            
            setAuthChecked(true);
        };

        checkStoredToken();
    });

    const authContextValue = {
        isAuthenticated: isAuthenticated(),
        login,
        logout,
        token: token()
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
        if (!auth.isAuthenticated) {
            window.location.href = '/login';
        }
    });

    return auth.isAuthenticated ? <>{props.children}</> : null;
};

export const OAuthCallbackPage: Component = () => {
    const auth = useAuth();

    createEffect(async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (code) {
            try {
                // Note: You'll need to implement this backend endpoint
                const response = await axios.post('/api/github/oauth', { code });
                const { access_token } = response.data;

                const loginSuccess = await auth.login(access_token);
                
                if (loginSuccess) {
                    window.location.href = '/';
                } else {
                    window.location.href = '/login';
                }
            } catch (error) {
                (window as any).DebugLogger.error('OAuth callback error:', error);
                window.location.href = '/login';
            }
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