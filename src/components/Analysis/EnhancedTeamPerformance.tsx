import { Component, createMemo } from 'solid-js';
import { VStack, HStack, Text, Box } from "@hope-ui/solid";
import { Card } from '../UI/Card';
import type { MemberChange } from '../../types/analysis';

interface EnhancedTeamPerformanceProps {
    memberChanges: MemberChange[];
}

export const EnhancedTeamPerformance: Component<EnhancedTeamPerformanceProps> = (props) => {
    const metrics = createMemo(() => {
        const total = props.memberChanges.length;
        const improved = props.memberChanges.filter(m => m.change > 0).length;
        const declined = props.memberChanges.filter(m => m.change < 0).length;
        const steady = total - improved - declined;
        const avgChange = props.memberChanges.reduce((acc, curr) => acc + curr.change, 0) / total;

        // Calculate completion rates
        const completionRates = props.memberChanges.map(m => ({
            member: m.name,
            rate: (m.tasks.new.completed / Math.max(m.tasks.new.total, 1)) * 100
        }));

        const avgCompletionRate = completionRates.reduce((acc, curr) => acc + curr.rate, 0) / total;

        return {
            summary: {
                total,
                improved,
                declined,
                steady,
                avgChange,
                avgCompletionRate
            },
            topPerformers: props.memberChanges
                .filter(m => m.change > 10)
                .sort((a, b) => b.change - a.change)
                .slice(0, 3),
            needsSupport: props.memberChanges
                .filter(m => m.change < -10)
                .sort((a, b) => a.change - b.change)
                .slice(0, 3)
        };
    });

    const getPerformanceStatus = (avgChange: number) => {
        if (avgChange >= 15) return { color: 'green', text: 'Excellent' };
        if (avgChange >= 5) return { color: 'blue', text: 'Good' };
        if (avgChange >= 0) return { color: 'yellow', text: 'Stable' };
        return { color: 'red', text: 'Needs Attention' };
    };

    const status = createMemo(() => getPerformanceStatus(metrics().summary.avgChange));

    return (
        <Card>
            <div class="mb-6">
                <Text size="lg" fontWeight="$semibold">Team Performance Overview</Text>
                <HStack spacing="$2" mt="$2">
                    <div class={`px-2 py-1 rounded-full text-sm font-medium bg-${status().color}-100 text-${status().color}-800`}>
                        {status().text}
                    </div>
                    <Text size="sm" color="$neutral11">
                        {metrics().summary.avgChange >= 0 ? 'Overall positive trend' : 'Requires attention'}
                    </Text>
                </HStack>
            </div>

            {/* Performance Metrics */}
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Box class="bg-blue-50 p-4 rounded-lg">
                    <Text size="sm" color="$blue800">Average Progress</Text>
                    <Text size="2xl" fontWeight="$bold" color="$blue900">
                        {metrics().summary.avgChange.toFixed(1)}%
                    </Text>
                    <Text size="xs" color="$blue700">team-wide change</Text>
                </Box>

                <Box class="bg-green-50 p-4 rounded-lg">
                    <Text size="sm" color="$green800">Task Completion</Text>
                    <Text size="2xl" fontWeight="$bold" color="$green900">
                        {metrics().summary.avgCompletionRate.toFixed(1)}%
                    </Text>
                    <Text size="xs" color="$green700">average rate</Text>
                </Box>

                <Box class="bg-purple-50 p-4 rounded-lg">
                    <Text size="sm" color="$purple800">Team Progress</Text>
                    <Text size="2xl" fontWeight="$bold" color="$purple900">
                        {metrics().summary.improved}/{metrics().summary.total}
                    </Text>
                    <Text size="xs" color="$purple700">members improved</Text>
                </Box>

                <Box class="bg-amber-50 p-4 rounded-lg">
                    <Text size="sm" color="$amber800">Needs Support</Text>
                    <Text size="2xl" fontWeight="$bold" color="$amber900">
                        {metrics().summary.declined}
                    </Text>
                    <Text size="xs" color="$amber700">members declining</Text>
                </Box>
            </div>

            {/* Performance Details */}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Top Performers */}
                {metrics().topPerformers.length > 0 && (
                    <div class="space-y-3">
                        <Text color="$green800" fontWeight="$medium">Top Performers</Text>
                        {metrics().topPerformers.map(member => (
                            <div class="bg-green-50 p-3 rounded-lg">
                                <HStack justifyContent="space-between" mb="$1">
                                    <Text fontWeight="$medium">{member.name}</Text>
                                    <Text color="$green700">+{member.change.toFixed(1)}%</Text>
                                </HStack>
                                <Text size="sm" color="$neutral11">
                                    Completed {member.tasks.new.completed} of {member.tasks.new.total} tasks
                                </Text>
                            </div>
                        ))}
                    </div>
                )}

                {/* Needs Support */}
                {metrics().needsSupport.length > 0 && (
                    <div class="space-y-3">
                        <Text color="$red800" fontWeight="$medium">Needs Support</Text>
                        {metrics().needsSupport.map(member => (
                            <div class="bg-red-50 p-3 rounded-lg">
                                <HStack justifyContent="space-between" mb="$1">
                                    <Text fontWeight="$medium">{member.name}</Text>
                                    <Text color="$red700">{member.change.toFixed(1)}%</Text>
                                </HStack>
                                <Text size="sm" color="$neutral11">
                                    {member.tasks.new.total - member.tasks.new.completed} tasks remaining
                                </Text>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Action Items */}
            <Box class="bg-blue-50 p-4 rounded-lg">
                <Text fontWeight="$medium" color="$blue800" mb="$3">
                    Recommended Actions
                </Text>
                <VStack spacing="$2" alignItems="stretch">
                    {metrics().needsSupport.length > 0 && (
                        <Text size="sm" color="$blue700">
                            • Schedule 1:1 meetings with {metrics().needsSupport.map(m => m.name).join(', ')} 
                            to identify blockers and provide support
                        </Text>
                    )}
                    {metrics().topPerformers.length > 0 && (
                        <Text size="sm" color="$blue700">
                            • Consider having {metrics().topPerformers[0].name} share best practices 
                            with the team to improve overall performance
                        </Text>
                    )}
                    {metrics().summary.steady > 0 && (
                        <Text size="sm" color="$blue700">
                            • Review workload distribution for {metrics().summary.steady} members 
                            showing stable performance
                        </Text>
                    )}
                </VStack>
            </Box>
        </Card>
    );
};