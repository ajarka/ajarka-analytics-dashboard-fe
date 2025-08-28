import { Router, Route } from '@solidjs/router';
import { HopeProvider } from '@hope-ui/solid';
import { MainLayout } from './components/Layout/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { MemberDetail } from './pages/MemberDetail';
import { ResourceUtilization } from './pages/ResourceUtilization';
import { ComparativeAnalysis } from './pages/ComparativeAnalysis';
import { useGithubData } from './hooks/useGithubData';
import { Component, createSignal, onMount } from 'solid-js';
import { AuthProvider, OAuthCallbackPage, ProtectedRoute } from './auth/AuthContext';
import LoginPage from './pages/LoginPage';
import ProjectDetail from './pages/ProjectDetail';
import RepositoryDetail from './pages/RepositoryDetail';
import { RateLimitProvider } from './context/RateLimitContext';
import TeamCalendar from './pages/TeamCalendar';
import { ThemeProvider } from './context/ThemeContext';
import HomePage from './pages/HomePage';
import MappingResource from './pages/MappingResource';
import { ResourceLoad } from './pages/ResourceLoad';
import ProjectTime from './pages/ProjectTime';

const App: Component = () => {
  const { refetch } = useGithubData();
  const [lastUpdateTime, setLastUpdateTime] = createSignal<Date>(new Date());

  const lastUpdate = () => {
    return lastUpdateTime().toLocaleTimeString();
  };

  const handleRefresh = async () => {
    await refetch();
    setLastUpdateTime(new Date());
  };

  onMount(() => {
    setLastUpdateTime(new Date());
  });

  return (
    <HopeProvider>
      <ThemeProvider>
        <AuthProvider>
          <RateLimitProvider>
            <Router>
              <Route path="/" component={HomePage} />
              <Route path="/login" component={LoginPage} />
              <Route path="/oauth-callback" component={OAuthCallbackPage} />
              <Route path="/dashboard" component={() => (
                <ProtectedRoute>
                  <MainLayout onRefresh={handleRefresh} lastUpdate={lastUpdate}>
                    <Dashboard />
                  </MainLayout>
                </ProtectedRoute>
              )} />
              <Route path="/member/:login" component={() => (
                // <ProtectedRoute>
                <MainLayout onRefresh={handleRefresh} lastUpdate={lastUpdate}>
                  <MemberDetail />
                </MainLayout>
                // </ProtectedRoute>
              )} />
              <Route path="/project/:number" component={() => (
                <MainLayout onRefresh={handleRefresh} lastUpdate={lastUpdate}>
                  <ProjectDetail />
                </MainLayout>
              )} />
              <Route path="/repository/:name" component={() => (
                <MainLayout onRefresh={handleRefresh} lastUpdate={lastUpdate}>
                  <RepositoryDetail />
                </MainLayout>
              )} />
              <Route path="/utilization" component={() => (
                // <ProtectedRoute>
                <MainLayout onRefresh={handleRefresh} lastUpdate={lastUpdate}>
                  <ResourceUtilization />
                </MainLayout>
                // </ProtectedRoute>
              )} />
              <Route path="/analysis" component={() => (
                // <ProtectedRoute>
                <MainLayout onRefresh={handleRefresh} lastUpdate={lastUpdate}>
                  <ComparativeAnalysis />
                </MainLayout>
                // </ProtectedRoute>
              )} />
              <Route path="/calendar" component={() => (
                <MainLayout onRefresh={handleRefresh} lastUpdate={lastUpdate}>
                  <TeamCalendar />
                </MainLayout>
              )} />

              <Route path="/mapping-resource" component={() => (
                <MainLayout onRefresh={handleRefresh} lastUpdate={lastUpdate}>
                  <MappingResource />
                </MainLayout>
              )} />

              <Route path="/resource-load" component={() => (
                <MainLayout onRefresh={handleRefresh} lastUpdate={lastUpdate}>
                  <ResourceLoad />
                </MainLayout>
              )} />

<Route path="/project-time" component={() => (
                <MainLayout onRefresh={handleRefresh} lastUpdate={lastUpdate}>
                  <ProjectTime />
                </MainLayout>
              )} />

            </Router>
          </RateLimitProvider>
        </AuthProvider>
      </ThemeProvider>
    </HopeProvider>
  );
};

export default App;