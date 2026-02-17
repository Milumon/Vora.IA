import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api/endpoints';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const { user, token, isAuthenticated, setUser, setToken, logout: logoutStore } = useAuthStore();
  const router = useRouter();

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);
      const { access_token } = response.data;
      
      setToken(access_token);
      // TODO: Fetch user data
      setUser({ id: 'temp', email });
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.detail || 'Login failed' };
    }
  };

  const register = async (email: string, password: string, fullName: string) => {
    try {
      await authApi.register(email, password, fullName);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.detail || 'Registration failed' };
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      logoutStore();
      router.push('/auth/login');
    }
  };

  return {
    user,
    token,
    isAuthenticated,
    login,
    register,
    logout,
  };
}
