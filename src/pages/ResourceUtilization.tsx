import { Component, createMemo, createSignal } from 'solid-js';
import { useGithubData } from '../hooks/useGithubData';
import { MemberLoadAnalysis } from '../components/Utilization/MemberLoadAnalysis';
import { CapacityPlanning } from '../components/Utilization/CapacityPlanning';
import { WorkloadDistribution } from '../components/Utilization/WorkloadDistribution';
import { Card } from '../components/UI/Card';
import { Button, HStack, VStack, Text, Box } from '@hope-ui/solid';
import { useRateLimit } from '../context/RateLimitContext';
import { ResourceUtilizationSkeleton } from '../components/Skeletons/ResourceUtilizationSkeleton';

const WORKLOAD_THRESHOLDS = {
    LOW: 15,        // Below this is considered under-utilized
    OPTIMAL: 30,    // Target workload per member
    HIGH: 45,       // Above this is considered high load
    CRITICAL: 60    // Above this is considered critical overload
} as const;

const WEEKLY_CAPACITY = 40; // 40-hour work week

// Project status constants
const PROJECT_STATUSES = {
    BACKLOG: 'backlog',
    TODO: 'todo',
    IN_PROGRESS: 'in progress',
    DONE: 'done',
    REVIEW: 'review'
};

const TIME_ESTIMATES = {
    ISSUE_ACTIVE: 2,     // Hours for active issue
    ISSUE_REVIEW: 1,     // Hours for issue in review
    TASK_ACTIVE: 0.5,    // Hours per active task
    PR_REVIEW: 1,        // Hours per PR review
    COMMIT: 0.25         // Hours per commit
} as const;

interface TaskCount {
    total: number;
    completed: number;
    remaining: number;
}

interface TaskType {
    count: number;
    tasks: number;
    completed: number;
}

interface TaskTypes {
    bug: TaskType;
    feature: TaskType;
    documentation: TaskType;
    other: TaskType;
}

type WorkloadStatus = 'low' | 'optimal' | 'high' | 'critical';

interface MemberDetails {
    taskWorkload: number;
    issueWorkload: number;
    prWorkload: number;
    commitWorkload: number;
    tasks: TaskCount;
    completionEfficiency: number;
    issues: any[];
    completedLastWeek: number;
    avgCompletionTime: number;
    taskTypes: TaskTypes;
}

interface UtilizationResult {
    member: any;
    activeIssues: number;
    activePRs: number;
    totalCommits: number;
    estimatedHours: number;
    utilizationPercentage: number;
    status: WorkloadStatus;
    details: MemberDetails;
}

interface GithubIssue {
    title: any;
    state: string;
    labels?: string[];
    body: string | null;
    created_at: string;
    closed_at?: string;
    updated_at: string;
}

interface GithubCommit {
    commit: {
        author: {
            date: string;
        };
    };
}

interface CodeStats {
    totalPRs: number;
    mergedPRs: number;
    commits: GithubCommit[];
    totalCommits: number;
}

interface MemberData {
    issues: GithubIssue[];
    codeStats: CodeStats;
    member: any;
}

export const ResourceUtilization: Component = () => {
    const { isRateLimited, rateLimitData } = useRateLimit();
    const { data, memberDetailedStats } = useGithubData();
    const [statusFilter, setStatusFilter] = createSignal<string[]>([
        PROJECT_STATUSES.TODO,
        PROJECT_STATUSES.IN_PROGRESS,
        PROJECT_STATUSES.REVIEW
    ]); // Default excludes backlog

    // Helper function to check if an issue should be included based on its status
    const shouldIncludeIssue = (issue: any) => {
        if (!statusFilter().length) return true; // If no filters, include all

        // Find the issue in projects to get its status
        const projectItem = findIssueInProjects(issue);
        if (!projectItem?.status) {
            // Anggap semua issue tanpa status sebagai "backlog"
            return statusFilter().includes('backlog');
          }

        const issueStatus = (projectItem.status || '').toLowerCase();
        return statusFilter().some(s => issueStatus.includes(s));
    };

    // Helper to find issue in projects
    const findIssueInProjects = (issue: any) => {
        const projects = data()?.projects || [];
        for (const project of projects) {
            const foundIssue = project.issues?.find((i: { number: any; repository: any; }) =>
                i.number === issue.number && i.repository === issue.repository.name
            );
            if (foundIssue) return foundIssue;
        }
        return null;
    };

    const countTasks = (body: string | null): TaskCount => {
        if (!body) return { total: 0, completed: 0, remaining: 0 };

        const totalTasks = (body.match(/- \[[ x]\]/g) || []).length;
        const completedTasks = (body.match(/- \[x\]/g) || []).length;

        return {
            total: totalTasks,
            completed: completedTasks,
            remaining: totalTasks - completedTasks
        };
    };

    const calculateCompletionEfficiency = (issues: GithubIssue[]): number => {
        const issuesWithTasks = issues.filter(issue => {
            const tasks = countTasks(issue.body);
            return tasks.total > 0;
        });

        if (issuesWithTasks.length === 0) return 0;

        const totalEfficiency = issuesWithTasks.reduce((acc, issue) => {
            const tasks = countTasks(issue.body);
            return acc + ((tasks.completed / tasks.total) * 100);
        }, 0);

        // Return average efficiency (0-100%)
        return Math.min(Math.round(totalEfficiency / issuesWithTasks.length), 100);
    };


    const calculateAverageCompletionTime = (issues: GithubIssue[]): number => {
        (window as any).DebugLogger.log('Processing issues:', issues.length);

        // Filter untuk issues yang closed, gunakan updated_at sebagai fallback untuk closed_at
        const completedIssues = issues.filter(issue => {
            const isCompleted = issue.state === 'closed' && issue.created_at;

            if (isCompleted) {
                (window as any).DebugLogger.log('Found completed issue:', {
                    title: issue.title,
                    created: issue.created_at,
                    updated: issue.updated_at,
                    closed: issue.closed_at
                });
            }

            return isCompleted;
        });

        if (completedIssues.length === 0) {
            (window as any).DebugLogger.log('No completed issues found');
            return 0;
        }

        const timeCalculations = completedIssues.map(issue => {
            const created = new Date(issue.created_at);
            // Gunakan closed_at jika ada, atau updated_at sebagai fallback
            const completed = new Date(issue.closed_at ?? issue.updated_at);

            // Hitung selisih waktu dalam hari
            const timeDiff = completed.getTime() - created.getTime();
            const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

            // Parse tasks
            const tasks = countTasks(issue.body);
            const weight = Math.max(tasks.total, 1); // minimal weight 1

            const calcResult = {
                daysDiff,
                weight,
                created: issue.created_at,
                completed: issue.closed_at ?? issue.updated_at,
                tasks: tasks.total
            };

            (window as any).DebugLogger.log('Calculation for issue:', calcResult);

            return calcResult;
        });

        const totalTimeInDays = timeCalculations.reduce((sum, calc) =>
            sum + (calc.daysDiff * calc.weight), 0);

        const totalWeight = timeCalculations.reduce((sum, calc) =>
            sum + calc.weight, 0);

        (window as any).DebugLogger.log('Aggregated results:', {
            totalTimeInDays,
            totalWeight
        });

        if (totalWeight === 0) {
            (window as any).DebugLogger.log('Total weight is 0');
            return 0;
        }

        // Hitung rata-rata tertimbang
        const weightedAverage = totalTimeInDays / totalWeight;

        // Return dengan 1 decimal place, dan pastikan tidak negative
        const result = Math.max(Number(weightedAverage.toFixed(1)), 0);
        (window as any).DebugLogger.log('Final average completion time:', result);

        return result;
    };

    const getIssueType = (issue: GithubIssue): keyof TaskTypes => {
        const labels = issue.labels || [];
        const hasLabel = (searchTerm: string) =>
            labels.some(label =>
                typeof label === 'string' &&
                label.toLowerCase().includes(searchTerm)
            );

        if (hasLabel('bug')) return 'bug';
        if (hasLabel('feature')) return 'feature';
        if (hasLabel('documentation')) return 'documentation';
        return 'other';
    };

    const analyzeTaskTypes = (issues: GithubIssue[]): TaskTypes => {
        const defaultType: TaskType = { count: 0, tasks: 0, completed: 0 };
        const initialTaskTypes: TaskTypes = {
            bug: { ...defaultType },
            feature: { ...defaultType },
            documentation: { ...defaultType },
            other: { ...defaultType }
        };

        return issues.reduce((acc, issue) => {
            if (!issue) return acc;

            const type = getIssueType(issue);
            const taskCount = countTasks(issue.body);

            acc[type].count++;
            acc[type].tasks += taskCount.total;
            acc[type].completed += taskCount.completed;

            return acc;
        }, initialTaskTypes);
    };

    const memberUtilization = createMemo(() => {
        if (!memberDetailedStats()) return [];

        return memberDetailedStats().map((member: MemberData): UtilizationResult => {
            // Apply status filter to issues
            const filteredIssues = member.issues.filter(shouldIncludeIssue);

            // Separate issues by state
            const activeIssues = filteredIssues.filter(i => i.state === 'open');
            const reviewIssues = filteredIssues.filter(i =>
                i.state === 'open' && i.labels?.includes('review')
            );
            const inProgressPRs = member.codeStats.totalPRs - member.codeStats.mergedPRs;

            // Calculate task load
            const taskCounts = activeIssues.reduce((acc: TaskCount, issue) => {
                const issueTasks = countTasks(issue.body);
                return {
                    total: acc.total + issueTasks.total,
                    completed: acc.completed + issueTasks.completed,
                    remaining: acc.remaining + issueTasks.remaining
                };
            }, { total: 0, completed: 0, remaining: 0 });

            // Calculate workload - same as before
            const taskWorkload = taskCounts.remaining * TIME_ESTIMATES.TASK_ACTIVE;
            const issueWorkload =
                (activeIssues.length - reviewIssues.length) * TIME_ESTIMATES.ISSUE_ACTIVE +
                reviewIssues.length * TIME_ESTIMATES.ISSUE_REVIEW;
            const prWorkload = inProgressPRs * TIME_ESTIMATES.PR_REVIEW;
            const commitWorkload = member.codeStats.commits
                .filter(c => {
                    const commitDate = new Date(c.commit.author.date);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return commitDate >= weekAgo;
                })
                .length * TIME_ESTIMATES.COMMIT;

            const estimatedHours =
                taskWorkload +
                issueWorkload +
                prWorkload +
                commitWorkload;

            const utilizationPercentage = (estimatedHours / WEEKLY_CAPACITY) * 100;

            // Determine status
            let status: WorkloadStatus;
            if (utilizationPercentage <= (WORKLOAD_THRESHOLDS.LOW / WEEKLY_CAPACITY * 100)) {
                status = 'low';
            } else if (utilizationPercentage <= (WORKLOAD_THRESHOLDS.OPTIMAL / WEEKLY_CAPACITY * 100)) {
                status = 'optimal';
            } else if (utilizationPercentage <= (WORKLOAD_THRESHOLDS.HIGH / WEEKLY_CAPACITY * 100)) {
                status = 'high';
            } else {
                status = 'critical';
            }

            return {
                member: member.member,
                activeIssues: activeIssues.length,
                activePRs: inProgressPRs,
                totalCommits: member.codeStats.totalCommits,
                estimatedHours,
                utilizationPercentage,
                status,
                details: {
                    taskWorkload,
                    issueWorkload,
                    prWorkload,
                    commitWorkload,
                    tasks: taskCounts,
                    completionEfficiency: calculateCompletionEfficiency(filteredIssues),
                    issues: filteredIssues,
                    completedLastWeek: filteredIssues.filter(i =>
                        i.state === 'closed' &&
                        i.closed_at !== undefined &&
                        new Date(i.closed_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
                    ).length,
                    avgCompletionTime: calculateAverageCompletionTime(filteredIssues),
                    taskTypes: analyzeTaskTypes(filteredIssues)
                }
            };
        });
    });

    if (isRateLimited()) {
        return (
            <Card>
                <VStack spacing="$4" alignItems="center" p="$6">
                    <Text size="xl" fontWeight="$bold" color="$danger600" style={{'font-family': 'Figtree'}}>
                        Projects Data Temporarily Unavailable
                    </Text>
                    <Text textAlign="center" color="$neutral600" style={{'font-family': 'Figtree'}}>
                        Project details including start dates and due dates are currently unavailable
                        due to <a class='underline text-blue-600' target="_blank" rel="noopener" href="https://docs.github.com/en/graphql/overview/rate-limits-and-node-limits-for-the-graphql-api">GitHub's API rate limit</a>. The limit will reset at:
                        <br />
                        <span class="font-semibold">
                            {rateLimitData() && new Date(rateLimitData().resetAt).toLocaleString()}
                        </span>
                    </Text>
                </VStack>
            </Card>
        );
    }

    return (
        <div class="space-y-6 md:px-0" style={{'font-family': 'Figtree'}}>
            {data.loading && <ResourceUtilizationSkeleton />}

            {data.error && (
                <div class="bg-red-50 p-4 rounded-lg text-red-700" style={{'font-family': 'Figtree'}}>
                    Error loading data. Please try again.
                </div>
            )}

            {data() && (
                <>
                    <div class="grid grid-cols-1 gap-4 md:gap-6">
                        <Card class="p-4 md:p-6">
                            <div class="flex flex-col space-y-4 md:space-y-0 md:flex-row md:justify-between md:items-center">
                                <Text 
                                    size={{
                                        "@initial": "xl",
                                        "@md": "2xl"
                                    }}
                                    fontWeight="$bold" 
                                    class="text-center md:text-left"
                                    style={{
                                        'font-family': 'Figtree',
                                        'background': 'linear-gradient(to right, #1E3A8A, #3B82F6)',
                                        '-webkit-background-clip': 'text',
                                        '-webkit-text-fill-color': 'transparent'
                                    }}
                                >
                                    Resource Utilization Overview
                                </Text>

                                <div class="overflow-x-auto pb-2 md:pb-0 -mx-4 md:mx-0 md:px-0">
                                    <div class="flex flex-nowrap md:flex-wrap gap-2 min-w-max md:min-w-0">
                                        {Object.values(PROJECT_STATUSES).map(status => (
                                            <Button
                                                key={status}
                                                size="sm"
                                                variant={statusFilter().includes(status) ? "solid" : "outline"}
                                                colorScheme={statusFilter().includes(status) ? "primary" : "neutral"}
                                                onClick={() => {
                                                    if (statusFilter().includes(status)) {
                                                        setStatusFilter(prev => prev.filter(s => s !== status));
                                                    } else {
                                                        setStatusFilter(prev => [...prev, status]);
                                                    }
                                                }}
                                                style={{
                                                    'font-family': 'Figtree',
                                                    'border-radius': '20px',
                                                    'min-width': '90px',
                                                    'transition': 'all 0.2s ease-in-out',
                                                    'box-shadow': '0 2px 4px rgba(0,0,0,0.05)',
                                                    'white-space': 'nowrap'
                                                }}
                                                _hover={{
                                                    transform: 'translateY(-1px)',
                                                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                                }}
                                            >
                                                {status.charAt(0).toUpperCase() + status.slice(1)}
                                            </Button>
                                        ))}
                                        <Button
                                            variant="outline"
                                            colorScheme="neutral"
                                            size="sm"
                                            onClick={() => setStatusFilter([])}
                                            style={{
                                                'font-family': 'Figtree',
                                                'border-radius': '20px',
                                                'transition': 'all 0.2s ease-in-out',
                                                'box-shadow': '0 2px 4px rgba(0,0,0,0.05)',
                                                'white-space': 'nowrap'
                                            }}
                                            _hover={{
                                                transform: 'translateY(-1px)',
                                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                            }}
                                        >
                                            Show All
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <div class="grid grid-cols-1 gap-4">
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                                <Card class="p-4 md:p-6 transform transition-all duration-200 hover:shadow-lg" style={{
                                    'border-radius': '16px',
                                    'background': 'linear-gradient(145deg, #ffffff, #f8fafc)',
                                    'border': '1px solid rgba(0,0,0,0.05)'
                                }}>
                                    <VStack alignItems="flex-start" spacing="$2 md:$4">
                                        <Text 
                                            color="$neutral11" 
                                            size={{
                                                "@initial": "xs",
                                                "@md": "sm"
                                            }}
                                            style={{'font-family': 'Figtree'}}
                                        >
                                            Total Team Members
                                        </Text>
                                        <Text 
                                            size={{
                                                "@initial": "2xl",
                                                "@md": "3xl"
                                            }}
                                            fontWeight="bold" 
                                            color="$primary9" 
                                            style={{'font-family': 'Figtree'}}
                                        >
                                            {memberUtilization().length}
                                        </Text>
                                    </VStack>
                                </Card>

                                <Card class="p-4 md:p-6 transform transition-all duration-200 hover:shadow-lg" style={{
                                    'border-radius': '16px',
                                    'background': 'linear-gradient(145deg, #ffffff, #f8fafc)',
                                    'border': '1px solid rgba(0,0,0,0.05)'
                                }}>
                                    <VStack alignItems="flex-start" spacing="$2 md:$4">
                                        <Text 
                                            color="$neutral11" 
                                            size={{
                                                "@initial": "xs",
                                                "@md": "sm"
                                            }}
                                            style={{'font-family': 'Figtree'}}
                                        >
                                            Average Utilization
                                        </Text>
                                        <Text 
                                            size={{
                                                "@initial": "2xl",
                                                "@md": "3xl"
                                            }}
                                            fontWeight="bold" 
                                            color="$primary9" 
                                            style={{'font-family': 'Figtree'}}
                                        >
                                            {(memberUtilization().reduce((sum: number, m: UtilizationResult) => sum + m.utilizationPercentage, 0) / 
                                              Math.max(memberUtilization().length, 1)).toFixed(1)}%
                                        </Text>
                                    </VStack>
                                </Card>

                                <Card class="p-4 md:p-6 transform transition-all duration-200 hover:shadow-lg" style={{
                                    'border-radius': '16px',
                                    'background': 'linear-gradient(145deg, #ffffff, #f8fafc)',
                                    'border': '1px solid rgba(0,0,0,0.05)'
                                }}>
                                    <VStack alignItems="flex-start" spacing="$2 md:$4">
                                        <Text 
                                            color="$neutral11" 
                                            size={{
                                                "@initial": "xs",
                                                "@md": "sm"
                                            }}
                                            style={{'font-family': 'Figtree'}}
                                        >
                                            Optimal Workload
                                        </Text>
                                        <HStack spacing="$2" alignItems="baseline">
                                            <Text 
                                                size={{
                                                    "@initial": "2xl",
                                                    "@md": "3xl"
                                                }}
                                                fontWeight="bold" 
                                                color="$success9" 
                                                style={{'font-family': 'Figtree'}}
                                            >
                                                {memberUtilization().filter((m: UtilizationResult) => m.status === 'optimal').length}
                                            </Text>
                                            <Text 
                                                size={{
                                                    "@initial": "xs",
                                                    "@md": "sm"
                                                }}
                                                color="$neutral11" 
                                                style={{'font-family': 'Figtree'}}
                                            >members</Text>
                                        </HStack>
                                    </VStack>
                                </Card>

                                <Card class="p-4 md:p-6 transform transition-all duration-200 hover:shadow-lg" style={{
                                    'border-radius': '16px',
                                    'background': 'linear-gradient(145deg, #ffffff, #f8fafc)',
                                    'border': '1px solid rgba(0,0,0,0.05)'
                                }}>
                                    <VStack alignItems="flex-start" spacing="$2 md:$4">
                                        <Text 
                                            color="$neutral11" 
                                            size={{
                                                "@initial": "xs",
                                                "@md": "sm"
                                            }}
                                            style={{'font-family': 'Figtree'}}
                                        >
                                            Attention Needed
                                        </Text>
                                        <div class="flex gap-6">
                                            <VStack alignItems="flex-start">
                                                <Text 
                                                    size={{
                                                        "@initial": "2xl",
                                                        "@md": "3xl"
                                                    }}
                                                    fontWeight="bold" 
                                                    color="$danger9" 
                                                    style={{'font-family': 'Figtree'}}
                                                >
                                                    {memberUtilization().filter((m: UtilizationResult)   => m.status === 'critical').length}
                                                </Text>
                                                <Text 
                                                    size={{
                                                        "@initial": "xs",
                                                        "@md": "sm"
                                                    }}
                                                    color="$neutral11" 
                                                    style={{'font-family': 'Figtree'}}
                                                >Overloaded</Text>
                                            </VStack>
                                            <VStack alignItems="flex-start">
                                                <Text 
                                                    size={{
                                                        "@initial": "2xl",
                                                        "@md": "3xl"
                                                    }}
                                                    fontWeight="bold" 
                                                    color="$warning9" 
                                                    style={{'font-family': 'Figtree'}}
                                                >
                                                    {memberUtilization().filter((m: UtilizationResult) => m.status === 'low').length}
                                                </Text>
                                                <Text 
                                                    size={{
                                                        "@initial": "xs",
                                                        "@md": "sm"
                                                    }}
                                                    color="$neutral11" 
                                                    style={{'font-family': 'Figtree'}}
                                                >Underutilized</Text>
                                            </VStack>
                                        </div>
                                    </VStack>
                                </Card>
                            </div>

                            <Card class="p-4 md:p-6" style={{
                                'border-radius': '16px',
                                'background': 'linear-gradient(145deg, #ffffff, #f8fafc)',
                                'border': '1px solid rgba(0,0,0,0.05)'
                            }}>
                                <Text 
                                    size={{
                                        "@initial": "md",
                                        "@md": "lg"
                                    }}
                                    fontWeight="bold" 
                                    mb="$3 md:$4" 
                                    style={{
                                        'font-family': 'Figtree',
                                        'color': '#1E3A8A'
                                    }}
                                >
                                    Quick Recommendations
                                </Text>
                                <VStack alignItems="stretch" spacing="$2 md:$3">
                                    {memberUtilization().filter((m: UtilizationResult) => m.status === 'critical').length > 0 && (
                                        <Box 
                                            p="$4" 
                                            style={{
                                                'border-radius': '12px',
                                                'background': 'linear-gradient(145deg, #FEF2F2, #FEE2E2)',
                                                'border': '1px solid rgba(239,68,68,0.2)'
                                            }}
                                        >
                                            <Text color="$danger11" style={{'font-family': 'Figtree'}}>
                                                ⚠️ {memberUtilization().filter((m: UtilizationResult) => m.status === 'critical').length} team member(s) are overloaded and need workload rebalancing.
                                            </Text>
                                        </Box>
                                    )}

                                    {memberUtilization().filter((m: UtilizationResult) => m.status === 'low').length > 0 && (
                                        <Box 
                                            p="$4" 
                                            style={{
                                                'border-radius': '12px',
                                                'background': 'linear-gradient(145deg, #FFF7ED, #FFEDD5)',
                                                'border': '1px solid rgba(245,158,11,0.2)'
                                            }}
                                        >
                                            <Text color="$warning11" style={{'font-family': 'Figtree'}}>
                                                ℹ️ {memberUtilization().filter((m: UtilizationResult) => m.status === 'low').length} team member(s) have capacity for additional tasks.
                                            </Text>
                                        </Box>
                                    )}
                                </VStack>
                            </Card>
                        </div>
                        
                        <div class="space-y-4 md:space-y-6">
                            <WorkloadDistribution utilization={memberUtilization()} />
                            <MemberLoadAnalysis
                                projects={data()?.projects || []}
                                utilization={memberUtilization()}
                                thresholds={WORKLOAD_THRESHOLDS}
                            />
                            <CapacityPlanning
                                utilization={memberUtilization()}
                                thresholds={WORKLOAD_THRESHOLDS}
                                weeklyCapacity={WEEKLY_CAPACITY}
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};