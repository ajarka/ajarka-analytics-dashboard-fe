import { Component } from 'solid-js';
import { VStack, Text, HStack, Box } from "@hope-ui/solid";
import { Card } from '../UI/Card';
import { 
    FaSolidArrowTrendUp, 
    FaSolidListCheck, 
    FaSolidCode, 
    FaSolidUsers 
} from 'solid-icons/fa';
import type { AnalysisData } from '../../types/analysis';

interface OverviewCardsProps {
    summary: AnalysisData['summary'];
}

export const OverviewCards: Component<OverviewCardsProps> = (props) => {
    return (
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Overall Progress Card */}
            <Card class="bg-gradient-to-br from-blue-50 to-white">
                <VStack spacing="$4" alignItems="stretch">
                    <HStack spacing="$4" justifyContent="space-between">
                        <Box p="$3" bg="$blue100" borderRadius="$lg">
                            <FaSolidArrowTrendUp class="w-6 h-6 text-blue-600" />
                        </Box>
                        <VStack alignItems="flex-end" spacing="$1">
                            <Text size="sm" color="$neutral11">Progress Change</Text>
                            <Text 
                                size="2xl" 
                                fontWeight="$bold"
                                color={props.summary.overallProgress >= 0 ? '$success11' : '$danger11'}
                            >
                                {props.summary.overallProgress >= 0 ? '+' : ''}{props.summary.overallProgress.toFixed(1)}%
                            </Text>
                        </VStack>
                    </HStack>

                    <VStack spacing="$2" alignItems="stretch">
                        <HStack justifyContent="space-between">
                            <Text size="sm" color="$neutral11">Issues Completed</Text>
                            <Text size="sm" fontWeight="$medium" color="$success11">
                                +{props.summary.totalCompletedIssues}
                            </Text>
                        </HStack>
                        <HStack justifyContent="space-between">
                            <Text size="sm" color="$neutral11">Tasks Progress</Text>
                            <Text size="sm" fontWeight="$medium" color="$primary11">
                                {((props.summary.taskProgress.completed / Math.max(props.summary.taskProgress.total, 1)) * 100).toFixed(1)}%
                            </Text>
                        </HStack>
                    </VStack>
                </VStack>
            </Card>

            {/* Task Completion Card */}
            <Card class="bg-gradient-to-br from-green-50 to-white">
                <VStack spacing="$4" alignItems="stretch">
                    <HStack spacing="$4" justifyContent="space-between">
                        <Box p="$3" bg="$success100" borderRadius="$lg">
                            <FaSolidListCheck class="w-6 h-6 text-green-600" />
                        </Box>
                        <VStack alignItems="flex-end" spacing="$1">
                            <Text size="sm" color="$neutral11">Tasks Completed</Text>
                            <Text size="2xl" fontWeight="$bold" color="$success11">
                                +{props.summary.taskProgress.change}
                            </Text>
                        </VStack>
                    </HStack>

                    <VStack spacing="$2" alignItems="stretch">
                        <HStack justifyContent="space-between">
                            <Text size="sm" color="$neutral11">Total Tasks</Text>
                            <Text size="sm" fontWeight="$medium">
                                {props.summary.taskProgress.completed}/{props.summary.taskProgress.total}
                            </Text>
                        </HStack>
                        <HStack justifyContent="space-between">
                            <Text size="sm" color="$neutral11">Completion Rate</Text>
                            <Text 
                                size="sm" 
                                fontWeight="$medium"
                                color={props.summary.taskProgress.change >= 0 ? '$success11' : '$danger11'}
                            >
                                {((props.summary.taskProgress.completed / Math.max(props.summary.taskProgress.total, 1)) * 100).toFixed(1)}%
                            </Text>
                        </HStack>
                    </VStack>
                </VStack>
            </Card>

            {/* Code Contributions Card */}
            <Card class="bg-gradient-to-br from-purple-50 to-white">
                <VStack spacing="$4" alignItems="stretch">
                    <HStack spacing="$4" justifyContent="space-between">
                        <Box p="$3" bg="$purple100" borderRadius="$lg">
                            <FaSolidCode class="w-6 h-6 text-purple-600" />
                        </Box>
                        <VStack alignItems="flex-end" spacing="$1">
                            <Text size="sm" color="$neutral11">New PRs</Text>
                            <Text size="2xl" fontWeight="$bold" color="$purple11">
                                +{props.summary.totalNewPRs}
                            </Text>
                        </VStack>
                    </HStack>

                    <VStack spacing="$2" alignItems="stretch">
                        <HStack justifyContent="space-between">
                            <Text size="sm" color="$neutral11">New Commits</Text>
                            <Text size="sm" fontWeight="$medium">
                                +{props.summary.totalNewCommits}
                            </Text>
                        </HStack>
                        <HStack justifyContent="space-between">
                            <Text size="sm" color="$neutral11">Active Contributors</Text>
                            <Text size="sm" fontWeight="$medium" color="$success11">
                                {props.summary.highPerformers}
                            </Text>
                        </HStack>
                    </VStack>
                </VStack>
            </Card>

            {/* Team Performance Card */}
            <Card class="bg-gradient-to-br from-amber-50 to-white">
                <VStack spacing="$4" alignItems="stretch">
                    <HStack spacing="$4" justifyContent="space-between">
                        <Box p="$3" bg="$warning100" borderRadius="$lg">
                            <FaSolidUsers class="w-6 h-6 text-amber-600" />
                        </Box>
                        <VStack alignItems="flex-end" spacing="$1">
                            <Text size="sm" color="$neutral11">High Performers</Text>
                            <Text size="2xl" fontWeight="$bold" color="$warning11">
                                {props.summary.highPerformers}
                            </Text>
                        </VStack>
                    </HStack>

                    <VStack spacing="$2" alignItems="stretch">
                        <HStack justifyContent="space-between">
                            <Text size="sm" color="$neutral11">Needs Attention</Text>
                            <Text 
                                size="sm" 
                                fontWeight="$medium"
                                color={props.summary.needsAttention > 0 ? '$danger11' : '$success11'}
                            >
                                {props.summary.needsAttention}
                            </Text>
                        </HStack>
                        <HStack justifyContent="space-between">
                            <Text size="sm" color="$neutral11">Overall Health</Text>
                            <Text 
                                size="sm" 
                                fontWeight="$medium"
                                color={props.summary.needsAttention === 0 ? '$success11' : '$warning11'}
                            >
                                {props.summary.needsAttention === 0 ? 'Good' : 'Needs Review'}
                            </Text>
                        </HStack>
                    </VStack>
                </VStack>
            </Card>
        </div>
    );
};