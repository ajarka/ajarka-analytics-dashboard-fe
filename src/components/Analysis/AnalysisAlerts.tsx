import { Component } from 'solid-js';
import { VStack, Text } from "@hope-ui/solid";
import { Alert, AlertDescription } from '@hope-ui/solid';
import type { AnalysisData } from '../../types/analysis';

interface AnalysisAlertsProps {
    summary: AnalysisData['summary'];
    memberChanges: AnalysisData['memberChanges'];
}

export const AnalysisAlerts: Component<AnalysisAlertsProps> = (props) => {
    return (
        <VStack spacing="$4">
            {props.summary.needsAttention > 0 && (
                <Alert status="error" w="$full">
                    <AlertDescription>
                        <Text fontWeight="$semibold" mb="$2">
                            {props.summary.needsAttention} members need attention
                        </Text>
                        <Text>
                            These members have shown significant decrease in activity and might need support. Average progress change: 
                            {props.memberChanges
                                .filter(m => m.activityLevel === 'Critical')
                                .reduce((acc, m) => acc + m.change, 0) / props.summary.needsAttention}%
                        </Text>
                    </AlertDescription>
                </Alert>
            )}

            <Alert status="success" w="$full">
                <AlertDescription>
                    <Text fontWeight="$semibold" mb="$2">
                        {props.summary.highPerformers} high performers identified
                    </Text>
                    <Text>
                        These members have shown exceptional progress and increased contributions.
                        Total contributions: {props.summary.totalNewPRs} PRs and {props.summary.totalNewCommits} commits.
                    </Text>
                </AlertDescription>
            </Alert>

            {props.summary.overallProgress < 0 && (
                <Alert status="warning" w="$full">
                    <AlertDescription>
                        <Text fontWeight="$semibold" mb="$2">
                            Overall Progress Declining
                        </Text>
                        <Text>
                            Team progress has decreased by {Math.abs(props.summary.overallProgress).toFixed(1)}%. 
                            Consider reviewing current processes and providing additional support.
                        </Text>
                    </AlertDescription>
                </Alert>
            )}
        </VStack>
    );
};