import { Component, For, createSignal, createMemo, Show } from 'solid-js';
import {
    Box,
    Text,
    HStack,
    VStack,
    Input, 
    Button,
    Badge,
    Progress, 
    IconButton, 
    Tabs,
    TabList,
    Tab,
    TabPanel
} from '@hope-ui/solid';
import { exportToCSV } from '../../utils/exportUtils';
import { FaSolidChevronDown,  FaSolidFileExport } from 'solid-icons/fa';

interface MemberDataTableProps {
    utilization: any[];
    projects: any[];
}

const MemberDataTable: Component<MemberDataTableProps> = (props) => {
    const [searchQuery, setSearchQuery] = createSignal('');
    const [sortConfig, setSortConfig] = createSignal({ key: 'utilizationPercentage', direction: 'desc' });
    const [expandedRows, setExpandedRows] = createSignal<string[]>([]);
    const [selectedColumns] = createSignal([
        'member',
        'status',
        'utilizationPercentage',
        'tasks',
        'issues',
        'prs',
        'commits',
        'completionEfficiency',
        'avgCompletionTime'
    ]);

    const columns = [
        { key: 'member', label: 'Member', sortable: true, width: '150px' },
        // { key: 'status', label: 'Status', sortable: true, width: '90px' },
        { key: 'utilizationPercentage', label: 'Utilization', sortable: true, width: '150px' },
        { key: 'utilizationBreakdown', label: 'Utilization Breakdown', sortable: false, width: '200px' },
        { key: 'tasks', label: 'Tasks', sortable: true, width: '100px' },
        { key: 'issues', label: 'Issues', sortable: true, width: '100px' },
        { key: 'prs', label: 'PRs', sortable: true, width: '100px' },
        { key: 'commits', label: 'Commits', sortable: true, width: '100px' },
        { key: 'completionEfficiency', label: 'Efficiency', sortable: true, width: '100px' },
        { key: 'avgCompletionTime', label: 'Avg Time', sortable: true, width: '100px' }
    ];

    const filteredAndSortedData = createMemo(() => {
        let data = [...props.utilization];

        // Apply search filter
        if (searchQuery()) {
            const query = searchQuery().toLowerCase();
            data = data.filter(member =>
                member.member.login.toLowerCase().includes(query)
            );
        }

        // Apply sorting
        const { key, direction } = sortConfig();
        data.sort((a, b) => {
            if (key === 'member') {
                return direction === 'asc'
                    ? a.member.login.localeCompare(b.member.login)
                    : b.member.login.localeCompare(a.member.login);
            }
            if (key === 'status') {
                return direction === 'asc'
                    ? a.status.localeCompare(b.status)
                    : b.status.localeCompare(a.status);
            }
            return direction === 'asc'
                ? a[key] - b[key]
                : b[key] - a[key];
        });

        return data;
    });

    const handleSort = (key: string) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'critical': return 'danger';
            case 'high': return 'warning';
            case 'optimal': return 'success';
            case 'low': return 'info';
            default: return 'neutral';
        }
    };
 

    const exportData = () => {
        const headers = selectedColumns().map(col => 
            columns.find(c => c.key === col)?.label || col
        );
        
        const data = filteredAndSortedData().map(member => {
            const row: any = {};
            selectedColumns().forEach(col => {
                if (col === 'member') {
                    row[col] = member.member.login;
                } else if (col === 'status') {
                    row[col] = member.status;
                } else if (col === 'tasks') {
                    row[col] = member.details.tasks.total;
                } else if (col === 'issues') {
                    row[col] = member.activeIssues;
                } else if (col === 'prs') {
                    row[col] = member.activePRs;
                } else if (col === 'commits') {
                    row[col] = member.details.commitWorkload;
                } else if (col === 'completionEfficiency') {
                    row[col] = member.details.completionEfficiency;
                } else if (col === 'avgCompletionTime') {
                    row[col] = member.details.avgCompletionTime;
                } else {
                    row[col] = member[col];
                }
            });
            return row;
        });

        exportToCSV(data, headers, 'member_data');
    };

    const toggleRowExpand = (memberId: string) => {
        setExpandedRows(prev => 
            prev.includes(memberId) 
                ? prev.filter(id => id !== memberId)
                : [...prev, memberId]
        );
    };

    const isRowExpanded = (memberId: string) => expandedRows().includes(memberId);

    // Add utility function for progress bar colors
    const getProgressBarColor = (value: number, type: 'utilization' | 'efficiency' | 'time' | 'tasks' | 'issues' | 'prs' | 'commits' = 'utilization') => {
        switch (type) {
            case 'utilization':
                return value >= 90 ? '#DC2626' : // red-600
                       value >= 70 ? '#F59E0B' : // amber-500
                       value >= 40 ? '#10B981' : // emerald-500
                       '#3B82F6'; // blue-500
            case 'efficiency':
                return value >= 80 ? '#10B981' : // emerald-500
                       value >= 60 ? '#3B82F6' : // blue-500
                       value >= 40 ? '#F59E0B' : // amber-500
                       '#DC2626'; // red-600
            case 'time':
                return value <= 3 ? '#10B981' : // emerald-500
                       value <= 7 ? '#3B82F6' : // blue-500
                       value <= 10 ? '#F59E0B' : // amber-500
                       '#DC2626'; // red-600
            default:
                return '#3B82F6'; // blue-500
        }
    };

    return (
        <Box
            class="rounded-xl overflow-hidden shadow-lg bg-gradient-to-br from-slate-50 to-white dark:from-neutral-900 dark:to-neutral-800 border border-neutral-200/50 dark:border-neutral-700/50"
            style={{ 'font-family': 'Figtree' }}
        >
            <Box p="$6" class="border-b border-neutral-200/70 dark:border-neutral-700/70">
                <VStack spacing="$6" alignItems="stretch">
                    <HStack justifyContent="space-between" alignItems="center" class="flex-col md:flex-row gap-4">
                        <Text 
                            size="2xl"
                            fontWeight="$bold" 
                            class="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500"
                        >
                            Member Activity Overview
                        </Text>
                        
                        <HStack spacing="$4" class="w-full md:w-auto justify-end">
                            <div class="relative flex-1 md:flex-none md:w-80">
                                {/* <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <FaSolidMagnifyingGlass class="w-4 h-4 text-neutral-400" />
                                </div> */}
                                <Input
                                    placeholder="Search members..."
                                    value={searchQuery()}
                                    onInput={(e: any) => setSearchQuery(e.target.value)}
                                    class="pl-11 pr-4 py-2.5 w-full bg-white dark:bg-neutral-800 border-2 border-neutral-200/70 dark:border-neutral-700/70 rounded-2xl text-sm transition-all duration-200 shadow-sm
                                    focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:ring-blue-400/20 dark:focus:border-blue-400
                                    hover:border-blue-500/50 dark:hover:border-blue-400/50"
                                    size="sm"
                                />
                            </div>

                            <Button style="height: 32px; font-size: smaller;background: linear-gradient(45deg, #1c5bec, #06e7cc);"
                                onClick={exportData}
                                class="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-105 hover:shadow-lg whitespace-nowrap"
                            >
                                <FaSolidFileExport class="w-4 h-4" />
                                Export Data
                            </Button>
                        </HStack>
                    </HStack>
                </VStack>
            </Box>

            <Box class="w-full">
                <table class="w-full border-collapse table-fixed">
                    <thead>
                        <tr class="bg-gradient-to-r from-slate-100 to-blue-50 dark:from-neutral-800 dark:to-blue-900/20">
                            <th class="w-10 px-2 py-4"></th>
                            <For each={columns}>
                                {(column) => (
                                    <th
                                        class="px-3 py-4 text-left cursor-pointer hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-colors duration-150"
                                        style={{ width: column.width }}
                                    >
                                        <HStack 
                                            spacing="$2" 
                                            alignItems="center" 
                                            onClick={() => column.sortable && handleSort(column.key)}
                                            class="select-none"
                                        >
                                            <Text 
                                                size="sm" 
                                                class="font-semibold text-slate-700 dark:text-slate-200 truncate"
                                            >
                                                {column.label}
                                            </Text>
                                            {column.sortable && (
                                                <span class={`
                                                    text-slate-400 dark:text-slate-500 flex-shrink-0
                                                    ${sortConfig().key === column.key
                                                        ? sortConfig().direction === 'asc'
                                                            ? 'i-mdi-arrow-up'
                                                            : 'i-mdi-arrow-down'
                                                        : 'i-mdi-arrow-up-down'
                                                    }
                                                `}></span>
                                            )}
                                        </HStack>
                                    </th>
                                )}
                            </For>
                        </tr>
                    </thead>
                    <tbody>
                        <For each={filteredAndSortedData()}>
                            {(member) => (
                                <>
                                    <tr class="border-b border-neutral-200/50 dark:border-neutral-700/50 hover:bg-blue-50/30 dark:hover:bg-blue-900/20 transition-all duration-200">
                                        <td class="px-2 py-4 w-10">
                                            <IconButton
                                                aria-label="Toggle details"
                                                variant="ghost"
                                                colorScheme="neutral"
                                                class="rounded-full w-8 h-8 flex items-center justify-center hover:bg-blue-100/50 dark:hover:bg-blue-900/30"
                                                onClick={() => toggleRowExpand(member.member.login)}
                                            >
                                                <span class={`transform transition-transform duration-200 ${
                                                    isRowExpanded(member.member.login) ? 'rotate-180' : ''
                                                }`}>
                                                    <FaSolidChevronDown class="w-4 h-4" />
                                                </span>
                                            </IconButton>
                                        </td>

                                        {/* Member Column */}
                                        <td class="px-3 py-4" style={{ width: columns[0].width }}>
                                            <HStack spacing="$3" alignItems="center">
                                                <div class="relative flex-shrink-0">
                                                    <img
                                                        src={member.member.avatar_url}
                                                        alt={member.member.login}
                                                        class="w-10 h-10 rounded-full ring-2 ring-white dark:ring-neutral-800 shadow-md"
                                                    />
                                                </div>
                                                <Text size="sm" fontWeight="$medium" class="truncate">{member.member.login}</Text>
                                            </HStack>
                                        </td>

                                     

                                        {/* Utilization Column */}
                                        <td class="px-3 py-4" style={{ width: columns[1].width }}>
                                            <VStack spacing="$2" alignItems="flex-start">
                                                <Badge 
                                                    size="sm"
                                                    colorScheme={getStatusColor(member.status)}
                                                    class="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                                                >
                                                    {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                                                </Badge>
                                                <Text size="sm" fontWeight="$medium">
                                                    {member.utilizationPercentage.toFixed(1)}%
                                                </Text>
                                                <div class="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div 
                                                        class="h-full rounded-full transition-all duration-300 ease-in-out"
                                                        style={{
                                                            width: `${member.utilizationPercentage}%`,
                                                            "background-color": getProgressBarColor(member.utilizationPercentage, 'utilization')
                                                        }}
                                                    />
                                                </div>
                                            </VStack>
                                        </td>

                                        {/* Utilization Breakdown */}
                                        <td class="px-3 py-4" style={{ width: columns[2].width }}>
                                            <VStack spacing="$2" alignItems="stretch" class="w-48">
                                                <Box>
                                                    <HStack justifyContent="space-between" mb="$1">
                                                        <Text size="xs" color="$neutral11">Tasks</Text>
                                                        <Text size="xs" fontWeight="$medium">
                                                            {((member.details.taskWorkload / member.estimatedHours) * 100).toFixed(1)}%
                                                        </Text>
                                                    </HStack>
                                                    <div class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                        <div 
                                                            class="h-full rounded-full transition-all duration-300 ease-in-out"
                                                            style={{
                                                                width: `${(member.details.taskWorkload / member.estimatedHours) * 100}%`,
                                                                "background-color": getProgressBarColor((member.details.taskWorkload / member.estimatedHours) * 100, 'utilization')
                                                            }}
                                                        />
                                                    </div>
                                                </Box>
                                                <Box>
                                                    <HStack justifyContent="space-between" mb="$1">
                                                        <Text size="xs" color="$neutral11">Issues</Text>
                                                        <Text size="xs" fontWeight="$medium">
                                                            {((member.details.issueWorkload / member.estimatedHours) * 100).toFixed(1)}%
                                                        </Text>
                                                    </HStack>
                                                    <div class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                        <div 
                                                            class="h-full rounded-full transition-all duration-300 ease-in-out"
                                                            style={{
                                                                width: `${(member.details.issueWorkload / member.estimatedHours) * 100}%`,
                                                                "background-color": getProgressBarColor((member.details.issueWorkload / member.estimatedHours) * 100, 'utilization')
                                                            }}
                                                        />
                                                    </div>
                                                </Box>
                                                <Box>
                                                    <HStack justifyContent="space-between" mb="$1">
                                                        <Text size="xs" color="$neutral11">PRs & Commits</Text>
                                                        <Text size="xs" fontWeight="$medium">
                                                            {(((member.details.prWorkload + member.details.commitWorkload) / member.estimatedHours) * 100).toFixed(1)}%
                                                        </Text>
                                                    </HStack>
                                                    <div class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                        <div 
                                                            class="h-full rounded-full transition-all duration-300 ease-in-out"
                                                            style={{
                                                                width: `${((member.details.prWorkload + member.details.commitWorkload) / member.estimatedHours) * 100}%`,
                                                                "background-color": getProgressBarColor(((member.details.prWorkload + member.details.commitWorkload) / member.estimatedHours) * 100, 'utilization')
                                                            }}
                                                        />
                                                    </div>
                                                </Box>
                                            </VStack>
                                        </td>

                                        {/* Tasks Column */}
                                        <td class="px-3 py-4" style={{ width: columns[3].width }}>
                                            <VStack spacing="$2" alignItems="flex-start">
                                                <HStack spacing="$2" alignItems="baseline">
                                                    <Text size="sm" fontWeight="$medium">
                                                        {member.details.tasks.completed}/{member.details.tasks.total}
                                                    </Text>
                                                    <Text size="xs" color="$neutral11">tasks</Text>
                                                </HStack>
                                                <div class="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div 
                                                        class="h-full rounded-full transition-all duration-300 ease-in-out"
                                                        style={{
                                                            width: `${(member.details.tasks.completed / Math.max(member.details.tasks.total, 1)) * 100}%`,
                                                            "background-color": getProgressBarColor((member.details.tasks.completed / Math.max(member.details.tasks.total, 1)) * 100, 'tasks')
                                                        }}
                                                    />
                                                </div>
                                            </VStack>
                                        </td>

                                        {/* Issues Column */}
                                        <td class="px-3 py-4" style={{ width: columns[4].width }}>
                                            <VStack spacing="$2" alignItems="flex-start">
                                                <HStack spacing="$2" alignItems="baseline">
                                                    <Text size="sm" fontWeight="$medium">
                                                        {member.activeIssues}
                                                    </Text>
                                                    <Text size="xs" color="$neutral11">active</Text>
                                                </HStack>
                                                <div class="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div 
                                                        class="h-full rounded-full transition-all duration-300 ease-in-out"
                                                        style={{
                                                            width: `${(member.activeIssues / 10) * 100}%`,
                                                            "background-color": getProgressBarColor(member.activeIssues, 'issues')
                                                        }}
                                                    />
                                                </div>
                                            </VStack>
                                        </td>

                                        {/* PRs Column */}
                                        <td class="px-3 py-4" style={{ width: columns[5].width }}>
                                            <VStack spacing="$2" alignItems="flex-start">
                                                <HStack spacing="$2" alignItems="baseline">
                                                    <Text size="sm" fontWeight="$medium">
                                                        {member.activePRs}
                                                    </Text>
                                                    <Text size="xs" color="$neutral11">open</Text>
                                                </HStack>
                                                <div class="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div 
                                                        class="h-full rounded-full transition-all duration-300 ease-in-out"
                                                        style={{
                                                            width: `${(member.activePRs / 5) * 100}%`,
                                                            "background-color": getProgressBarColor(member.activePRs, 'prs')
                                                        }}
                                                    />
                                                </div>
                                            </VStack>
                                        </td>

                                        {/* Commits Column */}
                                        <td class="px-3 py-4" style={{ width: columns[6].width }}>
                                            <VStack spacing="$2" alignItems="flex-start">
                                                <HStack spacing="$2" alignItems="baseline">
                                                    <Text size="sm" fontWeight="$medium">
                                                        {member.totalCommits}
                                                    </Text>
                                                    <Text size="xs" color="$neutral11">total</Text>
                                                </HStack>
                                                <div class="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div 
                                                        class="h-full rounded-full transition-all duration-300 ease-in-out"
                                                        style={{
                                                            width: `${(member.totalCommits / 50) * 100}%`,
                                                            "background-color": getProgressBarColor(member.totalCommits, 'commits')
                                                        }}
                                                    />
                                                </div>
                                            </VStack>
                                        </td>

                                        {/* Efficiency Column */}
                                        <td class="px-3 py-4" style={{ width: columns[7].width }}>
                                            <VStack spacing="$2" alignItems="flex-start">
                                                <HStack spacing="$2" alignItems="baseline">
                                                    <Text size="sm" fontWeight="$medium">
                                                        {member.details.completionEfficiency}%
                                                    </Text>
                                                    <Text size="xs" color="$neutral11">rate</Text>
                                                </HStack>
                                                <div class="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div 
                                                        class="h-full rounded-full transition-all duration-300 ease-in-out"
                                                        style={{
                                                            width: `${member.details.completionEfficiency}%`,
                                                            "background-color": getProgressBarColor(member.details.completionEfficiency, 'efficiency')
                                                        }}
                                                    />
                                                </div>
                                            </VStack>
                                        </td>

                                        {/* Average Time Column */}
                                        <td class="px-3 py-4" style={{ width: columns[8].width }}>
                                            <VStack spacing="$2" alignItems="flex-start">
                                                <HStack spacing="$2" alignItems="baseline">
                                                    <Text size="sm" fontWeight="$medium">
                                                        {member.details.avgCompletionTime.toFixed(1)}
                                                    </Text>
                                                    <Text size="xs" color="$neutral11">days</Text>
                                                </HStack>
                                                <div class="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div 
                                                        class="h-full rounded-full transition-all duration-300 ease-in-out"
                                                        style={{
                                                            width: `${(Math.min(member.details.avgCompletionTime, 14) / 14) * 100}%`,
                                                            "background-color": getProgressBarColor(member.details.avgCompletionTime, 'time')
                                                        }}
                                                    />
                                                </div>
                                            </VStack>
                                        </td>
                                    </tr>
                                    <Show when={isRowExpanded(member.member.login)}>
                                        <tr>
                                            <td colspan={columns.length + 1} class="bg-slate-50 dark:bg-neutral-800/30">
                                                <Box p="$6" class="animate-fadeIn">
                                                    <Tabs variant="pills" colorScheme="primary">
                                                        <TabList class="mb-6 gap-2 flex-wrap border-b border-neutral-200 dark:border-neutral-700 pb-4">
                                                            <Tab class="px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 bg-white dark:bg-neutral-800 shadow-sm hover:shadow-md">
                                                                <HStack spacing="$2">
                                                                    <i class="i-mdi-source-repository text-lg"></i>
                                                                    <span>Repository & Activity</span>
                                                                </HStack>
                                                            </Tab>
                                                            <Tab class="px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 bg-white dark:bg-neutral-800 shadow-sm hover:shadow-md">
                                                                <HStack spacing="$2">
                                                                    <i class="i-mdi-checkbox-marked-circle-outline text-lg"></i>
                                                                    <span>Tasks Overview</span>
                                                                </HStack>
                                                            </Tab>
                                                            <Tab class="px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 bg-white dark:bg-neutral-800 shadow-sm hover:shadow-md">
                                                                <HStack spacing="$2">
                                                                    <i class="i-mdi-source-pull text-lg"></i>
                                                                    <span>Issues & PRs</span>
                                                                </HStack>
                                                            </Tab>
                                                        </TabList>
                                                        
                                                        <TabPanel>
                                                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                <Box class="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg border border-neutral-200/50 dark:border-neutral-700/50">
                                                                    <HStack class="mb-4" spacing="$3">
                                                                        <div class="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                                                            <i class="i-mdi-source-repository text-2xl text-blue-600 dark:text-blue-400"></i>
                                                                        </div>
                                                                        <Text size="lg" fontWeight="$semibold" class="text-slate-800 dark:text-slate-200">
                                                                            Repository Activity
                                                                        </Text>
                                                                    </HStack>
                                                                    <VStack spacing="$4" alignItems="stretch">
                                                                        <For each={member.details.issues}>
                                                                            {(issue: any) => (
                                                                                <Box class="p-4 rounded-lg bg-gradient-to-br from-slate-50 to-white dark:from-neutral-800 dark:to-neutral-700 border border-neutral-200/50 dark:border-neutral-600/50 shadow-sm hover:shadow-md transition-all duration-200">
                                                                                    <HStack spacing="$4" alignItems="flex-start">
                                                                                        <Box class="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center shadow-inner">
                                                                                            <i class="i-mdi-git text-xl text-blue-600 dark:text-blue-400"></i>
                                                                                        </Box>
                                                                                        <VStack spacing="$2" alignItems="flex-start" class="flex-1">
                                                                                            <Text size="sm" fontWeight="$semibold" class="text-slate-800 dark:text-slate-200">
                                                                                                {issue.repository.name}
                                                                                            </Text>
                                                                                            <HStack spacing="$4" class="w-full">
                                                                                                <Box class="flex-1">
                                                                                                    <Text size="xs" color="$neutral11" mb="$1">Activity Level</Text>
                                                                                                    <Progress
                                                                                                        value={Math.random() * 100} // Replace with actual activity metric
                                                                                                        size="xs"
                                                                                                        class="rounded-full"
                                                                                                        colorScheme="cyan"
                                                                                                    />
                                                                                                </Box>
                                                                                                <VStack spacing="$1" alignItems="flex-end">
                                                                                                    <Text size="xs" color="$neutral11">Last Updated</Text>
                                                                                                    <Text size="xs" fontWeight="$medium">
                                                                                                        {new Date(issue.updated_at).toLocaleDateString()}
                                                                                                    </Text>
                                                                                                </VStack>
                                                                                            </HStack>
                                                                                        </VStack>
                                                                                    </HStack>
                                                                                </Box>
                                                                            )}
                                                                        </For>
                                                                    </VStack>
                                                                </Box>

                                                                <Box class="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg border border-neutral-200/50 dark:border-neutral-700/50">
                                                                    <HStack class="mb-6" spacing="$3">
                                                                        <div class="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                                                                            <i class="i-mdi-chart-timeline-variant text-2xl text-emerald-600 dark:text-emerald-400"></i>
                                                                        </div>
                                                                        <Text size="lg" fontWeight="$semibold" class="text-slate-800 dark:text-slate-200">
                                                                            Activity Stats
                                                                        </Text>
                                                                    </HStack>
                                                                    <div class="grid grid-cols-2 gap-4">
                                                                        <Box class="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-100 dark:border-blue-800/50">
                                                                            <VStack spacing="$1">
                                                                                <Text size="xs" color="$neutral11">Total Commits</Text>
                                                                                <Text size="2xl" fontWeight="$bold" class="text-blue-600 dark:text-blue-400">
                                                                                    {member.totalCommits}
                                                                                </Text>
                                                                                <Text size="xs" color="$neutral11">Last 30 days</Text>
                                                                            </VStack>
                                                                        </Box>
                                                                        <Box class="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-100 dark:border-purple-800/50">
                                                                            <VStack spacing="$1">
                                                                                <Text size="xs" color="$neutral11">Active PRs</Text>
                                                                                <Text size="2xl" fontWeight="$bold" class="text-purple-600 dark:text-purple-400">
                                                                                    {member.activePRs}
                                                                                </Text>
                                                                                <Text size="xs" color="$neutral11">In Review</Text>
                                                                            </VStack>
                                                                        </Box>
                                                                        <Box class="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-100 dark:border-emerald-800/50">
                                                                            <VStack spacing="$1">
                                                                                <Text size="xs" color="$neutral11">Completion Rate</Text>
                                                                                <Text size="2xl" fontWeight="$bold" class="text-emerald-600 dark:text-emerald-400">
                                                                                    {member.details.completionEfficiency}%
                                                                                </Text>
                                                                                <Text size="xs" color="$neutral11">Tasks Completed</Text>
                                                                            </VStack>
                                                                        </Box>
                                                                        <Box class="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-100 dark:border-amber-800/50">
                                                                            <VStack spacing="$1">
                                                                                <Text size="xs" color="$neutral11">Avg Time</Text>
                                                                                <Text size="2xl" fontWeight="$bold" class="text-amber-600 dark:text-amber-400">
                                                                                    {member.details.avgCompletionTime.toFixed(1)}d
                                                                                </Text>
                                                                                <Text size="xs" color="$neutral11">Per Task</Text>
                                                                            </VStack>
                                                                        </Box>
                                                                    </div>
                                                                </Box>
                                                            </div>
                                                        </TabPanel>

                                                        <TabPanel>
                                                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                <Box class="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg border border-neutral-200/50 dark:border-neutral-700/50">
                                                                    <HStack class="mb-6" spacing="$3">
                                                                        <div class="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                                                                            <i class="i-mdi-chart-pie text-2xl text-violet-600 dark:text-violet-400"></i>
                                                                        </div>
                                                                        <Text size="lg" fontWeight="$semibold" class="text-slate-800 dark:text-slate-200">
                                                                            Task Distribution
                                                                        </Text>
                                                                    </HStack>
                                                                    <VStack spacing="$6" alignItems="stretch">
                                                                        <For each={Object.entries(member.details.taskTypes)}>
                                                                            {([type, data]: [string, any]) => (
                                                                                <Box class="bg-slate-50 dark:bg-neutral-700/30 rounded-lg p-4">
                                                                                    <HStack justifyContent="space-between" mb="$2">
                                                                                        <HStack spacing="$2">
                                                                                            <div class={`w-3 h-3 rounded-full ${
                                                                                                type === 'bug' ? 'bg-red-500' :
                                                                                                type === 'feature' ? 'bg-blue-500' :
                                                                                                type === 'documentation' ? 'bg-amber-500' : 'bg-neutral-500'
                                                                                            }`}></div>
                                                                                            <Text size="sm" class="capitalize font-medium">
                                                                                                {type}
                                                                                            </Text>
                                                                                        </HStack>
                                                                                        <Text size="sm" fontWeight="$medium">
                                                                                            {data.completed}/{data.count}
                                                                                        </Text>
                                                                                    </HStack>
                                                                                    <Progress
                                                                                        value={(data.completed / data.count) * 100}
                                                                                        size="sm"
                                                                                        class="rounded-full"
                                                                                        colorScheme={
                                                                                            type === 'bug' ? 'danger' :
                                                                                            type === 'feature' ? 'primary' :
                                                                                            type === 'documentation' ? 'warning' : 'neutral'
                                                                                        }
                                                                                    />
                                                                                    <HStack justifyContent="space-between" mt="$2">
                                                                                        <Text size="xs" color="$neutral11">Completion Rate</Text>
                                                                                        <Text size="xs" fontWeight="$medium">
                                                                                            {((data.completed / data.count) * 100).toFixed(1)}%
                                                                                        </Text>
                                                                                    </HStack>
                                                                                </Box>
                                                                            )}
                                                                        </For>
                                                                    </VStack>
                                                                </Box>

                                                                <Box class="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg border border-neutral-200/50 dark:border-neutral-700/50">
                                                                    <HStack class="mb-6" spacing="$3">
                                                                        <div class="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
                                                                            <i class="i-mdi-clock-time-four text-2xl text-cyan-600 dark:text-cyan-400"></i>
                                                                        </div>
                                                                        <Text size="lg" fontWeight="$semibold" class="text-slate-800 dark:text-slate-200">
                                                                            Workload Breakdown
                                                                        </Text>
                                                                    </HStack>
                                                                    <VStack spacing="$6" alignItems="stretch">
                                                                        <Box class="bg-slate-50 dark:bg-neutral-700/30 rounded-lg p-4">
                                                                            <HStack justifyContent="space-between" mb="$2">
                                                                                <HStack spacing="$2">
                                                                                    <div class="w-3 h-3 rounded-full bg-blue-500"></div>
                                                                                        <Text size="sm" class="font-medium">Tasks</Text>
                                                                                </HStack>
                                                                                <Text size="sm" fontWeight="$medium">
                                                                                    {member.details.taskWorkload.toFixed(1)}h
                                                                                </Text>
                                                                            </HStack>
                                                                            <Progress
                                                                                value={(member.details.taskWorkload / member.estimatedHours) * 100}
                                                                                size="sm"
                                                                                class="rounded-full"
                                                                                colorScheme="primary"
                                                                            />
                                                                            <HStack justifyContent="space-between" mt="$2">
                                                                                <Text size="xs" color="$neutral11">Of Total Workload</Text>
                                                                                <Text size="xs" fontWeight="$medium">
                                                                                    {((member.details.taskWorkload / member.estimatedHours) * 100).toFixed(1)}%
                                                                                </Text>
                                                                            </HStack>
                                                                        </Box>

                                                                        <Box class="bg-slate-50 dark:bg-neutral-700/30 rounded-lg p-4">
                                                                            <HStack justifyContent="space-between" mb="$2">
                                                                                <HStack spacing="$2">
                                                                                    <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
                                                                                        <Text size="sm" class="font-medium">Issues</Text>
                                                                                </HStack>
                                                                                <Text size="sm" fontWeight="$medium">
                                                                                    {member.details.issueWorkload.toFixed(1)}h
                                                                                </Text>
                                                                            </HStack>
                                                                            <Progress
                                                                                value={(member.details.issueWorkload / member.estimatedHours) * 100}
                                                                                size="sm"
                                                                                class="rounded-full"
                                                                                colorScheme="success"
                                                                            />
                                                                            <HStack justifyContent="space-between" mt="$2">
                                                                                <Text size="xs" color="$neutral11">Of Total Workload</Text>
                                                                                <Text size="xs" fontWeight="$medium">
                                                                                    {((member.details.issueWorkload / member.estimatedHours) * 100).toFixed(1)}%
                                                                                </Text>
                                                                            </HStack>
                                                                        </Box>

                                                                        <Box class="bg-slate-50 dark:bg-neutral-700/30 rounded-lg p-4">
                                                                            <HStack justifyContent="space-between" mb="$2">
                                                                                <HStack spacing="$2">
                                                                                    <div class="w-3 h-3 rounded-full bg-amber-500"></div>
                                                                                        <Text size="sm" class="font-medium">PRs & Commits</Text>
                                                                                </HStack>
                                                                                <Text size="sm" fontWeight="$medium">
                                                                                    {(member.details.prWorkload + member.details.commitWorkload).toFixed(1)}h
                                                                                </Text>
                                                                            </HStack>
                                                                            <Progress
                                                                                value={((member.details.prWorkload + member.details.commitWorkload) / member.estimatedHours) * 100}
                                                                                size="sm"
                                                                                class="rounded-full"
                                                                                colorScheme="warning"
                                                                            />
                                                                            <HStack justifyContent="space-between" mt="$2">
                                                                                <Text size="xs" color="$neutral11">Of Total Workload</Text>
                                                                                <Text size="xs" fontWeight="$medium">
                                                                                    {(((member.details.prWorkload + member.details.commitWorkload) / member.estimatedHours) * 100).toFixed(1)}%
                                                                                </Text>
                                                                            </HStack>
                                                                        </Box>
                                                                    </VStack>
                                                                </Box>
                                                            </div>
                                                        </TabPanel>

                                                        <TabPanel>
                                                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                <Box class="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg border border-neutral-200/50 dark:border-neutral-700/50">
                                                                    <HStack class="mb-6" spacing="$3">
                                                                        <div class="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/30">
                                                                            <i class="i-mdi-alert-circle-check text-2xl text-rose-600 dark:text-rose-400"></i>
                                                                        </div>
                                                                        <Text size="lg" fontWeight="$semibold" class="text-slate-800 dark:text-slate-200">
                                                                            Active Issues
                                                                        </Text>
                                                                    </HStack>
                                                                    <VStack spacing="$4" alignItems="stretch">
                                                                        <For each={member.details.issues.filter((i: any) => i.state === 'open')}>
                                                                            {(issue: any) => (
                                                                                <Box class="p-4 rounded-lg bg-gradient-to-br from-slate-50 to-white dark:from-neutral-800 dark:to-neutral-700 border border-neutral-200/50 dark:border-neutral-600/50 shadow-sm hover:shadow-md transition-all duration-200">
                                                                                    <VStack spacing="$3" alignItems="flex-start">
                                                                                        <Text size="sm" fontWeight="$medium" class="text-slate-800 dark:text-slate-200">
                                                                                            {issue.title}
                                                                                        </Text>
                                                                                        <HStack spacing="$2" class="flex-wrap gap-2">
                                                                                            <For each={issue.labels}>
                                                                                                {(label: string) => (
                                                                                                    <Badge
                                                                                                        size="sm"
                                                                                                        colorScheme={
                                                                                                            label.includes('bug') ? 'danger' :
                                                                                                            label.includes('feature') ? 'primary' :
                                                                                                            'neutral'
                                                                                                        }
                                                                                                        class="rounded-full px-3"
                                                                                                    >
                                                                                                        {label}
                                                                                                    </Badge>
                                                                                                )}
                                                                                            </For>
                                                                                        </HStack>
                                                                                        <HStack spacing="$4" class="w-full">
                                                                                            <Box class="flex-1">
                                                                                                <Text size="xs" color="$neutral11" mb="$1">Progress</Text>
                                                                                                <Progress
                                                                                                    value={Math.random() * 100} // Replace with actual progress
                                                                                                    size="xs"
                                                                                                    class="rounded-full"
                                                                                                    colorScheme="rose"
                                                                                                />
                                                                                            </Box>
                                                                                            <VStack spacing="$1" alignItems="flex-end">
                                                                                                <Text size="xs" color="$neutral11">Created</Text>
                                                                                                <Text size="xs" fontWeight="$medium">
                                                                                                    {new Date(issue.created_at).toLocaleDateString()}
                                                                                                </Text>
                                                                                            </VStack>
                                                                                        </HStack>
                                                                                    </VStack>
                                                                                </Box>
                                                                            )}
                                                                        </For>
                                                                    </VStack>
                                                                </Box>

                                                                <Box class="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg border border-neutral-200/50 dark:border-neutral-700/50">
                                                                    <HStack class="mb-6" spacing="$3">
                                                                        <div class="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                                                                            <i class="i-mdi-source-pull text-2xl text-purple-600 dark:text-purple-400"></i>
                                                                        </div>
                                                                        <Text size="lg" fontWeight="$semibold" class="text-slate-800 dark:text-slate-200">
                                                                            Pull Requests
                                                                        </Text>
                                                                    </HStack>
                                                                    <VStack spacing="$4" alignItems="stretch">
                                                                        <For each={member.details.issues.filter((i: any) => i.pull_request)}>
                                                                            {(pr: any) => (
                                                                                <Box class="p-4 rounded-lg bg-gradient-to-br from-slate-50 to-white dark:from-neutral-800 dark:to-neutral-700 border border-neutral-200/50 dark:border-neutral-600/50 shadow-sm hover:shadow-md transition-all duration-200">
                                                                                    <VStack spacing="$3" alignItems="flex-start">
                                                                                        <Text size="sm" fontWeight="$medium" class="text-slate-800 dark:text-slate-200">
                                                                                            {pr.title}
                                                                                        </Text>
                                                                                        <Badge
                                                                                            size="sm"
                                                                                            colorScheme={pr.state === 'open' ? 'warning' : 'success'}
                                                                                            class="rounded-full px-3"
                                                                                        >
                                                                                            {pr.state}
                                                                                        </Badge>
                                                                                        <HStack spacing="$4" class="w-full">
                                                                                            <Box class="flex-1">
                                                                                                <Text size="xs" color="$neutral11" mb="$1">Review Status</Text>
                                                                                                <Progress
                                                                                                    value={pr.state === 'open' ? 50 : 100} // Replace with actual review progress
                                                                                                    size="xs"
                                                                                                    class="rounded-full"
                                                                                                    colorScheme={pr.state === 'open' ? 'warning' : 'success'}
                                                                                                />
                                                                                            </Box>
                                                                                            <VStack spacing="$1" alignItems="flex-end">
                                                                                                <Text size="xs" color="$neutral11">Updated</Text>
                                                                                                <Text size="xs" fontWeight="$medium">
                                                                                                    {new Date(pr.updated_at).toLocaleDateString()}
                                                                                                </Text>
                                                                                            </VStack>
                                                                                        </HStack>
                                                                                    </VStack>
                                                                                </Box>
                                                                            )}
                                                                        </For>
                                                                    </VStack>
                                                                </Box>
                                                            </div>
                                                        </TabPanel>
                                                    </Tabs>
                                                </Box>
                                            </td>
                                        </tr>
                                    </Show>
                                </>
                            )}
                        </For>
                    </tbody>
                </table>
            </Box>
        </Box>
    );
};

export default MemberDataTable; 