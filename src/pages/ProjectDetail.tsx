import { Component, Show, createMemo, createSignal } from 'solid-js';
import { useParams } from '@solidjs/router'; 
import { useGithubData } from '../hooks/useGithubData';
import { CompletionChart } from '../components/Charts/CompletionChart'; 
import { calculateTaskProgress } from '../utils/progressUtils';
import { FilterSort } from '../components/Common/FilterSort'; 
import { StatusDistributionAnalysis } from '../components/Analysis/StatusDistributionAnalysis'; 

interface ProjectStats {
    issues: any[];
    completedIssues: any[];
    taskProgress: {
        total: number;
        completed: number;
    };
    members: string[];
    issueProgress: number;
    taskProgressPercentage: number;
}

// Tambahkan base style untuk font Figtree
const baseStyle = { 'font-family': 'Figtree' };

// Tambahkan komponen Skeleton
const ProjectDetailSkeleton = () => {
  return (
    <div class="p-6 min-h-screen bg-gray-50" style={baseStyle}>
      <div class="grid grid-cols-2 gap-6">
        {/* Left Column Skeleton */}
        <div class="space-y-6">
          {/* Project Header Skeleton */}
          <div class="bg-white rounded-xl shadow-md p-6">
            <div class="h-8 w-3/4 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div class="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
          </div>

          {/* Stats Cards Skeleton */}
          <div class="grid grid-cols-3 gap-4">
            {[...Array(3)].map(() => (
              <div class="bg-white rounded-xl p-6 h-[14.5vh] animate-pulse">
                <div class="h-8 w-16 bg-gray-200 rounded mb-2"></div>
                <div class="h-4 w-24 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>

          {/* Status Distribution Skeleton */}
          <div class="bg-white rounded-xl shadow-md p-6">
            <div class="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div class="h-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Right Column Skeleton */}
        <div class="space-y-6">
          {/* Due Date Overview Skeleton */}
          <div class="bg-white rounded-xl shadow-md p-6">
            <div class="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div class="grid grid-cols-2 gap-4">
              {[...Array(4)].map(() => (
                <div class="p-4 rounded-lg bg-gray-200 animate-pulse">
                  <div class="h-8 w-16 bg-gray-300 rounded mb-2"></div>
                  <div class="h-4 w-24 bg-gray-300 rounded"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Issues Progress Skeleton */}
          <div class="bg-white rounded-xl shadow-md p-6">
            <div class="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div class="h-64 bg-gray-200 rounded animate-pulse"></div>
          </div>

          {/* Task Progress Skeleton */}
          <div class="bg-white rounded-xl shadow-md p-6">
            <div class="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div class="h-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Filter and Issues List Skeleton */}
      <div class="bg-white rounded-xl shadow-md p-6 mt-6">
        {/* Filter Section Skeleton */}
        <div class="w-full mb-6">
          <div class="flex gap-4 mb-4">
            <div class="h-10 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div class="h-10 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div class="h-10 w-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Issues Grid Skeleton */}
        <div class="mt-6">
          <div class="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4"></div>
          <div class="grid grid-cols-2 gap-4">
            {[...Array(6)].map(() => (
              <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div class="flex justify-between items-start mb-3">
                  <div class="h-5 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                  <div class="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div class="space-y-2">
                  <div class="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div class="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div class="mt-3 space-y-2">
                  {[...Array(3)].map(() => (
                    <div class="flex items-start gap-2">
                      <div class="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                      <div class="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ProjectDetail: Component = () => {
    const params = useParams();
    const { data } = useGithubData();

    const projectData = createMemo(() => {
        if (!data()) return null;
        return data()?.projects.find((p: { number: { toString: () => string; }; }) => p.number.toString() === params.number);
    });

    const projectStats = createMemo<ProjectStats | null>(() => {
        const currentData = data();
        const project = projectData();
        if (!currentData || !project) return null;

        const projectIssues = currentData.issues.filter(issue =>
            project.issues.some((pi: { number: any; repository: any; }) => pi.number === issue.number && pi.repository === issue.repository.name)
        );

        const completedIssues = projectIssues.filter(i => i.state === 'closed');

        // Calculate task progress
        const taskProgress = projectIssues.reduce((acc, issue) => {
            const progress = calculateTaskProgress(issue.body);
            return {
                total: acc.total + progress.total,
                completed: acc.completed + progress.completed,
            };
        }, { total: 0, completed: 0 });

        // Get involved members
        const memberSet = new Set<string>();
        projectIssues.forEach(issue => {
            if (issue.assignee) {
                memberSet.add(issue.assignee.login);
            }
        });

        const issueProgress = projectIssues.length > 0
            ? (completedIssues.length / projectIssues.length) * 100
            : 0;

        const taskProgressPercentage = taskProgress.total > 0
            ? (taskProgress.completed / taskProgress.total) * 100
            : 0;

        return {
            issues: projectIssues,
            completedIssues,
            taskProgress,
            members: Array.from(memberSet),
            issueProgress,
            taskProgressPercentage
        };
    });

    // Add filter states
    const [statusFilter, setStatusFilter] = createSignal<string[]>(['open']);
    const [sortBy, setSortBy] = createSignal('newest');
    const [searchQuery, setSearchQuery] = createSignal('');

    // Add filtered issues memo
    const filteredIssues = createMemo(() => {
        let filtered = projectStats()?.issues || [];

        // Apply search
        if (searchQuery()) {
            const query = searchQuery().toLowerCase();
            filtered = filtered.filter(issue =>
                issue.title.toLowerCase().includes(query) ||
                issue.body?.toLowerCase().includes(query)
            );
        }

        // Apply status filter
        if (statusFilter().length > 0) {
            filtered = filtered.filter(issue => {
                const hasOpenTasks = issue.body?.match(/- \[ \] .+/g)?.length > 0;
                const hasCompletedTasks = issue.body?.match(/- \[x\] .+/g)?.length > 0;

                return statusFilter().some(status => {
                    switch (status) {
                        case 'open':
                            return hasOpenTasks;
                        case 'completed':
                            return hasCompletedTasks;
                        case 'no-tasks':
                            return !hasOpenTasks && !hasCompletedTasks;
                        default:
                            return issue.state === status;
                    }
                });
            });
        }

        // Apply sorting
        switch (sortBy()) {
            case 'newest':
                filtered = [...filtered].sort((a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
                break;
            case 'oldest':
                filtered = [...filtered].sort((a, b) =>
                    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );
                break;
            case 'most-tasks':
                filtered = [...filtered].sort((a, b) => {
                    const aTasks = (a.body?.match(/- \[.\] .+/g) || []).length;
                    const bTasks = (b.body?.match(/- \[.\] .+/g) || []).length;
                    return bTasks - aTasks;
                });
                break;
            case 'most-completed':
                filtered = [...filtered].sort((a, b) => {
                    const aCompleted = (a.body?.match(/- \[x\] .+/g) || []).length;
                    const bCompleted = (b.body?.match(/- \[x\] .+/g) || []).length;
                    return bCompleted - aCompleted;
                });
                break;
        }

        return filtered;
    });

   

    const getDueDateStatus = (issue: any) => {
        if (issue.state === 'closed') return { status: 'safe', label: 'Completed', color: 'success' };
        
        if (!issue.due_date) return { status: 'none', label: 'No Date', color: 'neutral' };
        
        const now = new Date();
        const due = new Date(issue.due_date);
        const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24));
        
        if (diffDays < 0) return { status: 'overdue', label: 'Overdue', color: 'danger' };
        if (diffDays <= 7) return { status: 'soon', label: 'Due Soon', color: 'warning' };
        return { status: 'safe', label: 'On Track', color: 'success' };
    };

    const getDueStats = (issues: any[]) => {
        return issues.reduce((acc, issue) => {
            const { status } = getDueDateStatus(issue);
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, { safe: 0, soon: 0, overdue: 0, none: 0 });
    };
    

    return (
        <Show when={!data.loading && projectData() && projectStats()} fallback={<ProjectDetailSkeleton />}>
            <div class="min-h-screen bg-gray-50" style={baseStyle}>
                {/* Layout Grid Container - Update untuk responsivitas */}
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                    {/* Left Column - Tidak perlu perubahan pada konten */}
                    <div class="space-y-4 lg:space-y-6">
                        {/* Project Header - Update padding untuk mobile */}
                        <div class="bg-white rounded-xl shadow-md p-4 lg:p-6">
                            <h1 class="text-2xl lg:text-3xl font-bold text-gray-800 mb-4" style={baseStyle}>
                                {projectData()!.name}
                            </h1>
                            <p class="text-gray-600 font-bold text-sm lg:text-base" style={baseStyle}>{projectData()!.body}</p>
                        </div>

                        {/* Project Stats Cards - Update grid untuk mobile */}
                        <div class="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                            <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 lg:p-6 text-white transform hover:scale-105 transition-transform h-[12vh] lg:h-[14.5vh]">
                                <div class="text-2xl lg:text-3xl font-bold mb-2" style={baseStyle}>{projectStats()!.issues.length}</div>
                                <div class="text-blue-100 text-sm lg:text-base" style={baseStyle}>Total Issues</div>
                            </div>
                            <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 lg:p-6 text-white transform hover:scale-105 transition-transform h-[12vh] lg:h-[14.5vh]">
                                <div class="text-2xl lg:text-3xl font-bold mb-2" style={baseStyle}>{projectStats()!.completedIssues.length}</div>
                                <div class="text-green-100 text-sm lg:text-base" style={baseStyle}>Completed</div>
                            </div>
                            <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 lg:p-6 text-white transform hover:scale-105 transition-transform h-[12vh] lg:h-[14.5vh]">
                                <div class="text-2xl lg:text-3xl font-bold mb-2" style={baseStyle}>{projectStats()!.members.length}</div>
                                <div class="text-purple-100 text-sm lg:text-base" style={baseStyle}>Members</div>
                            </div>
                        </div>

                        {/* Status Distribution - Update padding untuk mobile */}
                        <div class="bg-white rounded-xl shadow-md p-4 lg:p-6">
                            <h2 class="text-lg lg:text-xl font-semibold" style={baseStyle}>Status Distribution</h2>
                            <StatusDistributionAnalysis
                                title=""
                                entityName={projectData()!.name}
                                entityType="Project"
                                issues={projectStats()!.issues}
                            />
                        </div>
                    </div>

                    {/* Right Column */}
                    <div class="space-y-4 lg:space-y-6">
                        {/* Due Date Overview - Update grid untuk mobile */}
                        <div class="bg-white rounded-xl shadow-md p-4 lg:p-6">
                            <h2 class="text-lg lg:text-xl font-semibold mb-4" style={baseStyle}>Due Date Overview</h2>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                                {Object.entries(getDueStats(filteredIssues())).map(([status, count]) => (
                                    <div class={`p-4 rounded-lg ${getDueStatusBg(status)} bg-opacity-20 transform hover:scale-105 transition-transform`}>
                                        <div class={`text-2xl font-bold ${getDueStatusText(status)}`} style={baseStyle}>{count as any}</div>
                                        <div class={`text-sm ${getDueStatusText(status)}`} style={baseStyle}>{getStatusText(status)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Charts - Update height untuk mobile */}
                        <div class="bg-white rounded-xl shadow-md p-4 lg:p-6">
                            <h2 class="text-lg lg:text-xl font-semibold mb-4">Issue Progress</h2>
                            <div class="h-48 lg:h-64">
                                <CompletionChart
                                    percentage={projectStats()!.issueProgress}
                                    title="Issues Completed"
                                />
                            </div>
                        </div>

                        <div class="bg-white rounded-xl shadow-md p-4 lg:p-6">
                            <h2 class="text-lg lg:text-xl font-semibold mb-4">Task Progress</h2>
                            <div class="h-48 lg:h-64">
                                <CompletionChart
                                    percentage={projectStats()!.taskProgressPercentage}
                                    title="Tasks Completed"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter and Issues List - Update untuk mobile */}
                <div class="bg-white rounded-xl shadow-md p-4 lg:p-6 mt-4 lg:mt-6">
                    <div class="w-full mb-4 lg:mb-6">
                        <FilterSort
                            filters={[
                                {
                                    name: 'Status',
                                    options: [
                                        { label: 'Has Open Tasks', value: 'open' },
                                        { label: 'Has Completed Tasks', value: 'completed' },
                                        { label: 'No Tasks', value: 'no-tasks' },
                                        { label: 'Issue Open', value: 'open' },
                                        { label: 'Issue Closed', value: 'closed' }
                                    ],
                                    selectedValues: statusFilter(),
                                    onFilterChange: setStatusFilter
                                }
                            ]}
                            sorts={[
                                { label: 'Newest First', value: 'newest' },
                                { label: 'Oldest First', value: 'oldest' },
                                { label: 'Most Tasks', value: 'most-tasks' },
                                { label: 'Most Completed', value: 'most-completed' }
                            ]}
                            currentSort={sortBy()}
                            onSortChange={setSortBy}
                            searchValue={searchQuery()}
                            onSearchChange={setSearchQuery}
                        />
                    </div>

                    {/* Project Issues Grid - Update untuk mobile */}
                    <div class="mt-4 lg:mt-6">
                        <h2 class="text-lg lg:text-xl font-semibold mb-4">Project Issues</h2>
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
                            {filteredIssues().map(issue => (
                                <IssueCard issue={issue} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </Show>
    );
};

// Component untuk Issue Card
const IssueCard = (props: { issue: any }) => {
    return (
        <div class="bg-gray-50 rounded-lg p-3 lg:p-4 border border-gray-200 hover:shadow-md transition-shadow" style={baseStyle}>
            <div class="flex justify-between items-start mb-2 lg:mb-3">
                <h3 class="font-medium text-gray-800 text-sm lg:text-base" style={baseStyle}>{props.issue.title}</h3>
                <span class={`px-2 py-1 rounded text-xs lg:text-sm ${
                    props.issue.state === 'closed' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`} style={baseStyle}>
                    {props.issue.state}
                </span>
            </div>
            
            <div class="text-xs lg:text-sm text-gray-600" style={baseStyle}>
                <div>#{props.issue.number}</div>
                {props.issue.assignee && (
                    <div>Assignee: {props.issue.assignee.login}</div>
                )}
            </div>

            {props.issue.body && (
                <div class="mt-2 lg:mt-3 space-y-1 lg:space-y-2">
                    {props.issue.body.match(/- \[.\] .+/g)?.map((task: string) => (
                        <div class="flex items-start gap-2">
                            <input
                                type="checkbox"
                                checked={task.includes('- [x]')}
                                disabled
                                class="mt-1"
                            />
                            <span class="text-xs lg:text-sm text-gray-700" style={baseStyle}>
                                {task.replace(/- \[.\] /, '')}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const getStatusText = (status: string) => {
    switch (status) {
        case 'safe':
            return 'On Track';
        case 'soon':
            return 'Due Soon';
        default:
            return 'Overdue';
    }
};

// Helper functions for styling
const getDueStatusBg = (status: string) => {
    switch (status) {
        case 'safe': return 'bg-green-500';
        case 'soon': return 'bg-yellow-500';
        case 'overdue': return 'bg-red-500';
        default: return 'bg-gray-500';
    }
};

const getDueStatusText = (status: string) => {
    switch (status) {
        case 'safe': return 'text-green-700';
        case 'soon': return 'text-yellow-700';
        case 'overdue': return 'text-red-700';
        default: return 'text-gray-700';
    }
};

export default ProjectDetail;