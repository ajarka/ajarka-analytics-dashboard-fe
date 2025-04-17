import { Component, createEffect, onMount } from 'solid-js';
import { useGithubData } from '../hooks/useGithubData';
import { useRateLimit } from '../context/RateLimitContext';
import { ProjectTimelineTable } from '../components/ProjectTime/ProjectTimelineTable';

export const ProjectTime: Component = () => {
    const {
        data, 
    } = useGithubData();

    const { isRateLimited, rateLimitData, checkAndUpdateRateLimit } = useRateLimit();

    // Debug logs
    createEffect(() => {
        (window as any).DebugLogger.log('Rate Limited Status:', isRateLimited());
        (window as any).DebugLogger.log('Rate Limit Data:', rateLimitData());
    });

    onMount(async () => {
        await checkAndUpdateRateLimit();
    });

    return (
        <div class="space-y-6">
            {data.loading ? (
                <div class="animate-pulse space-y-4">
                    <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                    <div class="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            ) : data.error ? (
                <div class="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-red-700 dark:text-red-400">
                    Error loading data. Please try again.
                </div>
            ) : data() ? (
                <div class="space-y-6">
                    <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl border border-blue-900/10 dark:border-blue-300/10 p-6">
                        <h2 class="text-2xl font-bold text-blue-900 dark:text-blue-300 mb-4">Project Timelines</h2>
                        <ProjectTimelineTable 
                            projects={data()?.projects || []}
                            issues={data()?.issues || []}
                        />
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default ProjectTime;