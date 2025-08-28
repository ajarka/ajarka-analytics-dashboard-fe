import { Component, createMemo, createSignal } from 'solid-js';
import { Card } from '../UI/Card';
import { UtilizationFilters } from './UtilizationFilters';
import { SimpleUtilizationChart } from './SimpleUtilizationChart';
import {
    Box,
    VStack,
    Text
} from "@hope-ui/solid";

interface CompactWorkloadChartProps {
    utilization: any[];
}

export const CompactWorkloadChart: Component<CompactWorkloadChartProps> = (props) => {
    // Filter states
    const [searchQuery, setSearchQuery] = createSignal("");
    const [workloadFilter, setWorkloadFilter] = createSignal<string[]>([]);
    const [sortBy, setSortBy] = createSignal("utilization-desc");

    const getWorkloadColor = (utilization: number) => {
        if (utilization >= 90) return "#EF4444"; // Red
        if (utilization >= 75) return "#F59E0B"; // Yellow  
        if (utilization >= 50) return "#10B981"; // Green
        return "#3B82F6"; // Blue
    };

    const getWorkloadCategory = (utilization: number) => {
        if (utilization >= 90) return "critical";
        if (utilization >= 75) return "high";
        if (utilization >= 50) return "optimal";
        return "low";
    };

    const getStatusText = (utilization: number) => {
        if (utilization >= 90) return "Critical";
        if (utilization >= 75) return "High Load";
        if (utilization >= 50) return "Optimal";
        return "Available";
    };

    const getStatusEmoji = (utilization: number) => {
        if (utilization >= 90) return "🔴";
        if (utilization >= 75) return "🟡";
        if (utilization >= 50) return "🟢";
        return "🔵";
    };

    const chartData = createMemo(() => {
        let data = props.utilization.map(member => ({
            name: member.member.login,
            utilization: Math.round(member.utilizationPercentage),
            avatar: member.member.avatar_url || `https://github.com/${member.member.login}.png`,
            tasks: member.details.tasks.total,
            issues: member.activeIssues,
            prs: member.activePRs,
            commits: member.totalCommits || 0,
            category: getWorkloadCategory(member.utilizationPercentage),
            color: getWorkloadColor(member.utilizationPercentage),
            status: getStatusText(member.utilizationPercentage),
            emoji: getStatusEmoji(member.utilizationPercentage)
        }));

        // Apply filters
        if (searchQuery()) {
            data = data.filter(item =>
                item.name.toLowerCase().includes(searchQuery().toLowerCase())
            );
        }

        if (workloadFilter().length > 0) {
            data = data.filter(item => workloadFilter().includes(item.category));
        }

        // Apply sorting
        switch (sortBy()) {
            case "utilization-desc":
                data.sort((a, b) => b.utilization - a.utilization);
                break;
            case "utilization-asc":
                data.sort((a, b) => a.utilization - b.utilization);
                break;
            case "tasks-desc":
                data.sort((a, b) => b.tasks - a.tasks);
                break;
            case "tasks-asc":
                data.sort((a, b) => a.tasks - b.tasks);
                break;
            case "name-asc":
                data.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case "name-desc":
                data.sort((a, b) => b.name.localeCompare(a.name));
                break;
        }

        return data;
    });

    const summary = createMemo(() => {
        const data = chartData();
        const total = data.length;
        const avgUtilization = data.reduce((sum, item) => sum + item.utilization, 0) / total;
        
        return {
            total,
            avgUtilization: avgUtilization.toFixed(1),
            critical: data.filter(item => item.utilization >= 90).length,
            high: data.filter(item => item.utilization >= 75 && item.utilization < 90).length,
            optimal: data.filter(item => item.utilization >= 50 && item.utilization < 75).length,
            available: data.filter(item => item.utilization < 50).length
        };
    });

    return (
        <Card>
            <div style={{'font-family': 'Figtree'}}>
                <VStack spacing="$6" class="w-full">
                    {/* Header */}
                    <Box class="w-full text-center">
                        <Text size="xl" fontWeight="$bold" class="mb-2">
                            📊 Team Workload Distribution
                        </Text>
                        <Text size="sm" color="$neutral11">
                            Real-time overview of team capacity and workload distribution
                        </Text>
                    </Box>

                    {/* Filters */}
                    <UtilizationFilters 
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        workloadFilter={workloadFilter}
                        setWorkloadFilter={setWorkloadFilter}
                        sortBy={sortBy}
                        setSortBy={setSortBy}
                    />

                    {/* Simple Bar Chart */}
                    <SimpleUtilizationChart utilization={chartData()} />

                    {/* Summary Stats */}
                    <Box class="w-full">
                        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 border border-blue-100 dark:border-gray-600">
                            <div class="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                                <div>
                                    <Text size="2xl" fontWeight="$bold" color="$primary9">
                                        {summary().total}
                                    </Text>
                                    <Text size="xs" color="$neutral11" style={{'font-family': 'Figtree'}}>
                                        Team Members
                                    </Text>
                                </div>
                                <div>
                                    <Text size="2xl" fontWeight="$bold" color={getWorkloadColor(parseFloat(summary().avgUtilization))}>
                                        {summary().avgUtilization}%
                                    </Text>
                                    <Text size="xs" color="$neutral11" style={{'font-family': 'Figtree'}}>
                                        Avg Utilization
                                    </Text>
                                </div>
                                <div>
                                    <Text size="2xl" fontWeight="$bold" color="$danger9">
                                        {summary().critical}
                                    </Text>
                                    <Text size="xs" color="$neutral11" style={{'font-family': 'Figtree'}}>
                                        🔴 Critical
                                    </Text>
                                </div>
                                <div>
                                    <Text size="2xl" fontWeight="$bold" color="$warning9">
                                        {summary().high}
                                    </Text>
                                    <Text size="xs" color="$neutral11" style={{'font-family': 'Figtree'}}>
                                        🟡 High Load
                                    </Text>
                                </div>
                                <div>
                                    <Text size="2xl" fontWeight="$bold" color="$success9">
                                        {summary().optimal}
                                    </Text>
                                    <Text size="xs" color="$neutral11" style={{'font-family': 'Figtree'}}>
                                        🟢 Optimal
                                    </Text>
                                </div>
                            </div>
                        </div>
                    </Box>

                    {/* Compact Member List */}
                    <Box class="w-full">
                        <Text size="lg" fontWeight="$semibold" class="mb-4">
                            Team Members Overview
                        </Text>

                        {/* Legend - Simple and Subtle */}
                        <div class="flex flex-wrap justify-center gap-6 p-3 text-xs text-gray-500 mb-4" style={{'font-family': 'Figtree'}}>
                            <div class="flex items-center space-x-1">
                                <span>📋</span>
                                <span>Tasks</span>
                            </div>
                            <div class="flex items-center space-x-1">
                                <span>🎫</span>
                                <span>Issues</span>
                            </div>
                            <div class="flex items-center space-x-1">
                                <span>🔀</span>
                                <span>Pull Requests</span>
                            </div>
                            <div class="flex items-center space-x-1">
                                <span>💾</span>
                                <span>Commits</span>
                            </div>
                        </div>

                        {/* Utilization Scale Reference */}
                        <Box class="w-full bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
                            <Text size="xs" color="$neutral11" class="mb-2" style={{'font-family': 'Figtree'}}>
                                Utilization Scale Reference:
                            </Text>
                            <div class="flex items-center space-x-1">
                                <div class="flex-1 bg-gradient-to-r from-blue-500 via-green-500 via-yellow-500 to-red-500 h-2 rounded-full"></div>
                            </div>
                            <div class="flex justify-between mt-1 text-xs text-gray-500" style={{'font-family': 'Figtree'}}>
                                <span>0%</span>
                                <span>50% (Optimal)</span>
                                <span>75% (High)</span>
                                <span>90% (Critical)</span>
                                <span>100%</span>
                            </div>
                        </Box>
                        
                        <div class="grid gap-3">
                            {chartData().map((member) => (
                                <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-200">
                                    <div class="flex items-center justify-between">
                                        {/* Left: Avatar + Name */}
                                        <div class="flex items-center space-x-3">
                                            <div class="relative">
                                                <img
                                                    src={member.avatar}
                                                    alt={member.name}
                                                    class="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-gray-600 object-cover"
                                                    onError={(e) => {
                                                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                                                        const fallback = e.currentTarget.nextElementSibling as HTMLDivElement;
                                                        if (fallback) fallback.style.display = 'flex';
                                                    }}
                                                />
                                                <div class="hidden w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-sm items-center justify-center">
                                                    {member.name.charAt(0).toUpperCase()}
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <Text size="sm" fontWeight="$semibold" style={{'font-family': 'Figtree'}}>
                                                    {member.name}
                                                </Text>
                                                <div class="flex items-center space-x-3 text-xs text-gray-500" style={{'font-family': 'Figtree'}}>
                                                    <span>📋 {member.tasks}</span>
                                                    <span>🎫 {member.issues}</span>
                                                    <span>🔀 {member.prs}</span>
                                                    <span>💾 {member.commits}</span>
                                                </div>
                                                <div class="mt-1">
                                                    <Text size="xs" color="$neutral11" style={{'font-family': 'Figtree'}}>
                                                        Est. {Math.round(member.utilization * 0.4)}h/week
                                                    </Text>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Center: Progress */}
                                        <div class="flex-1 mx-6 max-w-xs">
                                            <div class="flex items-center justify-between mb-1">
                                                <Text size="xs" color="$neutral11" style={{'font-family': 'Figtree'}}>
                                                    Workload
                                                </Text>
                                                <Text size="xs" fontWeight="$bold" style={{'color': member.color, 'font-family': 'Figtree'}}>
                                                    {member.utilization}%
                                                </Text>
                                            </div>
                                            
                                            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                                <div 
                                                    class="h-full rounded-full transition-all duration-300"
                                                    style={`width: ${Math.min(member.utilization, 100)}%; background: linear-gradient(90deg, ${member.color} 0%, ${member.color}dd 100%);`}
                                                />
                                            </div>
                                        </div>

                                        {/* Right: Status */}
                                        <div class="text-right">
                                            <div class={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                member.utilization >= 90 
                                                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                                member.utilization >= 75 
                                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                member.utilization >= 50 
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                                                    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                            }`} style={{'font-family': 'Figtree'}}>
                                                {member.emoji} {member.status}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {chartData().length === 0 && (
                            <div class="flex items-center justify-center p-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                <Text size="lg" color="$neutral11" style={{'font-family': 'Figtree'}}>
                                    No workload data available
                                </Text>
                            </div>
                        )}
                    </Box>

                    {/* Distribution Visual */}
                    <Box class="w-full">
                        <Text size="lg" fontWeight="$semibold" class="mb-4">
                            Workload Distribution
                        </Text>
                        
                        <div class="bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-full h-6 overflow-hidden">
                            <div class="flex h-full rounded-lg overflow-hidden">
                                {summary().critical > 0 && (
                                    <div 
                                        class="bg-red-500 transition-all duration-500 flex items-center justify-center"
                                        style={`width: ${(summary().critical / summary().total) * 100}%`}
                                        title={`${summary().critical} Critical Load Members`}
                                    >
                                        {(summary().critical / summary().total) * 100 >= 10 && (
                                            <Text size="xs" color="white" fontWeight="$bold">
                                                🔴
                                            </Text>
                                        )}
                                    </div>
                                )}
                                
                                {summary().high > 0 && (
                                    <div 
                                        class="bg-yellow-500 transition-all duration-500 flex items-center justify-center"
                                        style={`width: ${(summary().high / summary().total) * 100}%`}
                                        title={`${summary().high} High Load Members`}
                                    >
                                        {(summary().high / summary().total) * 100 >= 10 && (
                                            <Text size="xs" color="white" fontWeight="$bold">
                                                🟡
                                            </Text>
                                        )}
                                    </div>
                                )}
                                
                                {summary().optimal > 0 && (
                                    <div 
                                        class="bg-green-500 transition-all duration-500 flex items-center justify-center"
                                        style={`width: ${(summary().optimal / summary().total) * 100}%`}
                                        title={`${summary().optimal} Optimal Load Members`}
                                    >
                                        {(summary().optimal / summary().total) * 100 >= 10 && (
                                            <Text size="xs" color="white" fontWeight="$bold">
                                                🟢
                                            </Text>
                                        )}
                                    </div>
                                )}
                                
                                {summary().available > 0 && (
                                    <div 
                                        class="bg-blue-500 transition-all duration-500 flex items-center justify-center"
                                        style={`width: ${(summary().available / summary().total) * 100}%`}
                                        title={`${summary().available} Available Members`}
                                    >
                                        {(summary().available / summary().total) * 100 >= 10 && (
                                            <Text size="xs" color="white" fontWeight="$bold">
                                                🔵
                                            </Text>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Legend */}
                        <div class="flex flex-wrap justify-center gap-4 mt-3">
                            {summary().critical > 0 && (
                                <div class="flex items-center space-x-1">
                                    <div class="w-3 h-3 bg-red-500 rounded"></div>
                                    <Text size="xs" color="$neutral11" style={{'font-family': 'Figtree'}}>
                                        Critical ({summary().critical})
                                    </Text>
                                </div>
                            )}
                            {summary().high > 0 && (
                                <div class="flex items-center space-x-1">
                                    <div class="w-3 h-3 bg-yellow-500 rounded"></div>
                                    <Text size="xs" color="$neutral11" style={{'font-family': 'Figtree'}}>
                                        High Load ({summary().high})
                                    </Text>
                                </div>
                            )}
                            {summary().optimal > 0 && (
                                <div class="flex items-center space-x-1">
                                    <div class="w-3 h-3 bg-green-500 rounded"></div>
                                    <Text size="xs" color="$neutral11" style={{'font-family': 'Figtree'}}>
                                        Optimal ({summary().optimal})
                                    </Text>
                                </div>
                            )}
                            {summary().available > 0 && (
                                <div class="flex items-center space-x-1">
                                    <div class="w-3 h-3 bg-blue-500 rounded"></div>
                                    <Text size="xs" color="$neutral11" style={{'font-family': 'Figtree'}}>
                                        Available ({summary().available})
                                    </Text>
                                </div>
                            )}
                        </div>
                    </Box>
                </VStack>
            </div>
        </Card>
    );
};