import { Component, onMount, onCleanup, createMemo } from 'solid-js';
import { Card } from '../UI/Card';
import * as am5 from "@amcharts/amcharts5";
import * as am5percent from "@amcharts/amcharts5/percent";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import { Text, Box, HStack, Badge } from "@hope-ui/solid";
import type { EntityType } from '../../types/github';


interface StatusAnalysisProps {
    title: string;
    entityName: string;
    entityType: EntityType;
    issues: Array<{
        number: number;
        repository: { name: string };
        status: string;
    }>;
}

export const StatusDistributionAnalysis: Component<StatusAnalysisProps> = (props) => {
    let chartDiv: HTMLDivElement | undefined;
    let root: am5.Root | undefined;

    // Color mapping for statuses
    const getStatusColor = (status: string): string => {
        const statusColorMap: Record<string, string> = {
            'Backlog': '#9ca3af', // Gray
            'Todo': '#f59e0b',    // Yellow/Orange
            'In Progress': '#3b82f6', // Blue
            'In Review': '#8b5cf6',  // Purple
            'Done': '#10b981'     // Green
        };
        
        // Case-insensitive matching for robustness
        const normalizedStatus = status.toLowerCase();
        
        for (const [key, color] of Object.entries(statusColorMap)) {
            if (normalizedStatus === key.toLowerCase()) {
                return color;
            }
        }
        
        // Default color if no match
        return '#6b7280';
    };

    // Create data for chart
    const statusData = createMemo(() => {
        const totalIssues = props.issues.length;
        if (totalIssues === 0) return [];
        
        // Count occurrences of each status
        const statusCounts: Record<string, number> = {};
        
        props.issues.forEach(issue => {
    
            // Normalize status for proper grouping (handles case differences)
            let status = issue.status || 'Unknown';
            
            // Common status normalization
            if (status.toLowerCase() === 'backlog') status = 'Backlog';
            else if (status.toLowerCase() === 'todo') status = 'Todo';
            else if (status.toLowerCase().includes('progress')) status = 'In Progress';
            else if (status.toLowerCase().includes('review')) status = 'In Review';
            else if (status.toLowerCase() === 'done') status = 'Done';
            
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        
        // Format data for chart
        return Object.entries(statusCounts).map(([status, count]) => ({
            status,
            count,
            percent: (count / totalIssues) * 100,
            color: getStatusColor(status)
        })).sort((a, b) => {
            const order: { [key: string]: number } = {
                'Backlog': 1,
                'Todo': 2,
                'In Progress': 3,
                'In Review': 4,
                'Done': 5
            };
            
            return (order[a.status] || 99) - (order[b.status] || 99);
        });
    });

    const createChart = () => {
        if (!chartDiv) return;
        
        // Dispose existing chart if any
        if (root) {
            root.dispose();
        }
        
        const data = statusData();
        if (data.length === 0) return;
        
        // Create root element
        root = am5.Root.new(chartDiv);
        root.setThemes([am5themes_Animated.new(root)]);
        
        // Create chart
        const chart = root.container.children.push(
            am5percent.PieChart.new(root, {
                layout: root.verticalLayout,
                innerRadius: am5.percent(50)
            })
        );
        
        // Create series
        const series = chart.series.push(
            am5percent.PieSeries.new(root, {
                valueField: "count",
                categoryField: "status",
                alignLabels: false
            })
        );
        
        // Set slice colors based on status
        series.slices.template.adapters.add("fill", (fill, target) => {
            const dataItem = target.dataItem as any;
            if (dataItem?.dataContext) {
                return am5.color(dataItem.dataContext.color);
            }
            return fill;
        });
        
        // Style slices
        series.slices.template.setAll({
            stroke: am5.color(0xffffff),
            strokeWidth: 2,
            tooltipText: "{status}: {count} issues ({percent.formatNumber('#.0')}%)"
        });
        
        // Style labels
        series.labels.template.setAll({
            fontSize: 12,
            text: "{status}: {percent.formatNumber('#.0')}%",
            radius: 10
        });
        
        // Set data
        series.data.setAll(data);
        
        // Create legend
        const legend = chart.children.push(
            am5.Legend.new(root, {
                centerX: am5.percent(50),
                x: am5.percent(50),
                layout: root.horizontalLayout,
                height: am5.percent(20)
            })
        );
        
        // Style legend
        legend.labels.template.setAll({
            fontSize: 13,
            fontWeight: "500"
        });
        
        legend.data.setAll(series.dataItems);
        
        // Add center label with total count
        chart.children.unshift(
            am5.Label.new(root, {
                text: `${props.issues.length}\nTotal Issues`,
                fontSize: 18,
                fontWeight: "500",
                textAlign: "center",
                x: am5.percent(50),
                y: am5.percent(50),
                centerX: am5.percent(50),
                centerY: am5.percent(50)
            })
        );
        
        // Animate chart
        series.appear(1000, 100);
    };
    
    // Create summary table of status counts
    const StatusSummary = () => {
        const data = statusData();
        if (data.length === 0) return <Text>No issues available</Text>;
        
        return (
            <Box mt="$4">
                <Text size="sm" fontWeight="$semibold" mb="$2">Status Summary</Text>
                <div class="grid grid-cols-5 gap-4">
                    {data.map(item => (
                        <Box p="$2" bg={`${item.color}15`} borderLeft={`3px solid ${item.color}`} rounded="$sm">
                            <Text size="xs" color="$neutral11">{item.status}</Text>
                            <HStack justifyContent="space-between" alignItems="center">
                                <Text fontWeight="$bold">{item.count}</Text>
                                <Badge colorScheme={item.status === 'Done' ? 'success' : 'neutral'} size="sm">
                                    {item.percent.toFixed(1)}%
                                </Badge>
                            </HStack>
                        </Box>
                    ))}
                </div>
            </Box>
        );
    };

    // Get productivity score based on issue distribution
    const getCompletionStatus = createMemo(() => {
        const data = statusData();
        if (data.length === 0) return { score: 0, label: 'Not Available', color: '$neutral9' };
        
        const doneItem = data.find(item => item.status === 'Done');
        const donePercent = doneItem ? doneItem.percent : 0;
        
        const inReviewItem = data.find(item => item.status === 'In Review');
        const inReviewPercent = inReviewItem ? inReviewItem.percent : 0;
        
        const inProgressItem = data.find(item => item.status === 'In Progress');
        const inProgressPercent = inProgressItem ? inProgressItem.percent : 0;
        
        // Progressive score: Done items count fully, In Review count 50%, In Progress count 25%
        const score = donePercent + (inReviewPercent * 0.5) + (inProgressPercent * 0.25);
        
        if (score >= 75) return { score, label: 'Excellent', color: '$success9' };
        if (score >= 50) return { score, label: 'Good', color: '$primary9' };
        if (score >= 25) return { score, label: 'In Progress', color: '$warning9' };
        return { score, label: 'Needs Attention', color: '$danger9' };
    });

    onMount(() => {
        createChart();
    });

    onCleanup(() => {
        if (root) {
            root.dispose();
        }
    });

    return (
        <Card>
            <HStack justifyContent="space-between" alignItems="center" class="mt-2">
                <Text size="lg" fontWeight="$semibold">{props.title}</Text>
                <Badge
                    colorScheme={(() => {
                        const status = getCompletionStatus().label;
                        if (status === 'Excellent') return 'success';
                        if (status === 'Good') return 'primary';
                        if (status === 'In Progress') return 'warning';
                        return 'danger';
                    })()}
                >
                    {getCompletionStatus().label}
                </Badge>
            </HStack>
            
            <HStack spacing="$4" mb="$4">
                <Text color="$neutral11">
                    {props.entityType}: <strong>{props.entityName}</strong>
                </Text>
                <Text color="$neutral11">
                    Progress Score: <strong>{getCompletionStatus().score.toFixed(1)}%</strong>
                </Text>
            </HStack>
            
            <div class="h-[430px]" ref={chartDiv}></div>
            
            <StatusSummary />
        </Card>
    );
};