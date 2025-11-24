import { Component, For, Show, createMemo, createSignal } from 'solid-js';
import { useParams, A } from '@solidjs/router';
import { Card } from '../components/UI/Card';
import { useGithubData } from '../hooks/useGithubData';
import { CompletionChart } from '../components/Charts/CompletionChart';
import { ActivityChart } from '../components/Charts/ActivityChart';
import { HStack, Text, VStack, Box, Badge } from "@hope-ui/solid";
import { FilterSort, type FilterOption } from '../components/Common/FilterSort';
// import { StatusDistributionAnalysis } from '../components/Analysis/StatusDistributionAnalysis';

export const MemberDetail: Component = () => {
    const params = useParams();
    const { data, memberDetailedStats } = useGithubData();

    // const projectIssues = createMemo(() => {
    //     if (!data()) return null;
    //     const project = data()?.projects.find((p: any) => p.assignee === params.login);
    //     if (!project) return null;
    
    //     const filteredIssues = project.issues.filter((issue: any) => issue.assignee && issue.assignee.login === params.login);
    //     console.log("Filtered Issues: ", filteredIssues);
    //     return filteredIssues;
    // });

    const memberData = createMemo(() => {
        const stats = memberDetailedStats();
        return stats.find((m: { member: { login: string; }; }) => m.member.login === params.login);
    });

    const involvedProjects = createMemo(() => {
        const currentData = data();
        const member = memberData();
        if (!currentData || !member) return [];

        return currentData.projects.filter((project: { name: any; }) => {
            const memberIssues = member.issues || [];
            return memberIssues.some((issue: { project: { name: any; }; }) => issue.project?.name === project.name);
        });
    });

    const activityStats = createMemo(() => {
        const member = memberData();
        if (!member) return [];
    
        // Get last 7 days
        const days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return date.toISOString().split('T')[0];
        }).reverse();
    
        // Debug to check data
        (window as any).DebugLogger.log('Member commits:', member.codeStats.commits);
        (window as any).DebugLogger.log('Member PRs:', member.codeStats.pullRequests);
    
        return days.map(day => {
            // More robust date comparison
            const dayStart = new Date(`${day}T00:00:00Z`);
            const dayEnd = new Date(`${day}T23:59:59Z`);
            
            const dayCommits = member.codeStats.commits.filter((commit: { commit: { author: { date: string | number | Date; }; }; }) => {
                if (!commit.commit?.author?.date) return false;
                const commitDate = new Date(commit.commit.author.date);
                return commitDate >= dayStart && commitDate <= dayEnd;
            }).length;
    
            const dayPRs = member.codeStats.pullRequests.filter((pr: { created_at: string | number | Date; }) => {
                if (!pr.created_at) return false;
                const prDate = new Date(pr.created_at);
                return prDate >= dayStart && prDate <= dayEnd;
            }).length;
    
            const dayIssues = member.issues.filter((issue: { created_at: string | number | Date; }) => {
                if (!issue.created_at) return false;
                const issueDate = new Date(issue.created_at);
                return issueDate >= dayStart && issueDate <= dayEnd;
            }).length;
    
            return {
                date: day,
                commits: dayCommits,
                pullRequests: dayPRs,
                issues: dayIssues
            };
        });
    });

    const taskCompletionData = createMemo(() => {
        const member = memberData();
        if (!member) return { percentage: 0, total: 0, completed: 0 };

        const issues = member.issues;
        const completedTasks = issues.reduce((acc: any, issue: { body: { match: (arg0: RegExp) => never[]; }; }) => {
            const tasks = issue.body?.match(/- \[x\] .+/g) || [];
            return acc + tasks.length;
        }, 0);

        const totalTasks = issues.reduce((acc: any, issue: { body: { match: (arg0: RegExp) => never[]; }; }) => {
            const tasks = issue.body?.match(/- \[.\] .+/g) || [];
            return acc + tasks.length;
        }, 0);

        return {
            percentage: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
            total: totalTasks,
            completed: completedTasks
        };
    });

    // Add filter states
    const [statusFilter, setStatusFilter] = createSignal<string[]>(['open']);
    const [repoFilter, setRepoFilter] = createSignal<string[]>([]);
    const [sortBy, setSortBy] = createSignal('newest');
    const [searchQuery, setSearchQuery] = createSignal('');

    // Get unique repositories memo
    const repositories = createMemo(() => {
        if (!memberData()?.issues) return [];

        const repoSet = new Set<string>();
        memberData()!.issues.forEach((issue: { repository: { name: string; }; }) => {
            repoSet.add(issue.repository.name);
        });

        return Array.from(repoSet).map((repoName): FilterOption => ({
            label: repoName,
            value: repoName
        }));
    });

    const getRepositories = createMemo(() => {
        if (!memberData()?.issues) return [] as FilterOption[];

        const repoNames = new Set<string>();
        memberData()!.issues.forEach((issue: { repository: { name: string; }; }) => {
            if (typeof issue.repository.name === 'string') {
                repoNames.add(issue.repository.name);
            }
        });

        const options: FilterOption[] = Array.from(repoNames).map(repo => ({
            label: repo,
            value: repo
        }));

        return options;
    });

    // Add filtered issues memo
    const filteredIssues = createMemo(() => {
        if (!memberData()) return [];
        let filtered = [...memberData()!.issues];

        // Apply search
        if (searchQuery()) {
            const query = searchQuery().toLowerCase();
            filtered = filtered.filter(issue =>
                issue.title.toLowerCase().includes(query) ||
                issue.body?.toLowerCase().includes(query)
            );
        }

        // Apply repository filter
        if (repoFilter().length > 0) {
            filtered = filtered.filter(issue =>
                repoFilter().includes(issue.repository.name)
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

    const formatDate = (date: string | undefined) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Render function now checks for data and memberData existence
    return (
        <Show when={!data.loading} fallback={
            <div class="text-center py-8">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
            </div>
        }>
            <div class="mb-6">
                <A href="/" class="text-blue-600 hover:text-blue-800">
                    ← Back to Dashboard
                </A>
            </div>

            {/* <Show when={memberData() && memberData()!.issues.length > 0}>
                <div class="mb-6">
                    <StatusDistributionAnalysis
                        title={`Status Distribution for Member ${params.login}`}
                        entityName={"Member"}
                        entityType="Member"
                        issues={projectIssues()}
                    />
                </div>
            </Show> */}

            {/* Filter Section */}
            <FilterSort
                filters={[
                    {
                        name: 'Repository',
                        options: getRepositories(),
                        selectedValues: repoFilter(),
                        onFilterChange: setRepoFilter
                    },
                    {
                        name: 'Status',
                        options: [
                            { label: 'Has Open Tasks', value: 'open' },
                            { label: 'Has Completed Tasks', value: 'completed' },
                            { label: 'No Tasks', value: 'no-tasks' },
                            { label: 'Issue Open', value: 'issue-open' },
                            { label: 'Issue Closed', value: 'issue-closed' }
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

            <Show
                when={data() && memberData()}
                fallback={
                    <Card>
                        <p class="text-gray-500 text-center py-4">Member not found</p>
                    </Card>
                }
            >
                {(member) => (
                    <Card class="mb-8">
                        <div class="flex items-center mb-6">
                            <img
                                src={member().member.avatar_url}
                                alt={member().member.login}
                                class="w-16 h-16 rounded-full mr-6"
                            />
                            <div>
                                <h1 class="text-2xl font-bold text-gray-800">
                                    {member().member.login}
                                </h1>
                                <p class="text-gray-600">
                                    {member().codeStats.totalCommits} commits ·
                                    {member().codeStats.totalPRs} pull requests ·
                                    {member().issues.length} issues
                                </p>
                            </div>
                        </div>

                        {/* Charts section */}
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <h3 class="text-lg font-semibold text-gray-700 mb-2">
                                    Task Completion
                                </h3>
                                <div class="h-64">
                                    <CompletionChart
                                        percentage={taskCompletionData().percentage}
                                        title="Tasks Completed"
                                    />
                                </div>
                                <div class="mt-4 text-center">
                                    <p class="text-sm text-gray-600">
                                        {taskCompletionData().completed} of {taskCompletionData().total} tasks completed
                                    </p>
                                </div>
                            </div>
                            <div>
                                <h3 class="text-lg font-semibold text-gray-700 mb-2">
                                    Activity Overview (Last 7 Days)
                                </h3>
                                <div class="h-64">
                                    <ActivityChart data={activityStats()} />
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div>
                                <h4 class="text-sm font-medium text-gray-600">Lines Added</h4>
                                <p class="text-xl font-semibold text-green-600">
                                    +{member().codeStats.linesAdded}
                                </p>
                            </div>
                            <div>
                                <h4 class="text-sm font-medium text-gray-600">Lines Deleted</h4>
                                <p class="text-xl font-semibold text-red-600">
                                    -{member().codeStats.linesDeleted}
                                </p>
                            </div>
                            <div>
                                <h4 class="text-sm font-medium text-gray-600">Files Changed</h4>
                                <p class="text-xl font-semibold text-blue-600">
                                    {member().codeStats.filesChanged}
                                </p>
                            </div>
                            <div>
                                <h4 class="text-sm font-medium text-gray-600">Avg. Commits/Day</h4>
                                <p class="text-xl font-semibold text-purple-600">
                                    {member().codeStats.averageCommitsPerDay.toFixed(1)}
                                </p>
                            </div>
                        </div>

                        {/* Projects */}
                        <div class="mb-6">
                            <h3 class="text-lg font-semibold text-gray-700 mb-4">
                                Project Involvement ({involvedProjects().length})
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <For each={involvedProjects()}>
                                    {(project) => (
                                        <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            <h4 class="font-medium text-gray-800 mb-2">{project.name}</h4>
                                            <p class="text-sm text-gray-600 mb-2">{project.body}</p>
                                            <a
                                                href={project.html_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                class="text-sm text-blue-600 hover:underline"
                                            >
                                                View Project →
                                            </a>
                                        </div>
                                    )}
                                </For>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div>
                            {/* Filter Section */}
                            <FilterSort
                                filters={[
                                    {
                                        name: 'Repository',
                                        options: repositories(),
                                        selectedValues: repoFilter(),
                                        onFilterChange: setRepoFilter
                                    },
                                    {
                                        name: 'Status',
                                        options: [
                                            { label: 'Has Open Tasks', value: 'open' },
                                            { label: 'Has Completed Tasks', value: 'completed' },
                                            { label: 'No Tasks', value: 'no-tasks' },
                                            { label: 'Issue Open', value: 'issue-open' },
                                            { label: 'Issue Closed', value: 'issue-closed' }
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

                            {/* Filtered Issues List */}
                            <Card>
                                <Text size="lg" fontWeight="$semibold" mb="$4">
                                    Issues and Tasks ({filteredIssues().length})
                                </Text>
                                <VStack spacing="$4" alignItems="stretch">
                                    <Show
                                        when={filteredIssues().length > 0}
                                        fallback={
                                            <Text color="$neutral11" textAlign="center" py="$4">
                                                No issues found matching the current filters
                                            </Text>
                                        }
                                    >
                                        {filteredIssues().map(issue => (
                                            <Box
                                            p="$4"
                                            bg="$neutral1"
                                            borderRadius="$lg"
                                            borderWidth="1px"
                                            borderColor="$neutral4"
                                        >
                                            <HStack justifyContent="space-between" mb="$2">
                                                <Text fontWeight="$medium">{issue.title}</Text>
                                                <HStack spacing="$2">
                                                    <Badge
                                                        colorScheme={issue.state === 'closed' ? 'success' : 'warning'}
                                                    >
                                                        {issue.state}
                                                    </Badge>
                                                    {/* Due Date Status Badge */}
                                                    <Badge
                                                        colorScheme={getDueDateStatus(issue).color}
                                                    >
                                                        {getDueDateStatus(issue).label}
                                                    </Badge>
                                                    <a
                                                        href={`https://github.com/ajarka/${issue.repository.name}/issues/${issue.number}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        class="text-blue-500 hover:text-blue-700"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                                            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                                                        </svg>
                                                    </a>
                                                </HStack>
                                            </HStack>
                                            <HStack spacing="$4" color="$neutral11">
                                                <Text size="sm">{issue.repository.name} #{issue.number}</Text>
                                                {issue.assignee && (
                                                    <Text size="sm">Assigned to: {issue.assignee.login}</Text>
                                                )}
                                            </HStack>
                                        
                                            {/* Due Date Information */}
                                            {(issue.start_date || issue.due_date) && (
                                                <HStack mt="$2" spacing="$4" color="$neutral11">
                                                    {issue.start_date && (
                                                        <Text size="sm">Start: {formatDate(issue.start_date)}</Text>
                                                    )}
                                                    {issue.due_date && (
                                                        <Text size="sm">Due: {formatDate(issue.due_date)}</Text>
                                                    )}
                                                </HStack>
                                            )}
                                        
                                            {/* Tasks */}
                                            {issue.body && (
                                                <Box mt="$2">
                                                    {issue.body.match(/- \[.\] .+/g)?.map((task: string) => (
                                                        <div class="flex items-start space-x-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={task.includes('- [x]')}
                                                                disabled
                                                                class="mt-1"
                                                            />
                                                            <Text size="sm">
                                                                {task.replace(/- \[.\] /, '')}
                                                            </Text>
                                                        </div>
                                                    ))}
                                                </Box>
                                            )}
                                        </Box>
                                        ))}
                                    </Show>
                                </VStack>
                            </Card>
                        </div>
                    </Card>
                )}
            </Show>
        </Show>


    );
};