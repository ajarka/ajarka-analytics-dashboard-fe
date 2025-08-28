import { Component, createMemo, onMount, onCleanup } from 'solid-js';
import { Card } from '../UI/Card';
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import {
    Box,
    VStack,
    Text
} from "@hope-ui/solid";

interface SimpleUtilizationChartProps {
    utilization: any[];
}

export const SimpleUtilizationChart: Component<SimpleUtilizationChartProps> = (props) => {
    let chartDiv: HTMLDivElement | undefined;
    let root: am5.Root | undefined;

    const chartData = createMemo(() => {
        // Transform data for AmCharts clustered column format
        return props.utilization.map(member => ({
            member: member.name,
            tasks: member.tasks || 0,
            issues: member.issues || 0,
            prs: member.prs || 0,
            commits: member.commits || 0,
            utilization: member.utilization
        }));
    });

    const createChart = () => {
        if (!chartDiv) return;

        // Dispose existing chart if any
        if (root) {
            root.dispose();
        }

        root = am5.Root.new(chartDiv);
        root.setThemes([am5themes_Animated.new(root)]);

        const chart = root.container.children.push(
            am5xy.XYChart.new(root, {
                panX: false,
                panY: false,
                wheelX: "none",
                wheelY: "none",
                layout: root.verticalLayout,
                paddingLeft: 20,
                paddingRight: 20,
                paddingTop: 20,
                paddingBottom: 20
            })
        );

        // Create Y axis (values)
        const yAxis = chart.yAxes.push(
            am5xy.ValueAxis.new(root, {
                renderer: am5xy.AxisRendererY.new(root, {
                    minGridDistance: 30
                }),
                min: 0
            })
        );

        // Create X axis (categories - member names)
        const xAxis = chart.xAxes.push(
            am5xy.CategoryAxis.new(root, {
                categoryField: "member",
                renderer: am5xy.AxisRendererX.new(root, {
                    minGridDistance: 30,
                    cellStartLocation: 0.1,
                    cellEndLocation: 0.9
                }),
                tooltip: am5.Tooltip.new(root, {})
            })
        );

        // Style X axis labels
        xAxis.get("renderer").labels.template.setAll({
            rotation: -45,
            centerY: am5.p50,
            centerX: am5.p100,
            paddingRight: 15,
            fontSize: 12,
            fontWeight: "500",
            oversizedBehavior: "wrap",
            maxWidth: 1000
        });

        // Create series for Tasks
        const tasksSeries = chart.series.push(
            am5xy.ColumnSeries.new(root, {
                name: "Tasks",
                xAxis: xAxis,
                yAxis: yAxis,
                valueYField: "tasks",
                categoryXField: "member",
                clustered: true,
                tooltip: am5.Tooltip.new(root, {
                    labelText: "Tasks: {valueY}"
                })
            })
        );

        tasksSeries.columns.template.setAll({
            width: am5.percent(100),
            tooltipY: 0,
            strokeOpacity: 0,
            stroke: am5.color("#FFFFFF"),
            strokeWidth: 1
        });

        tasksSeries.set("fill", am5.color("#60A5FA")); // Blue

        // Create series for Issues
        const issuesSeries = chart.series.push(
            am5xy.ColumnSeries.new(root, {
                name: "Issues",
                xAxis: xAxis,
                yAxis: yAxis,
                valueYField: "issues",
                categoryXField: "member",
                clustered: true,
                tooltip: am5.Tooltip.new(root, {
                    labelText: "Issues: {valueY}"
                })
            })
        );

        issuesSeries.columns.template.setAll({
            width: am5.percent(100),
            tooltipY: 0,
            strokeOpacity: 0,
            stroke: am5.color("#FFFFFF"),
            strokeWidth: 1
        });

        issuesSeries.set("fill", am5.color("#34D399")); // Green

        // Create series for PRs
        const prsSeries = chart.series.push(
            am5xy.ColumnSeries.new(root, {
                name: "Pull Requests",
                xAxis: xAxis,
                yAxis: yAxis,
                valueYField: "prs",
                categoryXField: "member",
                clustered: true,
                tooltip: am5.Tooltip.new(root, {
                    labelText: "PRs: {valueY}"
                })
            })
        );

        prsSeries.columns.template.setAll({
            width: am5.percent(100),
            tooltipY: 0,
            strokeOpacity: 0,
            stroke: am5.color("#FFFFFF"),
            strokeWidth: 1
        });

        prsSeries.set("fill", am5.color("#A78BFA")); // Purple

        // Create series for Commits
        const commitsSeries = chart.series.push(
            am5xy.ColumnSeries.new(root, {
                name: "Commits",
                xAxis: xAxis,
                yAxis: yAxis,
                valueYField: "commits",
                categoryXField: "member",
                clustered: true,
                tooltip: am5.Tooltip.new(root, {
                    labelText: "Commits: {valueY}"
                })
            })
        );

        commitsSeries.columns.template.setAll({
            width: am5.percent(100),
            tooltipY: 0,
            strokeOpacity: 0,
            stroke: am5.color("#FFFFFF"),
            strokeWidth: 1
        });

        commitsSeries.set("fill", am5.color("#FB7185")); // Pink

        // Add legend
        const legend = chart.children.push(am5.Legend.new(root, {
            centerX: am5.percent(50),
            x: am5.percent(50),
            marginTop: 15,
            marginBottom: 5
        }));

        legend.data.setAll(chart.series.values);

        // Set data
        const data = chartData();
        xAxis.data.setAll(data);
        tasksSeries.data.setAll(data);
        issuesSeries.data.setAll(data);
        prsSeries.data.setAll(data);
        commitsSeries.data.setAll(data);

        // Make stuff animate on load
        chart.appear(1000, 100);
    };

    onMount(() => {
        createChart();
    });

    // Update chart when data changes
    createMemo(() => {
        const data = chartData();
        if (root) {
            createChart();
        }
        return data;
    });

    onCleanup(() => {
        root?.dispose();
    });

    return (
        <Card style={{ width: "100%", maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{'font-family': 'Figtree'}}>
                <VStack spacing="$4" class="w-full">
                    {/* Header */}
                    <Box class="w-full text-center">
                        <Text size="lg" fontWeight="$bold" class="mb-2">
                            📊 Team Activity Analysis
                        </Text>
                        <Text size="sm" color="$neutral11">
                            Clustered column chart showing tasks, issues, PRs and commits per member
                        </Text>
                    </Box>

                    {/* AmCharts Container */}
                    <Box class="w-full">
                        <div
                            ref={chartDiv}
                            class="w-full h-[600px]"
                        />
                        
                        {chartData().length === 0 && (
                            <div class="flex items-center justify-center p-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                <Text size="lg" color="$neutral11" style={{'font-family': 'Figtree'}}>
                                    No activity data available
                                </Text>
                            </div>
                        )}
                    </Box>

                </VStack>
            </div>
        </Card>
    );
};