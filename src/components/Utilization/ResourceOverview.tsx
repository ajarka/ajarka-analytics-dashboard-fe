import { Component, createMemo } from 'solid-js';
import { Card } from '../UI/Card';
import { HStack, VStack, Text, Box } from '@hope-ui/solid';

interface ResourceOverviewProps {
    utilization: any[]; // Update with proper type
}

export const ResourceOverview: Component<ResourceOverviewProps> = (props) => {
    const stats = createMemo(() => {
        const total = props.utilization.length;
        const overloaded = props.utilization.filter(m => m.status === 'critical').length;
        const underutilized = props.utilization.filter(m => m.status === 'low').length;
        const optimal = props.utilization.filter(m => m.status === 'optimal').length;

        const avgUtilization = props.utilization.reduce(
            (sum, m) => sum + m.utilizationPercentage,
            0
        ) / total;

        return { total, overloaded, underutilized, optimal, avgUtilization };
    });

    return (
        <Card>
            <VStack spacing="$4" style={{'font-family': 'Figtree'}}>
                <h2 class="text-2xl font-bold text-gray-800">Resource Utilization Overview</h2>

                {/* Overall Stats */}
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <VStack alignItems="center" spacing="$2">
                            <Text color="$neutral11">Total Team Members</Text>
                            <Text size="3xl" fontWeight="bold" color="$primary9">
                                {stats().total}
                            </Text>
                        </VStack>
                    </Card>

                    <Card>
                        <VStack alignItems="center" spacing="$2">
                            <Text color="$neutral11">Average Utilization</Text>
                            <Text size="3xl" fontWeight="bold" color="$primary9">
                                {stats().avgUtilization.toFixed(1)}%
                            </Text>
                        </VStack>
                    </Card>

                    <Card>
                        <VStack alignItems="center" spacing="$2">
                            <Text color="$neutral11">Optimal Workload</Text>
                            <Text size="3xl" fontWeight="bold" color="$success9">
                                {stats().optimal}
                            </Text>
                            <Text size="sm" color="$neutral11">
                                members
                            </Text>
                        </VStack>
                    </Card>

                    <Card>
                        <VStack alignItems="center" spacing="$2" class="relative">
                            <Text color="$neutral11">Attention Needed</Text>
                            <HStack spacing="$4">
                                <VStack alignItems="center">
                                    <Text size="2xl" fontWeight="bold" color="$danger9">
                                        {stats().overloaded}
                                    </Text>
                                    <Text size="xs" color="$neutral11">Overloaded</Text>
                                </VStack>
                                <VStack alignItems="center">
                                    <Text size="2xl" fontWeight="bold" color="$warning9">
                                        {stats().underutilized}
                                    </Text>
                                    <Text size="xs" color="$neutral11">Underutilized</Text>
                                </VStack>
                            </HStack>
                        </VStack>
                    </Card>
                </div>

                {/* Recommendations */}
                <Card>
                    <Text size="lg" fontWeight="bold" mb="$4">Quick Recommendations</Text>
                    <VStack alignItems="stretch" spacing="$3">
                        {stats().overloaded > 0 && (
                            <Box p="$3" bgColor="$danger2" borderRadius="$md">
                                <Text color="$danger11">
                                    ⚠️ {stats().overloaded} team member(s) are overloaded and need workload rebalancing.
                                </Text>
                            </Box>
                        )}
                        {stats().underutilized > 0 && (
                            <Box p="$3" bgColor="$warning2" borderRadius="$md">
                                <Text color="$warning11">
                                    ℹ️ {stats().underutilized} team member(s) have capacity for additional tasks.
                                </Text>
                            </Box>
                        )}
                        {stats().avgUtilization > 80 && (
                            <Box p="$3" bgColor="$info2" borderRadius="$md">
                                <Text color="$info11">
                                    📈 Team is running at high capacity ({stats().avgUtilization.toFixed(1)}%). Consider hiring or adjusting project timelines.
                                </Text>
                            </Box>
                        )}
                        {stats().optimal === stats().total && (
                            <Box p="$3" bgColor="$success2" borderRadius="$md">
                                <Text color="$success11">
                                    ✅ Team workload is well balanced! Maintain current distribution patterns.
                                </Text>
                            </Box>
                        )}
                    </VStack>
                </Card>
            </VStack>
        </Card>
    );
};