import { Component, Show, createMemo, createSignal } from 'solid-js';
import { useParams, A } from '@solidjs/router';
import { Card } from '../components/UI/Card';
import { useGithubData } from '../hooks/useGithubData';
import { CompletionChart } from '../components/Charts/CompletionChart';
import { ActivityChart } from '../components/Charts/ActivityChart';
import { Text, Box, VStack, HStack, Badge } from "@hope-ui/solid";
import { calculateTaskProgress } from '../utils/progressUtils';
import { FilterSort } from '../components/Common/FilterSort';
// import { StatusDistributionAnalysis } from '../components/Analysis/StatusDistributionAnalysis';

interface RepoStats {
    issues: any[];
    pullRequests: any[];
    commits: any[];
    completedIssues: any[];
    mergedPRs: any[];
    taskProgress: {
        total: number;
        completed: number;
    };
    contributors: string[];
    activityData: Array<{
        date: string;
        commits: number;
        pullRequests: number;
        issues: number;
    }>;
    issueProgress: number;
    taskProgressPercentage: number;
}

export const RepositoryDetail: Component = () => {
    const params = useParams();
    const { data } = useGithubData();

    const repoData = createMemo(() => {
        if (!data()) return null;
        return data()?.repositories.find((r: { name: string; }) => r.name === params.name);
    });

    const repoStats = createMemo<RepoStats | null>(() => {
        const currentData = data();
        const repo = repoData();
        if (!currentData || !repo) return null;

        const repoIssues = currentData.issues.filter(i => i.repository.name === repo.name);
        const repoPRs = currentData.pullRequests.filter(pr => pr.repository.name === repo.name);
        const repoCommits = currentData.commits.filter(c => c.repository.name === repo.name);

        const completedIssues = repoIssues.filter(i => i.state === 'closed');
        const mergedPRs = repoPRs.filter(pr => pr.merged_at !== null);

        // Calculate task progress
        const taskProgress = repoIssues.reduce((acc, issue) => {
            const progress = calculateTaskProgress(issue.body);
            return {
                total: acc.total + progress.total,
                completed: acc.completed + progress.completed,
            };
        }, { total: 0, completed: 0 });

        // Get contributors
        const contributorSet = new Set<string>();
        repoIssues.forEach(issue => {
            if (issue.assignee) contributorSet.add(issue.assignee.login);
        });
        repoPRs.forEach(pr => contributorSet.add(pr.user.login));
        repoCommits.forEach(commit => {
            if (commit.author) contributorSet.add(commit.author.login);
        });

        // Activity data for chart (last 7 days)
        const activityData = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            return {
                date: dateStr,
                commits: repoCommits.filter(c =>
                    c.commit.author.date.startsWith(dateStr)
                ).length,
                pullRequests: repoPRs.filter(pr =>
                    pr.created_at.startsWith(dateStr)
                ).length,
                issues: repoIssues.filter(issue =>
                    issue.created_at.startsWith(dateStr)
                ).length
            };
        }).reverse();

        return {
            issues: repoIssues,
            pullRequests: repoPRs,
            commits: repoCommits,
            completedIssues,
            mergedPRs,
            taskProgress,
            contributors: Array.from(contributorSet),
            activityData,
            issueProgress: repoIssues.length > 0
                ? (completedIssues.length / repoIssues.length) * 100
                : 0,
            taskProgressPercentage: taskProgress.total > 0
                ? (taskProgress.completed / taskProgress.total) * 100
                : 0
        };
    });

    // Add filter states
    const [statusFilter, setStatusFilter] = createSignal<string[]>(['open']);
    const [typeFilter, setTypeFilter] = createSignal<string[]>([]);
    const [sortBy, setSortBy] = createSignal('newest');
    const [searchQuery, setSearchQuery] = createSignal('');

    // Add filtered items memo
    const filteredItems = createMemo(() => {
        const stats = repoStats();
        if (!stats) return { issues: [], pullRequests: [] };

        let filteredIssues = [...stats.issues];
        let filteredPRs = [...stats.pullRequests];

        // Apply search
        if (searchQuery()) {
            const query = searchQuery().toLowerCase();
            filteredIssues = filteredIssues.filter(issue =>
                issue.title.toLowerCase().includes(query) ||
                issue.body?.toLowerCase().includes(query)
            );
            filteredPRs = filteredPRs.filter(pr =>
                pr.title.toLowerCase().includes(query)
            );
        }

        // Apply type filter
        if (typeFilter().length > 0) {
            if (!typeFilter().includes('issues')) filteredIssues = [];
            if (!typeFilter().includes('prs')) filteredPRs = [];
        }

        // Apply status filter
        if (statusFilter().length > 0) {
            filteredIssues = filteredIssues.filter(issue => {
                const hasOpenTasks = issue.body?.match(/- \[ \] .+/g)?.length > 0;
                const hasCompletedTasks = issue.body?.match(/- \[x\] .+/g)?.length > 0;

                return statusFilter().some(status => {
                    switch (status) {
                        case 'open-tasks':
                            return hasOpenTasks;
                        case 'completed-tasks':
                            return hasCompletedTasks;
                        case 'no-tasks':
                            return !hasOpenTasks && !hasCompletedTasks;
                        default:
                            return issue.state === status;
                    }
                });
            });

            filteredPRs = filteredPRs.filter(pr =>
                statusFilter().includes(pr.merged_at ? 'merged' : pr.state)
            );
        }

        // Apply sorting
        const sortItems = (items: any[]) => {
            switch (sortBy()) {
                case 'newest':
                    return items.sort((a, b) =>
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    );
                case 'oldest':
                    return items.sort((a, b) =>
                        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                    );
                case 'most-active':
                    return items.sort((a, b) =>
                        (b.comments || 0) - (a.comments || 0)
                    );
                default:
                    return items;
            }
        };

        return {
            issues: sortItems(filteredIssues),
            pullRequests: sortItems(filteredPRs)
        };
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

    const getBadgeColorScheme = (pr: { merged_at: string | null, state: string }) => {
        if (pr.merged_at) return 'success';
        return pr.state === 'closed' ? 'danger' : 'warning';
    };

    const formatDate = (date: string | undefined) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

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

            <Show
                when={repoData() && repoStats()}
                fallback={
                    <Card>
                        <p class="text-gray-500 text-center py-4">Repository not found</p>
                    </Card>
                }
            >
                <div class="space-y-6">
                    {/* Repository Header */}
                    <Card>
                        <VStack spacing="$4" alignItems="stretch">
                            <Text size="2xl" fontWeight="$bold">{repoData()!.name}</Text>
                            {repoData()!.description && (
                                <Text color="$neutral11">{repoData()!.description}</Text>
                            )}

                            <HStack spacing="$4" wrap="wrap">
                                <Badge colorScheme="primary">
                                    {repoStats()!.issues.length} Issues
                                </Badge>
                                <Badge colorScheme="success">
                                    {repoStats()!.mergedPRs.length} Merged PRs
                                </Badge>
                                <Badge colorScheme="info">
                                    {repoStats()!.commits.length} Commits
                                </Badge>
                                <Badge colorScheme="warning">
                                    {repoStats()!.contributors.length} Contributors
                                </Badge>
                            </HStack>
                        </VStack>
                    </Card>

                    {/* <Show
                        when={repoData() && repoStats() && repoStats()!.issues.length > 0}
                    >
                        <div class="mb-6">
                            <StatusDistributionAnalysis
                                title={`Status Distribution for ${repoData()!.name}`}
                                entityName={repoData()!.name}
                                entityType="Repository"
                                issues={repoStats()!.issues}
                            />
                        </div>
                    </Show> */}

                    {/* Progress Charts */}
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <Text size="lg" fontWeight="$semibold" mb="$4">
                                Issue Progress
                            </Text>
                            <div class="h-64">
                                <CompletionChart
                                    percentage={repoStats()!.issueProgress}
                                    title="Issues Completed"
                                />
                            </div>
                        </Card>

                        <Card>
                            <Text size="lg" fontWeight="$semibold" mb="$4">
                                Task Progress
                            </Text>
                            <div class="h-64">
                                <CompletionChart
                                    percentage={repoStats()!.taskProgressPercentage}
                                    title="Tasks Completed"
                                />
                            </div>
                        </Card>
                    </div>



                    {/* Activity Chart */}
                    <Card>
                        <Text size="lg" fontWeight="$semibold" mb="$4">
                            Recent Activity
                        </Text>
                        <div class="h-64">
                            <ActivityChart data={repoStats()!.activityData} />
                        </div>
                    </Card>

                    <FilterSort
                        filters={[
                            {
                                name: 'Type',
                                options: [
                                    { label: 'Issues', value: 'issues' },
                                    { label: 'Pull Requests', value: 'prs' }
                                ],
                                selectedValues: typeFilter(),
                                onFilterChange: setTypeFilter
                            },
                            {
                                name: 'Status',
                                options: [
                                    { label: 'Has Open Tasks', value: 'open-tasks' },
                                    { label: 'Has Completed Tasks', value: 'completed-tasks' },
                                    { label: 'No Tasks', value: 'no-tasks' },
                                    { label: 'Open', value: 'open' },
                                    { label: 'Closed', value: 'closed' },
                                    { label: 'Merged', value: 'merged' }
                                ],
                                selectedValues: statusFilter(),
                                onFilterChange: setStatusFilter
                            }
                        ]}
                        sorts={[
                            { label: 'Newest First', value: 'newest' },
                            { label: 'Oldest First', value: 'oldest' },
                            { label: 'Most Active', value: 'most-active' }
                        ]}
                        currentSort={sortBy()}
                        onSortChange={setSortBy}
                        searchValue={searchQuery()}
                        onSearchChange={setSearchQuery}
                    />

                    {/* Update the lists to use filteredItems */}
                    <Show when={filteredItems().pullRequests.length > 0}>
                        <Card>
                            <Text size="lg" fontWeight="$semibold" mb="$4">
                                Pull Requests ({filteredItems().pullRequests.length})
                            </Text>
                            <VStack spacing="$4" alignItems="stretch">
                                {filteredItems().pullRequests.map(pr => (
                                    <Box
                                        p="$4"
                                        bg="$neutral1"
                                        borderRadius="$lg"
                                        borderWidth="1px"
                                        borderColor="$neutral4"
                                    >
                                        <HStack justifyContent="space-between" mb="$2">
                                            <Text fontWeight="$medium">{pr.title}</Text>
                                            <HStack spacing="$2">
                                                <Badge
                                                    colorScheme={getBadgeColorScheme(pr)}
                                                >
                                                    {pr.merged_at ? 'Merged' : pr.state}
                                                </Badge>
                                                <a
                                                    href={`https://github.com/ajarka/${repoData()!.name}/pull/${pr.number}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    class="text-blue-500 hover:text-blue-700"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {/* <Box class="i-fa-solid-external-link w-4 h-4" /> */}
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                                                    </svg>
                                                </a>
                                            </HStack>
                                        </HStack>
                                        <HStack spacing="$4" color="$neutral11">
                                            <Text size="sm">by {pr.user.login}</Text>
                                            <Text size="sm" class="space-x-1">
                                                <span class="text-green-600">+{pr.additions || 0}</span>
                                                <span class="text-red-600">-{pr.deletions || 0}</span>
                                                <span class="text-gray-600">lines</span>
                                            </Text>
                                        </HStack>
                                    </Box>
                                ))}
                            </VStack>
                        </Card>
                    </Show>

                    <Show when={filteredItems().issues.length > 0}>
                        <Card>
                            <Text size="lg" fontWeight="$semibold" mb="$4">
                                Issues ({filteredItems().issues.length})
                            </Text>
                            <VStack spacing="$4" alignItems="stretch">
                                {filteredItems().issues.map(issue => (
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
                            </VStack>
                        </Card>
                    </Show>
                </div>
                
            </Show>
        </Show>
    );
};

export default RepositoryDetail;