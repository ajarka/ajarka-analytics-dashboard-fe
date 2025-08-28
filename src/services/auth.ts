import axios from 'axios';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  githubToken?: string;
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

export interface AuthSession {
  id: string;
  userId: number;
  token: string;
  createdAt: string;
  expiresAt: string;
}

class AuthService {
  private baseUrl = 'http://localhost:3003';

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/users`);
      const users = response.data;
      
      const user = users.find((u: any) => 
        u.email === credentials.email && u.password === credentials.password
      );

      if (user) {
        const sessionToken = this.generateSessionToken();
        const session: AuthSession = {
          id: `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: user.id,
          token: sessionToken,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };

        await axios.post(`${this.baseUrl}/auth_sessions`, session);

        return {
          success: true,
          user: { ...user, password: undefined },
          token: sessionToken
        };
      } else {
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Authentication service unavailable'
      };
    }
  }

  async loginWithGitHub(code: string): Promise<LoginResponse> {
    try {
      const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
      const clientSecret = import.meta.env.VITE_GITHUB_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return {
          success: false,
          message: 'GitHub OAuth not configured'
        };
      }

      const tokenResponse = await axios.post(
        'https://github.com/login/oauth/access_token',
        {
          client_id: clientId,
          client_secret: clientSecret,
          code: code
        },
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      const accessToken = tokenResponse.data.access_token;
      
      if (!accessToken) {
        return {
          success: false,
          message: 'Failed to get access token from GitHub'
        };
      }

      const userResponse = await axios.get('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const githubUser = userResponse.data;
      
      let user = await this.findOrCreateGitHubUser(githubUser, accessToken);

      const sessionToken = this.generateSessionToken();
      const session: AuthSession = {
        id: `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        token: sessionToken,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      await axios.post(`${this.baseUrl}/auth_sessions`, session);

      return {
        success: true,
        user: user,
        token: sessionToken
      };
    } catch (error) {
      console.error('GitHub login error:', error);
      return {
        success: false,
        message: 'GitHub authentication failed'
      };
    }
  }

  async findOrCreateGitHubUser(githubUser: any, accessToken: string): Promise<User> {
    try {
      const response = await axios.get(`${this.baseUrl}/users`);
      const users = response.data;
      
      let user = users.find((u: any) => u.email === githubUser.email);

      if (user) {
        user.githubToken = accessToken;
        await axios.put(`${this.baseUrl}/users/${user.id}`, user);
      } else {
        const newUser = {
          email: githubUser.email || `${githubUser.login}@github.com`,
          name: githubUser.name || githubUser.login,
          role: 'user',
          githubToken: accessToken,
          githubLogin: githubUser.login
        };
        
        const createResponse = await axios.post(`${this.baseUrl}/users`, newUser);
        user = createResponse.data;
      }

      return user;
    } catch (error) {
      console.error('Error finding/creating GitHub user:', error);
      throw error;
    }
  }

  async validateSession(token: string): Promise<User | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/auth_sessions`);
      const sessions = response.data;
      
      const session = sessions.find((s: AuthSession) => 
        s.token === token && new Date(s.expiresAt) > new Date()
      );

      if (session) {
        const userResponse = await axios.get(`${this.baseUrl}/users/${session.userId}`);
        return userResponse.data;
      }

      return null;
    } catch (error) {
      console.error('Session validation error:', error);
      return null;
    }
  }

  async logout(token: string): Promise<void> {
    try {
      const response = await axios.get(`${this.baseUrl}/auth_sessions`);
      const sessions = response.data;
      
      const session = sessions.find((s: AuthSession) => s.token === token);
      
      if (session) {
        await axios.delete(`${this.baseUrl}/auth_sessions/${session.id}`);
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  private generateSessionToken(): string {
    return `token_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }

  getStoredToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  storeToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  removeToken(): void {
    localStorage.removeItem('auth_token');
  }
}

export const authService = new AuthService();