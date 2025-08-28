import { Component, createEffect, For, onMount, createSignal } from 'solid-js';
import { ProjectProgress } from '../components/Progress/ProjectProgress';
import { RepositoryProgress } from '../components/Progress/RepositoryProgress';
import { MemberProgress } from '../components/Progress/MemberProgress'; 
import { ActivityTimeline } from '../components/Dashboard/ActivityTimeline';
import { ProgressListView } from '../components/Progress/ProgressListView';
 
import { useGithubData } from '../hooks/useGithubData';
import { useRateLimit } from '../context/RateLimitContext';
import { Motion } from "@motionone/solid";

import {
    FaSolidUsers,
    FaSolidCircle,
    FaSolidClockRotateLeft,
    FaSolidListCheck,
    FaSolidCodePullRequest,
    FaSolidCodeCommit,
    FaSolidFolder,
    FaSolidCodeBranch,
    FaSolidTableCells,
    FaSolidBars
} from 'solid-icons/fa';
import type { ViewType } from '../types/github';


const menuTabs = [
    { id: 'projects', label: 'Projects Progress' },
    { id: 'repositories', label: 'Repositories Progress' },
    { id: 'members', label: 'Members Progress' }
];

const DashboardSkeleton = () => {
    return (
        <div class="space-y-6">
            {/* Overview Cards Skeleton */}
            <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <For each={[1, 2, 3, 4]}>
                    {() => (
                        <Motion
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            class="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-xl p-4"
                        >
                            <div class="flex items-center space-x-4">
                                <div class="p-3 rounded-lg bg-gray-300 dark:bg-gray-600 w-12 h-12" />
                                <div class="space-y-2">
                                    <div class="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded" />
                                    <div class="h-6 w-16 bg-gray-300 dark:bg-gray-600 rounded" />
                                </div>
                            </div>
                        </Motion>
                    )}
                </For>
            </div>

            {/* Tab Menu Skeleton */}
            <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl border border-blue-900/10 dark:border-blue-300/10 overflow-x-auto mb-6">
                <div class="flex p-2 space-x-4">
                    <For each={[1, 2, 3]}>
                        {() => (
                            <Motion
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                class="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded"
                            />
                        )}
                    </For>
                </div>
            </div>

            {/* Main Content Skeleton */}
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Section Skeleton */}
                <div class="lg:col-span-2">
                    <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl border border-blue-900/10 dark:border-blue-300/10 p-4 lg:p-6">
                        <Motion
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <div class="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
                            <div class="space-y-4">
                                <For each={[1, 2, 3, 4]}>
                                    {() => (
                                        <div class="flex items-center space-x-4">
                                            <div class="h-16 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                                            <div class="flex-1 space-y-2">
                                                <div class="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
                                                <div class="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
                                            </div>
                                        </div>
                                    )}
                                </For>
                            </div>
                        </Motion>
                    </div>
                </div>

                {/* Recent Activity Skeleton */}
                <div class="lg:col-span-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl border border-blue-900/10 dark:border-blue-300/10 p-4 lg:p-6">
                    <Motion
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <div class="h-8 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                        <div class="space-y-3">
                            <For each={[1, 2, 3, 4, 5]}>
                                {() => (
                                    <div class="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                                        <div class="space-y-2">
                                            <div class="h-4 w-3/4 bg-gray-200 dark:bg-gray-600 rounded" />
                                            <div class="h-4 w-1/2 bg-gray-200 dark:bg-gray-600 rounded" />
                                        </div>
                                    </div>
                                )}
                            </For>
                        </div>
                    </Motion>
                </div>
            </div>
        </div>
    );
};

export const Dashboard: Component = () => {
    const {
        data,
        view,
        setView,
        memberDetailedStats,
        overallStats
    } = useGithubData();

    const { isRateLimited, rateLimitData, checkAndUpdateRateLimit } = useRateLimit();
    const [viewMode, setViewMode] = createSignal<'card' | 'list'>('card');

    // Helper function to get filtered projects (same logic as ProjectProgress)
    const getFilteredProjects = (projects: any[], issues: any[]) => {
        // For now, we'll just filter for Open projects as default
        return projects.filter(project => {
            const projectIssues = issues.filter(issue =>
                project.issues.some((pi: any) => 
                    pi.number === issue.number && 
                    pi.repository === issue.repository.name
                )
            );
            const hasOpenIssues = projectIssues.some(issue => issue.state === 'open');
            return hasOpenIssues; // Default: show only Open projects
        });
    };

    // Debug logs
    createEffect(() => {
        (window as any).DebugLogger.log('Rate Limited Status:', isRateLimited());
        (window as any).DebugLogger.log('Rate Limit Data:', rateLimitData());
    });

    onMount(async () => {
        await checkAndUpdateRateLimit();
    });

    const getOverviewCards = () => {
        const currentData = data();
        if (!currentData) return null;

        switch (view()) {
            case 'projects':
                return (
                    <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Total Projects */}
                        <div class="bg-gradient-to-br from-blue-900/5 via-blue-900/10 to-purple-800/5 dark:from-blue-900/10 dark:via-blue-800/15 dark:to-purple-800/10 backdrop-blur-xl rounded-xl border border-blue-900/10 dark:border-blue-300/10 p-4 transition-all duration-300 hover:shadow-lg hover:shadow-blue-900/5 group">
                            <div class="flex items-center space-x-4">
                                <div class="p-3 rounded-lg bg-gradient-to-br from-blue-900 to-purple-800 dark:from-blue-700 dark:to-purple-600 shadow-lg shadow-blue-900/20 group-hover:scale-110 transition-transform duration-300">
                                    <FaSolidFolder class="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 class="text-sm font-bold text-gray-600 dark:text-gray-400" style={{'font-family': 'Figtree'}}>Total Projects</h3>
                                    <p class="text-2xl font-bold text-blue-900 dark:text-blue-300" style={{'font-family': 'Figtree'}}>{currentData.projects.length}</p>
                                </div>
                            </div>
                        </div>

                        {/* Active Projects */}
                        <div class="bg-gradient-to-br from-green-900/5 via-green-900/10 to-purple-800/5 dark:from-green-900/10 dark:via-green-800/15 dark:to-purple-800/10 backdrop-blur-xl rounded-xl border border-green-900/10 dark:border-green-300/10 p-4 transition-all duration-300 hover:shadow-lg hover:shadow-green-900/5 group">
                            <div class="flex items-center space-x-4">
                                <div class="p-3 rounded-lg bg-gradient-to-br from-green-600 to-green-800 shadow-lg shadow-green-900/20 group-hover:scale-110 transition-transform duration-300">
                                    <FaSolidCircle class="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 class="text-sm font-bold text-gray-600 dark:text-gray-400" style={{'font-family': 'Figtree'}}>Active Projects</h3>
                                    <p class="text-2xl font-bold text-green-900 dark:text-green-300" style={{'font-family': 'Figtree'}}>
                                        {currentData.projects.filter((p: { issues: string | any[]; }) => p.issues.length > 0).length}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Total Issues */}
                        <div class="bg-gradient-to-br from-purple-900/5 via-purple-900/10 to-purple-800/5 dark:from-purple-900/10 dark:via-purple-800/15 dark:to-purple-800/10 backdrop-blur-xl rounded-xl border border-purple-900/10 dark:border-purple-300/10 p-4 transition-all duration-300 hover:shadow-lg hover:shadow-purple-900/5 group">
                            <div class="flex items-center space-x-4">
                                <div class="p-3 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 shadow-lg shadow-purple-900/20 group-hover:scale-110 transition-transform duration-300">
                                    <FaSolidListCheck class="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 class="text-sm font-bold text-gray-600 dark:text-gray-400" style={{'font-family': 'Figtree'}}>Total Issues</h3>
                                    <p class="text-2xl font-bold text-purple-900 dark:text-purple-300" style={{'font-family': 'Figtree'}}>{currentData.issues.length}</p>
                                </div>
                            </div>
                        </div>

                        {/* In Progress */}
                        <div class="bg-gradient-to-br from-yellow-900/5 via-yellow-900/10 to-purple-800/5 dark:from-yellow-900/10 dark:via-yellow-800/15 dark:to-purple-800/10 backdrop-blur-xl rounded-xl border border-yellow-900/10 dark:border-yellow-300/10 p-4 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-900/5 group">
                            <div class="flex items-center space-x-4">
                                <div class="p-3 rounded-lg bg-gradient-to-br from-yellow-600 to-yellow-800 shadow-lg shadow-yellow-900/20 group-hover:scale-110 transition-transform duration-300">
                                    <FaSolidClockRotateLeft class="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 class="text-sm font-bold text-gray-600 dark:text-gray-400" style={{'font-family': 'Figtree'}}>In Progress</h3>
                                    <p class="text-2xl font-bold text-yellow-900 dark:text-yellow-300" style={{'font-family': 'Figtree'}}>
                                        {overallStats()?.statusDistribution.inProgress ?? 0}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'repositories':
                return (
                    <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Repositories */}
                        <div class="bg-gradient-to-br from-blue-900/5 via-blue-900/10 to-purple-800/5 dark:from-blue-900/10 dark:via-blue-800/15 dark:to-purple-800/10 backdrop-blur-xl rounded-xl border border-blue-900/10 dark:border-blue-300/10 p-4 transition-all duration-300 hover:shadow-lg hover:shadow-blue-900/5 group">
                            <div class="flex items-center space-x-4">
                                <div class="p-3 rounded-lg bg-gradient-to-br from-blue-900 to-purple-800 shadow-lg shadow-blue-900/20 group-hover:scale-110 transition-transform duration-300">
                                    <FaSolidCodeBranch class="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Repositories</h3>
                                    <p class="text-2xl font-bold text-blue-900 dark:text-blue-300">{currentData.repositories.length}</p>
                                </div>
                            </div>
                        </div>

                        {/* Pull Requests */}
                        <div class="bg-gradient-to-br from-green-900/5 via-green-900/10 to-purple-800/5 dark:from-green-900/10 dark:via-green-800/15 dark:to-purple-800/10 backdrop-blur-xl rounded-xl border border-green-900/10 dark:border-green-300/10 p-4 transition-all duration-300 hover:shadow-lg hover:shadow-green-900/5 group">
                            <div class="flex items-center space-x-4">
                                <div class="p-3 rounded-lg bg-gradient-to-br from-green-600 to-green-800 shadow-lg shadow-green-900/20 group-hover:scale-110 transition-transform duration-300">
                                    <FaSolidCodePullRequest class="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Pull Requests</h3>
                                    <p class="text-2xl font-bold text-green-900 dark:text-green-300">{currentData.pullRequests.length}</p>
                                </div>
                            </div>
                        </div>

                        {/* Total Commits */}
                        <div class="bg-gradient-to-br from-purple-900/5 via-purple-900/10 to-purple-800/5 dark:from-purple-900/10 dark:via-purple-800/15 dark:to-purple-800/10 backdrop-blur-xl rounded-xl border border-purple-900/10 dark:border-purple-300/10 p-4 transition-all duration-300 hover:shadow-lg hover:shadow-purple-900/5 group">
                            <div class="flex items-center space-x-4">
                                <div class="p-3 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 shadow-lg shadow-purple-900/20 group-hover:scale-110 transition-transform duration-300">
                                    <FaSolidCodeCommit class="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Commits</h3>
                                    <p class="text-2xl font-bold text-purple-900 dark:text-purple-300">{currentData.commits.length}</p>
                                </div>
                            </div>
                        </div>

                        {/* Total Issues */}
                        <div class="bg-gradient-to-br from-yellow-900/5 via-yellow-900/10 to-purple-800/5 dark:from-yellow-900/10 dark:via-yellow-800/15 dark:to-purple-800/10 backdrop-blur-xl rounded-xl border border-yellow-900/10 dark:border-yellow-300/10 p-4 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-900/5 group">
                            <div class="flex items-center space-x-4">
                                <div class="p-3 rounded-lg bg-gradient-to-br from-yellow-600 to-yellow-800 shadow-lg shadow-yellow-900/20 group-hover:scale-110 transition-transform duration-300">
                                    <FaSolidListCheck class="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Issues</h3>
                                    <p class="text-2xl font-bold text-yellow-900 dark:text-yellow-300">{currentData.issues.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'members':
            default:
                return (
                    <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Team Members */}
                        <div class="bg-gradient-to-br from-blue-900/5 via-blue-900/10 to-purple-800/5 dark:from-blue-900/10 dark:via-blue-800/15 dark:to-purple-800/10 backdrop-blur-xl rounded-xl border border-blue-900/10 dark:border-blue-300/10 p-4 transition-all duration-300 hover:shadow-lg hover:shadow-blue-900/5 group">
                            <div class="flex items-center space-x-4">
                                <div class="p-3 rounded-lg bg-gradient-to-br from-blue-900 to-purple-800 shadow-lg shadow-blue-900/20 group-hover:scale-110 transition-transform duration-300">
                                    <FaSolidUsers class="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Team Members</h3>
                                    <p class="text-2xl font-bold text-blue-900 dark:text-blue-300">{currentData.members.length}</p>
                                </div>
                            </div>
                        </div>

                        {/* Completed */}
                        <div class="bg-gradient-to-br from-green-900/5 via-green-900/10 to-purple-800/5 dark:from-green-900/10 dark:via-green-800/15 dark:to-purple-800/10 backdrop-blur-xl rounded-xl border border-green-900/10 dark:border-green-300/10 p-4 transition-all duration-300 hover:shadow-lg hover:shadow-green-900/5 group">
                            <div class="flex items-center space-x-4">
                                <div class="p-3 rounded-lg bg-gradient-to-br from-green-600 to-green-800 shadow-lg shadow-green-900/20 group-hover:scale-110 transition-transform duration-300">
                                    <FaSolidCircle class="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</h3>
                                    <p class="text-2xl font-bold text-green-900 dark:text-green-300">
                                        {overallStats()?.statusDistribution.closed ?? 0}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* In Progress */}
                        <div class="bg-gradient-to-br from-yellow-900/5 via-yellow-900/10 to-purple-800/5 dark:from-yellow-900/10 dark:via-yellow-800/15 dark:to-purple-800/10 backdrop-blur-xl rounded-xl border border-yellow-900/10 dark:border-yellow-300/10 p-4 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-900/5 group">
                            <div class="flex items-center space-x-4">
                                <div class="p-3 rounded-lg bg-gradient-to-br from-yellow-600 to-yellow-800 shadow-lg shadow-yellow-900/20 group-hover:scale-110 transition-transform duration-300">
                                    <FaSolidClockRotateLeft class="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</h3>
                                    <p class="text-2xl font-bold text-yellow-900 dark:text-yellow-300">
                                        {overallStats()?.statusDistribution.inProgress ?? 0}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Total Issues */}
                        <div class="bg-gradient-to-br from-purple-900/5 via-purple-900/10 to-purple-800/5 dark:from-purple-900/10 dark:via-purple-800/15 dark:to-purple-800/10 backdrop-blur-xl rounded-xl border border-purple-900/10 dark:border-purple-300/10 p-4 transition-all duration-300 hover:shadow-lg hover:shadow-purple-900/5 group">
                            <div class="flex items-center space-x-4">
                                <div class="p-3 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 shadow-lg shadow-purple-900/20 group-hover:scale-110 transition-transform duration-300">
                                    <FaSolidListCheck class="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Issues</h3>
                                    <p class="text-2xl font-bold text-purple-900 dark:text-purple-300">
                                        {overallStats()?.issues.total ?? 0}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    const renderTabMenu = () => {
        return (
            <div class="
                bg-white/80 dark:bg-gray-800/80
                backdrop-blur-xl
                rounded-xl
                border border-blue-900/10 dark:border-blue-300/10
                overflow-x-auto
                mb-6
                scrollbar-none
            " style={{'font-family': 'Figtree'}}>
                <div class="
                    flex
                    w-full
                    min-w-max
                    lg:w-auto
                ">
                    {menuTabs.map(tab => (
                        <button
                            onClick={() => setView(tab.id as ViewType)}
                            class={`
                                px-4 py-3 lg:px-6
                                text-sm font-bold
                                transition-all duration-200
                                flex-1 lg:flex-none
                                min-w-[120px] lg:min-w-[160px]
                                whitespace-nowrap
                                ${view() === tab.id ? 
                                    'text-blue-900 dark:text-blue-300 border-b-2 border-blue-900 dark:border-blue-300 bg-blue-50/50 dark:bg-blue-900/20' : 
                                    'text-gray-600 dark:text-gray-400 hover:text-blue-900 dark:hover:text-blue-300 hover:bg-blue-50/30 dark:hover:bg-blue-900/10'}
                            `}
                        >
                            <span class="lg:hidden">
                                {tab.label.replace('Progress', '').trim()}
                            </span>
                            <span class="hidden lg:inline">
                                {tab.label}
                            </span>
                        </button>
                    ))}
                </div>
                
                {/* View Mode Toggle */}
                <div class="flex border-l border-gray-200 dark:border-gray-700 pl-4 ml-4">
                    <button
                        onClick={() => setViewMode('card')}
                        class={`
                            px-3 py-2 rounded-l-lg text-sm font-medium transition-all duration-200
                            ${viewMode() === 'card' ? 
                                'bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-300' : 
                                'text-gray-600 dark:text-gray-400 hover:text-blue-900 dark:hover:text-blue-300 hover:bg-blue-50/30 dark:hover:bg-blue-900/10'}
                        `}
                        title="Card View"
                    >
                        <FaSolidTableCells class="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        class={`
                            px-3 py-2 rounded-r-lg text-sm font-medium transition-all duration-200
                            ${viewMode() === 'list' ? 
                                'bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-300' : 
                                'text-gray-600 dark:text-gray-400 hover:text-blue-900 dark:hover:text-blue-300 hover:bg-blue-50/30 dark:hover:bg-blue-900/10'}
                        `}
                        title="List View"
                    >
                        <FaSolidBars class="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    };

    const renderMainContent = () => {
        const currentData = data();
        if (!currentData) return null;

        const renderMainSection = () => {
            switch (view()) {
                case 'repositories':
                    return (
                        <div class="
                            bg-white/80 dark:bg-gray-800/80
                            backdrop-blur-xl
                            rounded-xl
                            border border-blue-900/10 dark:border-blue-300/10
                            p-4 lg:p-6
                            h-full
                        " style={{'font-family': 'Figtree'}}>
                            <h2 class="text-xl font-bold text-blue-900 dark:text-blue-300 mb-4" style={{'font-family': 'Figtree'}}>
                                Repositories Progress
                            </h2>
                            {viewMode() === 'card' ? (
                                <RepositoryProgress
                                    repositories={currentData.repositories}
                                    issues={currentData.issues}
                                    pullRequests={currentData.pullRequests}
                                    commits={currentData.commits}
                                    projects={currentData.projects}
                                />
                            ) : (
                                <ProgressListView
                                    viewType="repositories"
                                    repositories={currentData.repositories}
                                    issues={currentData.issues}
                                    pullRequests={currentData.pullRequests}
                                    commits={currentData.commits}
                                />
                            )}
                        </div>
                    );

                case 'members':
                    return (
                        <div class="
                            bg-white/80 dark:bg-gray-800/80
                            backdrop-blur-xl
                            rounded-xl
                            border border-blue-900/10 dark:border-blue-300/10
                            p-4 lg:p-6
                            h-full
                        " style={{'font-family': 'Figtree'}}>
                            <h2 class="text-xl font-bold text-blue-900 dark:text-blue-300 mb-4" style={{'font-family': 'Figtree'}}>
                                Members Progress
                            </h2>
                            {viewMode() === 'card' ? (
                                <MemberProgress
                                    members={memberDetailedStats()}
                                    projects={currentData.projects}
                                />
                            ) : (
                                <ProgressListView
                                    viewType="members"
                                    memberDetailedStats={memberDetailedStats()}
                                    projects={currentData.projects}
                                />
                            )}
                        </div>
                    );

                case 'projects':
                default:
                    return (
                        <div class="
                            bg-white/80 dark:bg-gray-800/80
                            backdrop-blur-xl
                            rounded-xl
                            border border-blue-900/10 dark:border-blue-300/10
                            p-4 lg:p-6
                            h-full
                        " >
                            <h2 class="text-xl font-bold text-blue-900 dark:text-blue-300 mb-4" style={{'font-family': 'Figtree'}}>
                                Projects Progress Overview
                            </h2>
                            {viewMode() === 'card' ? (
                                <ProjectProgress
                                    projects={currentData.projects}
                                    issues={currentData.issues}
                                    pullRequests={currentData.pullRequests}
                                    members={currentData.members}
                                    repositories={currentData.repositories}
                                />
                            ) : (
                                <ProgressListView
                                    viewType="projects"
                                    projects={currentData.projects}
                                    issues={currentData.issues}
                                    pullRequests={currentData.pullRequests}
                                    commits={currentData.commits}
                                    filteredProjects={getFilteredProjects(currentData.projects, currentData.issues)}
                                />
                            )}
                        </div>
                    );
            }
        };

        return (
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content - 2 kolom */}
                <div class="lg:col-span-2">
                    {renderMainSection()}
                </div>

                {/* Recent Activity - 1 kolom, selalu muncul */}
                <div class="lg:col-span-1
                    bg-white/80 dark:bg-gray-800/80
                    backdrop-blur-xl
                    rounded-xl
                    border border-blue-900/10 dark:border-blue-300/10
                    p-4 lg:p-6
                    h-full
                ">
                    <h2 class="text-xl font-bold mb-4 text-purple-800 dark:text-purple-300" style={{'font-family': 'Figtree'}}>
                        Recent Activity
                    </h2>
                    <div class="
                        overflow-y-auto
                        h-[calc(100%-3rem)] 
                        -mx-2
                        px-2
                    ">
                        <div class="space-y-3">
                            {currentData.timelineEvents?.slice(0, 5).map((event) => (
                                <div class="
                                    bg-white/40 dark:bg-gray-900/40
                                    rounded-lg
                                    px-3 py-2.5
                                    border border-blue-900/5 dark:border-blue-300/5
                                    transition-all duration-200
                                    hover:bg-white/60 dark:hover:bg-gray-900/60
                                    hover:border-blue-900/10 dark:hover:border-blue-300/10
                                    hover:shadow-sm
                                ">
                                    <ActivityTimeline
                                        events={[event]}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div class="space-y-6">
            {getOverviewCards()}
            {renderTabMenu()}
            {data.loading ? (
                <DashboardSkeleton />
            ) : data.error ? (
                <div class="
                    bg-red-50 dark:bg-red-900/20
                    backdrop-blur-sm
                    rounded-lg
                    p-4
                    text-red-700 dark:text-red-400
                    border border-red-100 dark:border-red-800
                    shadow-lg shadow-red-500/5 dark:shadow-red-900/20
                ">
                    Error loading data. Please try again.
                </div>
            ) : (
                data() && renderMainContent()
            )}
        </div>
    );
};

export default Dashboard;