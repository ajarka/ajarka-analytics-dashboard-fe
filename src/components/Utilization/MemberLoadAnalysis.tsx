import { Component, For, createSignal, createMemo } from 'solid-js';
import { Card } from '../UI/Card';
import {
    VStack,
    HStack,
    Text,
    Box,
    Avatar,
    Badge,
    Input,
    Select,
    SelectTrigger,
    SelectPlaceholder,
    SelectValue,
    SelectIcon,
    SelectContent,
    SelectListbox,
    SelectOption,
    SelectOptionText,
    SelectOptionIndicator,
    Button
} from '@hope-ui/solid';

interface MemberLoadAnalysisProps {
    projects: any[];
    utilization: any[];
    thresholds: {
        LOW: number;
        OPTIMAL: number;
        HIGH: number;
        CRITICAL: number;
    };
}

// Filter and Sort options
const statusFilters = [
    { value: 'critical', label: 'Critical Overload' },
    { value: 'high', label: 'High Load' },
    { value: 'optimal', label: 'Optimal Load' },
    { value: 'low', label: 'Available Capacity' }
];

const taskTypeFilters = [
    { value: 'feature', label: 'Features' },
    { value: 'bug', label: 'Bugs' },
    { value: 'documentation', label: 'Documentation' },
    { value: 'other', label: 'Other' }
];

const sortOptions = [
    { value: 'load-desc', label: 'Highest Load First' },
    { value: 'load-asc', label: 'Lowest Load First' },
    { value: 'tasks-desc', label: 'Most Tasks' },
    { value: 'tasks-asc', label: 'Least Tasks' },
    { value: 'efficiency-desc', label: 'Most Efficient' },
    { value: 'efficiency-asc', label: 'Least Efficient' },
    { value: 'name', label: 'Name (A-Z)' }
];

export const MemberLoadAnalysis: Component<MemberLoadAnalysisProps> = (props) => {
    // Filter and Sort states
    const [statusFilter, setStatusFilter] = createSignal<string[]>([]);
    const [taskTypeFilter, setTaskTypeFilter] = createSignal<string[]>([]);
    const [searchQuery, setSearchQuery] = createSignal('');
    const [sortBy, setSortBy] = createSignal('load-desc'); // Default sort: highest load first

    // Filtered and sorted members
    const filteredMembers = createMemo(() => {
        let filtered = [...props.utilization];

        // Apply search filter
        if (searchQuery()) {
            const query = searchQuery().toLowerCase();
            filtered = filtered.filter(member =>
                member.member.login.toLowerCase().includes(query)
            );
        }

        // Apply status filter
        if (statusFilter().length > 0) {
            filtered = filtered.filter(member =>
                statusFilter().includes(member.status)
            );
        }

        // Apply task type filter
        if (taskTypeFilter().length > 0) {
            filtered = filtered.filter(member =>
                taskTypeFilter().some(type =>
                    member.details.taskTypes[type].count > 0
                )
            );
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (sortBy()) {
                case 'load-desc':
                    return b.utilizationPercentage - a.utilizationPercentage;
                case 'load-asc':
                    return a.utilizationPercentage - b.utilizationPercentage;
                case 'tasks-desc':
                    return b.details.tasks.total - a.details.tasks.total;
                case 'tasks-asc':
                    return a.details.tasks.total - b.details.tasks.total;
                case 'efficiency-desc':
                    return b.details.completionEfficiency - a.details.completionEfficiency;
                case 'efficiency-asc':
                    return a.details.completionEfficiency - b.details.completionEfficiency;
                case 'name':
                    return a.member.login.localeCompare(b.member.login);
                default:
                    return 0;
            }
        });

        return filtered;
    });

    const FilterControls = () => (
        <Card class="mb-4">
            <VStack spacing="$4">
                <Text size="lg" fontWeight="$semibold">Filter and Sort</Text>

                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Search */}
                    <Box>
                        <Text size="sm" fontWeight="$medium" mb="$2">Search</Text>
                        <Input
                            value={searchQuery()}
                            onInput={(e: { currentTarget: { value: any; }; }) => setSearchQuery(e.currentTarget.value)}
                            placeholder="Search members..."
                        />
                    </Box>

                    {/* Status Filter */}
                    <Box>
                        <Text size="sm" fontWeight="$medium" mb="$2">Status Filter</Text>
                        <Select
                            multiple
                            value={statusFilter()}
                            onChange={(values: string[]) => setStatusFilter(values)}
                        >
                            <SelectTrigger>
                                <SelectPlaceholder>Select status...</SelectPlaceholder>
                                <SelectValue />
                                <SelectIcon />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectListbox>
                                    <For each={statusFilters}>
                                        {(status) => (
                                            <SelectOption value={status.value}>
                                                <SelectOptionText>{status.label}</SelectOptionText>
                                                <SelectOptionIndicator />
                                            </SelectOption>
                                        )}
                                    </For>
                                </SelectListbox>
                            </SelectContent>
                        </Select>
                    </Box>

                    {/* Task Type Filter */}
                    <Box>
                        <Text size="sm" fontWeight="$medium" mb="$2">Task Type Filter</Text>
                        <Select
                            multiple
                            value={taskTypeFilter()}
                            onChange={(values: string[]) => setTaskTypeFilter(values)}
                        >
                            <SelectTrigger>
                                <SelectPlaceholder>Select task types...</SelectPlaceholder>
                                <SelectValue />
                                <SelectIcon />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectListbox>
                                    <For each={taskTypeFilters}>
                                        {(type) => (
                                            <SelectOption value={type.value}>
                                                <SelectOptionText>{type.label}</SelectOptionText>
                                                <SelectOptionIndicator />
                                            </SelectOption>
                                        )}
                                    </For>
                                </SelectListbox>
                            </SelectContent>
                        </Select>
                    </Box>

                    {/* Sort */}
                    <Box>
                        <Text size="sm" fontWeight="$medium" mb="$2">Sort By</Text>
                        <Select
                            value={sortBy()}
                            onChange={(value: string) => setSortBy(value)}
                        >
                            <SelectTrigger>
                                <SelectPlaceholder>Sort by...</SelectPlaceholder>
                                <SelectValue />
                                <SelectIcon />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectListbox>
                                    <For each={sortOptions}>
                                        {(option) => (
                                            <SelectOption value={option.value}>
                                                <SelectOptionText>{option.label}</SelectOptionText>
                                                <SelectOptionIndicator />
                                            </SelectOption>
                                        )}
                                    </For>
                                </SelectListbox>
                            </SelectContent>
                        </Select>
                    </Box>
                </div>

                {/* Clear Filters */}
                <Button
                    variant="outline"
                    colorScheme="danger"
                    size="sm"
                    onClick={() => {
                        setStatusFilter([]);
                        setTaskTypeFilter([]);
                        setSearchQuery('');
                        setSortBy('load-desc');
                    }}
                >
                    Clear All Filters
                </Button>
            </VStack>
        </Card>
    );

    const getUtilizationColor = (status: string) => {
        switch (status) {
            case 'critical': return '$danger9';
            case 'high': return '$warning9';
            case 'optimal': return '$success9';
            case 'low': return '$info9';
            default: return '$neutral9';
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'critical':
                return <Badge colorScheme="danger">Critical Overload</Badge>;
            case 'high':
                return <Badge colorScheme="warning">High Load</Badge>;
            case 'optimal':
                return <Badge colorScheme="success">Optimal Load</Badge>;
            case 'low':
                return <Badge colorScheme="info">Available Capacity</Badge>;
            default:
                return null;
        }
    };

    const getWorkloadBreakdown = (member: any) => {
        const activeTaskCount = member.details.tasks.total - member.details.tasks.completed;
        return (
            <Box class="grid grid-cols-2 gap-4">
                <Box>
                    <Text size="sm" color="$neutral11">Active Issues</Text>
                    <HStack spacing="$2" alignItems="baseline">
                        <Text fontWeight="medium">{member.activeIssues}</Text>
                        <Text size="xs" color="$neutral11">
                            with {activeTaskCount} pending tasks
                        </Text>
                    </HStack>
                </Box>
                <Box>
                    <Text size="sm" color="$neutral11">Task Completion</Text>
                    <HStack spacing="$2" alignItems="baseline">
                        <Text fontWeight="medium">
                            {((member.details.tasks.completed / Math.max(member.details.tasks.total, 1)) * 100).toFixed(1)}%
                        </Text>
                        <Text size="xs" color="$neutral11">
                            ({member.details.tasks.completed}/{member.details.tasks.total})
                        </Text>
                    </HStack>
                </Box>
                <Box>
                    <Text size="sm" color="$neutral11">Code Reviews</Text>
                    <HStack spacing="$2" alignItems="baseline">
                        <Text fontWeight="medium">{member.activePRs}</Text>
                        <Text size="xs" color="$neutral11">pending PRs</Text>
                    </HStack>
                </Box>
                <Box>
                    <Text size="sm" color="$neutral11">Weekly Activity</Text>
                    <HStack spacing="$2" alignItems="baseline">
                        <Text fontWeight="medium">{member.details.completedLastWeek}</Text>
                        <Text size="xs" color="$neutral11">completed items</Text>
                    </HStack>
                </Box>
            </Box>
        );
    };

    const getTaskTypeBreakdown = (member: any) => {
        return (
            <Box>
                <Text size="sm" color="$neutral11" mb="$2">Task Type Distribution</Text>
                <div class="grid grid-cols-4 gap-2">
                    <Box>
                        <Text size="xs" color="$neutral11">Features</Text>
                        <HStack spacing="$1" alignItems="baseline">
                            <Text fontWeight="medium" color="$success9">
                                {member.details.taskTypes.feature.count}
                            </Text>
                            <Text size="xs" color="$neutral11">
                                ({member.details.taskTypes.feature.completed} done)
                            </Text>
                        </HStack>
                    </Box>
                    <Box>
                        <Text size="xs" color="$neutral11">Bugs</Text>
                        <HStack spacing="$1" alignItems="baseline">
                            <Text fontWeight="medium" color="$danger9">
                                {member.details.taskTypes.bug.count}
                            </Text>
                            <Text size="xs" color="$neutral11">
                                ({member.details.taskTypes.bug.completed} fixed)
                            </Text>
                        </HStack>
                    </Box>
                    <Box>
                        <Text size="xs" color="$neutral11">Docs</Text>
                        <HStack spacing="$1" alignItems="baseline">
                            <Text fontWeight="medium" color="$info9">
                                {member.details.taskTypes.documentation.count}
                            </Text>
                            <Text size="xs" color="$neutral11">
                                ({member.details.taskTypes.documentation.completed} done)
                            </Text>
                        </HStack>
                    </Box>
                    <Box>
                        <Text size="xs" color="$neutral11">Other</Text>
                        <HStack spacing="$1" alignItems="baseline">
                            <Text fontWeight="medium" color="$neutral9">
                                {member.details.taskTypes.other.count}
                            </Text>
                            <Text size="xs" color="$neutral11">
                                ({member.details.taskTypes.other.completed} done)
                            </Text>
                        </HStack>
                    </Box>
                </div>
            </Box>
        );
    };

    const getWorkloadSummary = (member: any) => {
        return (
            <Box>
                <Text size="sm" color="$neutral11" mb="$2">Weekly Workload Distribution</Text>
                <div class="grid grid-cols-4 gap-2">
                    <Box>
                        <Text size="xs" color="$neutral11">Tasks</Text>
                        <Text fontWeight="medium" color="$primary9">
                            {member.details.taskWorkload.toFixed(1)}h
                        </Text>
                    </Box>
                    <Box>
                        <Text size="xs" color="$neutral11">Issues</Text>
                        <Text fontWeight="medium" color="$success9">
                            {member.details.issueWorkload.toFixed(1)}h
                        </Text>
                    </Box>
                    <Box>
                        <Text size="xs" color="$neutral11">PRs</Text>
                        <Text fontWeight="medium" color="$warning9">
                            {member.details.prWorkload.toFixed(1)}h
                        </Text>
                    </Box>
                    <Box>
                        <Text size="xs" color="$neutral11">Commits</Text>
                        <Text fontWeight="medium" color="$info9">
                            {member.details.commitWorkload.toFixed(1)}h
                        </Text>
                    </Box>
                </div>
            </Box>
        );
    };

    const getStatusDistributionSummary = (member: any) => {
        // Ambil semua issue yang aktif untuk member
        const memberIssues = member.details.issues || [];
        const totalIssues = memberIssues.length;
    
        type StatusKey = 'todo' | 'in progress' | 'review' | 'done' | 'backlog';
        
        // Inisialisasi default status counts
        const statusCounts = {
            'todo': 0,
            'in progress': 0,
            'review': 0,
            'done': 0,
            'backlog': 0
        };
    
        // Hitung status untuk setiap issue
        memberIssues.forEach((issue: any) => {
            // Dapatkan status dari project
            let status = 'unknown';
            for (const project of props.projects || []) {
                const projectIssue = project.issues.find((pi: any) => 
                    pi.number === issue.number && pi.repository === issue.repository.name
                );
                if (projectIssue?.status) {
                    status = projectIssue.status.toLowerCase();
                    break;
                }
            }
            
            // Increment counter untuk status yang dikenali
            if (status in statusCounts && isStatusKey(status)) {
                statusCounts[status]++;
            }
        });

        function isStatusKey(key: string): key is StatusKey {
            return key in statusCounts;
        }
    
        return (
            <Box>
                <Text size="sm" color="$neutral11" mb="$2">Project Status Distribution</Text>
                <div class="grid grid-cols-5 gap-2">
                    <Box>
                        <Text size="xs" color="$neutral11">Todo</Text>
                        <Text fontWeight="medium" color="$warning9">
                            {((statusCounts.todo / totalIssues) * 100).toFixed(1)}%
                        </Text>
                        <Text size="xs" color="$neutral11">({statusCounts.todo})</Text>
                    </Box>
                    <Box>
                        <Text size="xs" color="$neutral11">In Progress</Text>
                        <Text fontWeight="medium" color="$primary9">
                            {((statusCounts['in progress'] / totalIssues) * 100).toFixed(1)}%
                        </Text>
                        <Text size="xs" color="$neutral11">({statusCounts['in progress']})</Text>
                    </Box>
                    <Box>
                        <Text size="xs" color="$neutral11">Review</Text>
                        <Text fontWeight="medium" color="$purple9">
                            {((statusCounts.review / totalIssues) * 100).toFixed(1)}%
                        </Text>
                        <Text size="xs" color="$neutral11">({statusCounts.review})</Text>
                    </Box>
                    <Box>
                        <Text size="xs" color="$neutral11">Done</Text>
                        <Text fontWeight="medium" color="$success9">
                            {((statusCounts.done / totalIssues) * 100).toFixed(1)}%
                        </Text>
                        <Text size="xs" color="$neutral11">({statusCounts.done})</Text>
                    </Box>
                    <Box>
                        <Text size="xs" color="$neutral11">Backlog</Text>
                        <Text fontWeight="medium" color="$neutral9">
                            {((statusCounts.backlog / totalIssues) * 100).toFixed(1)}%
                        </Text>
                        <Text size="xs" color="$neutral11">({statusCounts.backlog})</Text>
                    </Box>
                </div>
            </Box>
        );
    };

    const getEfficiencyStats = (member: any) => {
        (window as any).DebugLogger.log('Member stats:', {
            member: member.member.login,
            avgTime: member.details.avgCompletionTime,
            completionRate: member.details.completionEfficiency
        });
        
        const avgTimePerTask = member.details.avgCompletionTime;
        const completionRate = member.details.completionEfficiency;

        // Helper function untuk mendapatkan warna berdasarkan completion time
        const getTimeColor = (time: number) => {
            if (time === 0) return '$neutral9';
            if (time <= 3) return '$success9';
            if (time <= 5) return '$warning9';
            return '$danger9';
        };

        // Helper function untuk mendapatkan warna berdasarkan completion rate
        const getRateColor = (rate: number) => {
            if (rate >= 80) return '$success9';
            if (rate >= 60) return '$warning9';
            return '$danger9';
        };

        return (
            <Box>
                <Text size="sm" color="$neutral11" mb="$2">Completion Metrics</Text>
                <div class="grid grid-cols-2 gap-4">
                    <Box>
                        <Text size="xs" color="$neutral11">Avg. Completion Time</Text>
                        <HStack spacing="$2" alignItems="baseline">
                            <Text fontWeight="medium" color={getTimeColor(avgTimePerTask)}>
                                {avgTimePerTask > 0 ? avgTimePerTask : 'N/A'}
                            </Text>
                            {avgTimePerTask > 0 && (
                                <Text size="xs" color="$neutral11">days/task</Text>
                            )}
                        </HStack>
                        {avgTimePerTask > 0 && (
                            <Text size="xs" color="$neutral11" mt="$1">
                                {avgTimePerTask <= 3 ? 'Fast completion' :
                                    avgTimePerTask <= 5 ? 'Moderate pace' :
                                        'Needs attention'}
                            </Text>
                        )}
                    </Box>

                    <Box>
                        <Text size="xs" color="$neutral11">Task Completion Rate</Text>
                        <HStack spacing="$2" alignItems="baseline">
                            <Text fontWeight="medium" color={getRateColor(completionRate)}>
                                {completionRate}%
                            </Text>
                        </HStack>
                        <Text size="xs" color="$neutral11" mt="$1">
                            {completionRate >= 80 ? 'High efficiency' :
                                completionRate >= 60 ? 'Average efficiency' :
                                    completionRate > 0 ? 'Low efficiency' :
                                        'No completed tasks'}
                        </Text>
                    </Box>
                </div>
            </Box>
        );
    };

    const getWorkloadRecommendation = (member: any) => {
        if (member.status === 'critical') {
            const tasksToRedistribute = Math.ceil(member.details.tasks.remaining * 0.3);
            const issuesToRedistribute = Math.ceil(member.activeIssues * 0.3);

            return (
                <Box mt="$2" p="$3" bgColor="$danger2" borderRadius="$md">
                    <Text size="sm" color="$danger11">
                        🚨 Workload Redistribution Needed:
                        <ul class="list-disc ml-4 mt-1">
                            {tasksToRedistribute > 0 && (
                                <li>Redistribute {tasksToRedistribute} pending tasks to available team members</li>
                            )}
                            {issuesToRedistribute > 0 && (
                                <li>Consider transferring {issuesToRedistribute} non-critical issues</li>
                            )}
                            {member.activePRs > 2 && (
                                <li>Request additional reviewers for {member.activePRs - 2} PRs</li>
                            )}
                            <li>Schedule a workload review meeting to discuss priorities</li>
                        </ul>
                    </Text>
                </Box>
            );
        }

        if (member.status === 'low') {
            const potentialNewTasks = Math.ceil((props.thresholds.OPTIMAL - member.estimatedHours) / 2);
            return (
                <Box mt="$2" p="$3" bgColor="$info2" borderRadius="$md">
                    <Text size="sm" color="$info11">
                        💡 Capacity Available:
                        <ul class="list-disc ml-4 mt-1">
                            <li>Can take on approximately {potentialNewTasks} new tasks</li>
                            <li>Available to assist with code reviews and PR discussions</li>
                            <li>Consider assigning documentation or technical debt tasks</li>
                            <li>Could mentor or pair program with team members</li>
                        </ul>
                    </Text>
                </Box>
            );
        }

        return null;
    };

    return (
        <Card>
            <div style={{'font-family': 'Figtree'}}>
                <div class="space-y-4">
                    <h2 class="text-2xl font-bold text-gray-800">Member Workload Analysis</h2>
                    {/* Filter Controls */}
                    <FilterControls />

                    {/* Results Summary */}
                    <Text size="sm" color="$neutral11" mb="$4">
                        Showing {filteredMembers().length} members
                        {statusFilter().length > 0 && ` with status: ${statusFilter().join(', ')}`}
                        {taskTypeFilter().length > 0 && ` working on: ${taskTypeFilter().join(', ')}`}
                    </Text>

                    <Card class="overflow-hidden">
                        <VStack spacing="$4" alignItems="stretch">
                            <For each={filteredMembers()}>
                                {(member) => (
                                    <Box
                                        p="$4"
                                        borderBottom="1px solid"
                                        borderColor="$neutral4"
                                        _hover={{ bgColor: '$neutral1' }}
                                    >
                                        {/* Member Header */}
                                        <HStack spacing="$4" mb="$4">
                                            <Avatar
                                                src={member.member.avatar_url}
                                                name={member.member.login}
                                                size="md"
                                            />
                                            <VStack alignItems="flex-start" spacing="$1" flex={1}>
                                                <Text size="lg" fontWeight="bold">
                                                    {member.member.login}
                                                </Text>
                                                <HStack spacing="$2">
                                                    {getStatusBadge(member.status)}
                                                    <Text size="sm" color="$neutral11">
                                                        {member.estimatedHours.toFixed(1)} hours/week
                                                    </Text>
                                                </HStack>
                                            </VStack>
                                        </HStack>

                                        <VStack spacing="$4" alignItems="stretch">
                                            {/* Utilization Bar */}
                                            <Box w="$full">
                                                <HStack justifyContent="space-between" mb="$2">
                                                    <Text size="sm" color="$neutral11">Weekly Utilization</Text>
                                                    <Text
                                                        size="sm"
                                                        fontWeight="medium"
                                                        color={getUtilizationColor(member.status)}
                                                    >
                                                        {member.utilizationPercentage.toFixed(1)}%
                                                    </Text>
                                                </HStack>
                                                <Box w="$full" h="$2" bg="$neutral3" borderRadius="$full" overflow="hidden">
                                                    <Box
                                                        w={`${Math.min(member.utilizationPercentage, 100)}%`}
                                                        h="$full"
                                                        bg={getUtilizationColor(member.status)}
                                                        transition="width 0.3s ease-in-out"
                                                    />
                                                </Box>
                                            </Box>

                                            {/* Current Workload */}
                                            {getWorkloadBreakdown(member)}

                                            {/* Task Type Distribution */}
                                            {getTaskTypeBreakdown(member)}

                                            {/* Workload Distribution */}
                                            {getWorkloadSummary(member)}

                                            {/* Status Distribution */}
                                            {getStatusDistributionSummary(member)}

                                            {/* Efficiency Metrics */}
                                            {getEfficiencyStats(member)}

                                            {/* Recommendations */}
                                            {getWorkloadRecommendation(member)}
                                        </VStack>
                                    </Box>
                                )}
                            </For>

                            {filteredMembers().length === 0 && (
                                <Box p="$4" textAlign="center" color="$neutral11">
                                    No members match the current filters
                                </Box>
                            )}
                        </VStack>
                    </Card>
                </div>
            </div>
        </Card>
    );
};