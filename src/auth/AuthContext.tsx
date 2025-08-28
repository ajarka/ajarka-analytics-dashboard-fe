import { createContext, ParentComponent, createSignal, createEffect, useContext, Component } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { authService, LoginCredentials, User } from '../services/auth';

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    login: (credentials: LoginCredentials) => Promise<boolean>;
    loginWithGitHub: (code: string) => Promise<boolean>;
    logout: () => void;
    githubToken: string | null;
}

const initialAuthContext: AuthContextType = {
    isAuthenticated: false,
    user: null,
    login: async () => false,
    loginWithGitHub: async () => false,
    logout: () => {},
    githubToken: null
};

export const AuthContext = createContext<AuthContextType>(initialAuthContext);

export const AuthProvider: ParentComponent = (props) => {
    const [isAuthenticated, setIsAuthenticated] = createSignal(false);
    const [user, setUser] = createSignal<User | null>(null);
    const [authChecked, setAuthChecked] = createSignal(false);

    const login = async (credentials: LoginCredentials) => {
        try {
            const response = await authService.login(credentials);
            
            if (response.success && response.user && response.token) {
                setUser(response.user);
                setIsAuthenticated(true);
                authService.storeToken(response.token);
                return true;
            } else {
                return false;
            }
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

    createEffect(() => {
        const checkStoredSession = async () => {
            const token = authService.getStoredToken();
            
            if (token) {
                const sessionUser = await authService.validateSession(token);
                
                if (sessionUser) {
                    setUser(sessionUser);
                    setIsAuthenticated(true);
                } else {
                    authService.removeToken();
                    setUser(null);
                    setIsAuthenticated(false);
                }
            }
            
            setAuthChecked(true);
        };

        checkStoredSession();
    });

    const authContextValue = {
        isAuthenticated: isAuthenticated(),
        user: user(),
        login,
        loginWithGitHub,
        logout,
        githubToken: user()?.githubToken || null
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
                const loginSuccess = await auth.loginWithGitHub(code);
                
                if (loginSuccess) {
                    window.location.href = '/dashboard';
                } else {
                    window.location.href = '/login';
                }
            } catch (error) {
                console.error('OAuth callback error:', error);
                window.location.href = '/login';
            }
        } else {
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