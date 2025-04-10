import { Component, createSignal, Show } from 'solid-js';
import { VStack, Text, Box, Alert, AlertDescription } from "@hope-ui/solid";
import { Card } from '../components/UI/Card';
import { useGithubData } from '../hooks/useGithubData'; 
import { DetailedTrendAnalysis } from '../components/Analysis/DetailedTrendAnalysis';
import { EnhancedTeamPerformance } from '../components/Analysis/EnhancedTeamPerformance';
import { ActivityDistribution } from '../components/Analysis/ActivityDistribution';
import { AnalysisAlerts } from '../components/Analysis/AnalysisAlerts';
import { DataUploader } from '../components/Analysis/DataUploader';
import type { AnalysisData, HistoricalData } from '../types/analysis';
import { calculateProgressAnalysis } from '../utils/analysisUtils';
import { MemberProgressComparison } from '../components/Analysis/MemberProgressComparison';
import { Motion } from "@motionone/solid";

export const ComparativeAnalysis: Component = () => {
    const { data } = useGithubData();
    const [_, setHistoricalData] = createSignal<HistoricalData | null>(null);
    const [analysisData, setAnalysisData] = createSignal<AnalysisData | null>(null);
    const [error, setError] = createSignal("");

    const handleSaveCurrentProgress = () => {
        const currentData = data();
        if (!currentData) return;

        try {
            // Transform and clean data to ensure consistent format
            const transformedData: HistoricalData = {
                projects: currentData.projects.map((project: { number: any; name: any; issues: any[]; }) => ({
                    number: project.number,
                    name: project.name,
                    issues: project.issues.map((issue: { number: any; repository: { name: any; }; }) => ({
                        number: issue.number,
                        repository: typeof issue.repository === 'string'
                            ? issue.repository
                            : issue.repository.name
                    }))
                })),
                issues: currentData.issues.map(issue => ({
                    number: issue.number,
                    repository: {
                        name: issue.repository?.name || ''
                    },
                    state: issue.state || 'open',
                    body: issue.body || null,
                    assignee: issue.assignee ? {
                        login: issue.assignee.login
                    } : undefined
                })).filter(issue => issue.repository.name),
                members: currentData.members.map((member: { login: any; }) => ({
                    login: member.login
                })),
                pullRequests: currentData.pullRequests.map(pr => ({
                    repository: {
                        name: pr.repository?.name || ''
                    },
                    user: {
                        login: pr.user?.login || ''
                    }
                })).filter(pr => pr.repository.name && pr.user.login),
                commits: currentData.commits.map(commit => ({
                    repository: {
                        name: commit.repository?.name || ''
                    },
                    author: commit.author ? {
                        login: commit.author.login
                    } : undefined
                })).filter(commit => commit.repository.name),
                repositories: undefined
            };

            const filename = `progress-snapshot-${new Date().toISOString().split('T')[0]}.json`;
            const jsonStr = JSON.stringify(transformedData, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            (window as any).DebugLogger.error('Error saving progress:', err);
            setError('Error saving current progress. Please try again.');
        }
    };

    const handleHistoricalUpload = (uploadedData: HistoricalData) => {
        try {
            setHistoricalData(uploadedData);
            const currentData = data();
            if (currentData) {
                const analysis = calculateProgressAnalysis(uploadedData, currentData);
                setAnalysisData(analysis);
                setError("");
            }
        } catch (err) {
            (window as any).DebugLogger.error('Error processing file:', err);
            setError("Error processing comparison data. Please ensure file format is correct.");
        }
    };

    return (
        <div class="max-w-7xl mx-auto px-4 py-8" style={{ 'font-family': 'Figtree' }}>
            {/* Header Section with Gradient Background */}
            <Card class="mb-8 bg-gradient-to-r from-blue-900 to-purple-800 text-white overflow-hidden">
                <VStack spacing="$6" p="$8" position="relative">
                    {/* Decorative Elements */}
                    <div class="absolute top-0 right-0 w-64 h-64 bg-cyan-500 rounded-full filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2" />
                    <div class="absolute bottom-0 left-0 w-48 h-48 bg-pink-500 rounded-full filter blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2" />
                    
                    <Text 
                        size="3xl" 
                        fontWeight="$bold"
                        class="relative z-10 bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent"
                    >
                        Progress Comparison Analysis
                    </Text>
                    <Text color="white" class="relative z-10 text-center max-w-2xl opacity-90">
                        Upload a previous progress snapshot to analyze team and project development over time.
                    </Text>
                    <DataUploader
                        onSaveProgress={handleSaveCurrentProgress}
                        onHistoricalUpload={handleHistoricalUpload}
                        error={error()}
                    />
                </VStack>
            </Card>

            <Show when={analysisData()} fallback={
                <Motion 
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Card class="bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                        <VStack spacing="$4" alignItems="center" py="$12">
                            <Text 
                                size="xl" 
                                class="text-gray-600 dark:text-gray-300"
                                style={{ 'font-family': 'Figtree' }}
                            >
                                Upload historical data to view detailed progress analysis
                            </Text>
                            <Box 
                                class="animate-bounce text-4xl"
                                color="$cyan600"
                            >
                                ↑
                            </Box>
                        </VStack>
                    </Card>
                </Motion>
            }>
                {(analysis) => (
                    <Motion 
                        class="space-y-8" 
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        {/* High-level Overview with Gradient Cards */}
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card class="bg-gradient-to-br from-blue-900 to-blue-800 text-white p-6">
                                <Text size="lg" class="opacity-80">Total Progress</Text>
                                <Text size="3xl" fontWeight="$bold">
                                    {analysis().summary.overallProgress.toFixed(1)}%
                                </Text>
                            </Card>
                            <Card class="bg-gradient-to-br from-purple-800 to-pink-700 text-white p-6">
                                <Text size="lg" class="opacity-80">Active Members</Text>
                                <Text size="3xl" fontWeight="$bold">
                                    {analysis().summary.highPerformers}
                                </Text>
                            </Card>
                            <Card class="bg-gradient-to-br from-emerald-700 to-cyan-700 text-white p-6">
                                <Text size="lg" class="opacity-80">Completed Tasks</Text>
                                <Text size="3xl" fontWeight="$bold">
                                    {analysis().summary.taskProgress.completed}
                                </Text>
                            </Card>
                        </div>

                        {/* Key Alerts with Enhanced Styling */}
                        <Card class="bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700">
                            <AnalysisAlerts 
                                summary={analysis().summary}
                                memberChanges={analysis().memberChanges}
                            />
                        </Card>

                        {/* Trend Analysis Section */}
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <Card class="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
                                <DetailedTrendAnalysis projectChanges={analysis().projectChanges} />
                            </Card>
                            
                            <Card class="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
                                <EnhancedTeamPerformance memberChanges={analysis().memberChanges} />
                            </Card>
                        </div>

                        {/* Member Progress Section */}
                        <Card class="bg-white dark:bg-gray-800 shadow-lg">
                            <MemberProgressComparison memberChanges={analysis().memberChanges} />
                        </Card>

                        {/* Activity Distribution with Enhanced Visuals */}
                        <Card class="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                            <ActivityDistribution memberChanges={analysis().memberChanges} />
                        </Card>

                        {/* Analysis Summary with Modern Design */}
                        <Card class="bg-white dark:bg-gray-800 shadow-lg">
                            <Text 
                                size="xl" 
                                fontWeight="$bold" 
                                class="mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                            >
                                Analysis Summary
                            </Text>
                            <VStack spacing="$6" alignItems="stretch">
                                {analysis().summary.overallProgress >= 0 ? (
                                    <Alert status="success">
                                        <AlertDescription>
                                            Overall positive progress with {analysis().summary.overallProgress.toFixed(1)}% improvement.
                                            {analysis().summary.highPerformers} team members showing exceptional performance.
                                        </AlertDescription>
                                    </Alert>
                                ) : (
                                    <Alert status="warning">
                                        <AlertDescription>
                                            Team progress shows a {Math.abs(analysis().summary.overallProgress).toFixed(1)}% decline.
                                            Consider reviewing processes and providing additional support.
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <Box class="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Metric Cards */}
                                    <Card class="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6">
                                        <Text color="$blue600" size="sm">New Pull Requests</Text>
                                        <Text size="2xl" fontWeight="$bold" class="mt-2">
                                            +{analysis().summary.totalNewPRs}
                                        </Text>
                                    </Card>
                                    
                                    <Card class="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6">
                                        <Text color="$purple600" size="sm">New Commits</Text>
                                        <Text size="2xl" fontWeight="$bold" class="mt-2">
                                            +{analysis().summary.totalNewCommits}
                                        </Text>
                                    </Card>
                                    
                                    <Card class="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-6">
                                        <Text color="$emerald600" size="sm">Task Completion Rate</Text>
                                        <Text size="2xl" fontWeight="$bold" class="mt-2">
                                            {((analysis().summary.taskProgress.completed / analysis().summary.taskProgress.total) * 100).toFixed(1)}%
                                        </Text>
                                    </Card>
                                </Box>
                            </VStack>
                        </Card>
                    </Motion>
                )}
            </Show>
        </div>
    );
};

export default ComparativeAnalysis;