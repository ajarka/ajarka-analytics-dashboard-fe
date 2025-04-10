import { Component, createMemo } from 'solid-js';
import { Card } from '../UI/Card';
import { VStack, HStack, Text, Box } from '@hope-ui/solid'; 

interface CapacityPlanningProps {
    utilization: any[];
    thresholds: any;
    weeklyCapacity: number;
}

export const CapacityPlanning: Component<CapacityPlanningProps> = (props) => {
    const capacityStats = createMemo(() => {
        const totalCapacity = props.weeklyCapacity * props.utilization.length;
        const usedCapacity = props.utilization.reduce(
            (sum, member) => sum + member.estimatedHours,
            0
        );
        const availableCapacity = totalCapacity - usedCapacity;

        // Calculate distribution
        const criticalLoad = props.utilization.filter(m => m.status === 'critical').length;
        const highLoad = props.utilization.filter(m => m.status === 'high').length;
        const optimalLoad = props.utilization.filter(m => m.status === 'optimal').length;
        const lowLoad = props.utilization.filter(m => m.status === 'low').length;

        // Calculate potential capacity
        const potentialGain = lowLoad * (props.thresholds.OPTIMAL - props.thresholds.LOW);
        const potentialRelief = criticalLoad * (props.thresholds.CRITICAL - props.thresholds.HIGH);

        return {
            totalCapacity,
            usedCapacity,
            availableCapacity,
            utilizationRate: (usedCapacity / totalCapacity) * 100,
            distribution: { criticalLoad, highLoad, optimalLoad, lowLoad },
            potential: { gain: potentialGain, relief: potentialRelief }
        };
    });

    return (
        <Card>
            <div style={{'font-family': 'Figtree'}}>
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Capacity Planning</h2>

                {/* Overall Capacity */}
                <VStack spacing="$4" alignItems="stretch">
                    <Box>
                        <HStack justifyContent="space-between" mb="$2">
                            <Text>Team Capacity Utilization</Text>
                            <Text fontWeight="bold">{capacityStats().utilizationRate.toFixed(1)}%</Text>
                        </HStack>
                        <Box w="$full" h="$2" bg="$neutral3" borderRadius="$full" overflow="hidden">
                            <Box
                                w={`${capacityStats().utilizationRate}%`}
                                h="$full"
                                bg={capacityStats().utilizationRate > 90 ? '$danger9' :
                                    capacityStats().utilizationRate > 75 ? '$warning9' :
                                        '$success9'}
                                transition="width 0.3s ease-in-out"
                            />
                        </Box>
                    </Box>

                    {/* Capacity Details */}
                    <Box p="$4" bgColor="$neutral1" borderRadius="$lg">
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <VStack alignItems="flex-start">
                                <Text color="$neutral11">Total Capacity</Text>
                                <Text size="xl" fontWeight="bold">
                                    {capacityStats().totalCapacity.toFixed(1)} hours/week
                                </Text>
                            </VStack>
                            <VStack alignItems="flex-start">
                                <Text color="$neutral11">Used Capacity</Text>
                                <Text size="xl" fontWeight="bold" color="$primary9">
                                    {capacityStats().usedCapacity.toFixed(1)} hours/week
                                </Text>
                            </VStack>
                            <VStack alignItems="flex-start">
                                <Text color="$neutral11">Available Capacity</Text>
                                <Text size="xl" fontWeight="bold" color={
                                    capacityStats().availableCapacity < 0 ? '$danger9' : '$success9'
                                }>
                                    {capacityStats().availableCapacity.toFixed(1)} hours/week
                                </Text>
                            </VStack>
                        </div>
                    </Box>

                    {/* Distribution */}
                    <Box p="$4" bgColor="$neutral1" borderRadius="$lg">
                        <Text fontWeight="bold" mb="$4">Team Load Distribution</Text>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <VStack alignItems="center">
                                <Text size="3xl" color="$danger9" fontWeight="bold">
                                    {capacityStats().distribution.criticalLoad}
                                </Text>
                                <Text size="sm" color="$neutral11">Critical Load</Text>
                            </VStack>
                            <VStack alignItems="center">
                                <Text size="3xl" color="$warning9" fontWeight="bold">
                                    {capacityStats().distribution.highLoad}
                                </Text>
                                <Text size="sm" color="$neutral11">High Load</Text>
                            </VStack>
                            <VStack alignItems="center">
                                <Text size="3xl" color="$success9" fontWeight="bold">
                                    {capacityStats().distribution.optimalLoad}
                                </Text>
                                <Text size="sm" color="$neutral11">Optimal Load</Text>
                            </VStack>
                            <VStack alignItems="center">
                                <Text size="3xl" color="$info9" fontWeight="bold">
                                    {capacityStats().distribution.lowLoad}
                                </Text>
                                <Text size="sm" color="$neutral11">Low Load</Text>
                            </VStack>
                        </div>
                    </Box>

                    {/* Recommendations */}
                    <Box p="$4" bgColor="$warning2" borderRadius="$lg">
                        <Text fontWeight="bold" mb="$2" color="$warning11">
                            Capacity Planning Recommendations
                        </Text>
                        <VStack alignItems="stretch" spacing="$2">
                            {capacityStats().potential.relief > 0 && (
                                <Text size="sm" color="$warning11">
                                    • Team is near capacity ({capacityStats().utilizationRate.toFixed(1)}%). Consider hiring or adjusting project timelines
                                </Text>
                            )}
                            {capacityStats().distribution.lowLoad > props.utilization.length * 0.2 && (
                                <Text size="sm" color="$warning11">
                                    • High number of under-utilized members ({capacityStats().distribution.lowLoad}). Review task distribution strategy
                                </Text>
                            )}
                            {capacityStats().availableCapacity < 0 && (
                                <Text size="sm" color="$warning11">
                                    • Team is overallocated by {Math.abs(capacityStats().availableCapacity).toFixed(1)} hours/week. Immediate action required
                                </Text>
                            )}
                        </VStack>
                    </Box>

                    {/* Future Planning */}
                    <Box p="$4" bgColor="$info2" borderRadius="$lg">
                        <Text fontWeight="bold" mb="$2" color="$info11">
                            Future Capacity Planning
                        </Text>
                        <VStack alignItems="stretch" spacing="$2">
                            <Text size="sm" color="$info11">
                                • Maximum additional work capacity: {Math.max(0, capacityStats().availableCapacity).toFixed(1)} hours/week
                            </Text>
                            <Text size="sm" color="$info11">
                                • Recommended new tasks: {Math.floor(Math.max(0, capacityStats().availableCapacity) / 4)} issues of average complexity
                            </Text>
                            <Text size="sm" color="$info11">
                                • Optimal task distribution: {Math.ceil(capacityStats().totalCapacity / props.weeklyCapacity)} issues per member
                            </Text>
                        </VStack>
                    </Box>
                </VStack>
            </div>
        </Card>
    );
};