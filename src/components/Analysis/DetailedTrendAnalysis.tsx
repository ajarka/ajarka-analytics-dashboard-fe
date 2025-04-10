import { Component, onMount, onCleanup, createMemo } from 'solid-js';
import { Text, Box } from "@hope-ui/solid";
import { Card } from '../UI/Card';
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import type { ProjectChange } from '../../types/analysis';

interface DetailedTrendAnalysisProps {
    projectChanges: ProjectChange[];
}

export const DetailedTrendAnalysis: Component<DetailedTrendAnalysisProps> = (props) => {
    let chartDiv: HTMLDivElement | undefined;
    let root: am5.Root | undefined;

    const stats = createMemo(() => {
        if (!props.projectChanges?.length) {
            return {
                totalProjects: 0,
                improved: 0,
                declined: 0,
                avgProgress: 0,
                avgChange: 0,
                maxImprovement: 0
            };
        }

        const totalProjects = props.projectChanges.length;
        const improved = props.projectChanges.filter(p => p.change > 0).length;
        const avgProgress = props.projectChanges.reduce((acc, curr) => acc + curr.newProgress, 0) / totalProjects;
        const avgChange = props.projectChanges.reduce((acc, curr) => acc + curr.change, 0) / totalProjects;

        return {
            totalProjects,
            improved,
            declined: totalProjects - improved,
            avgProgress,
            avgChange,
            maxImprovement: Math.max(...props.projectChanges.map(p => p.change))
        };
    });

    const createChart = () => {
        (window as any).DebugLogger.log("All props: ", props);
        (window as any).DebugLogger.log("Creating chart with data:", props.projectChanges);
        
        if (!props.projectChanges?.length) {
            (window as any).DebugLogger.log("No project changes data available");
            return;
        }

        if (root) {
            root.dispose();
        }

        try {
            // Sort and prepare data first
            const sortedData = [...props.projectChanges]
                .sort((a, b) => b.newProgress - a.newProgress)
                .slice(0, 8)
                .map(project => ({
                    name: project.name,
                    oldProgress: project.oldProgress,
                    newProgress: project.newProgress,
                    change: project.change,
                    changeText: (project.change >= 0 ? "+" : "") + project.change.toFixed(1) + "%",
                    changeColor: project.change >= 0 ? "#10B981" : "#EF4444",
                    oldTasks: project.tasks.old.completed,
                    newTasks: project.tasks.new.completed,
                    totalTasks: project.tasks.new.total
                }));

            (window as any).DebugLogger.log("Prepared chart data:", sortedData);

            // Create root
            root = am5.Root.new(chartDiv!);
            root.setThemes([am5themes_Animated.new(root)]);

            // Create chart
            const chart = root.container.children.push(
                am5xy.XYChart.new(root, {
                    paddingRight: 25,
                    paddingLeft: 0,
                    layout: root.horizontalLayout
                })
            );

            // Create y-axis
            const yAxis = chart.yAxes.push(
                am5xy.CategoryAxis.new(root, {
                    categoryField: "name",
                    renderer: am5xy.AxisRendererY.new(root, {
                        minGridDistance: 30,
                        inversed: true
                    })
                })
            );

            // Create x-axis
            const xAxis = chart.xAxes.push(
                am5xy.ValueAxis.new(root, {
                    min: 0,
                    max: 100,
                    numberFormat: "#'%'",
                    renderer: am5xy.AxisRendererX.new(root, {
                        minGridDistance: 30
                    })
                })
            );

            // Create series for current progress
            const currentSeries = chart.series.push(
                am5xy.ColumnSeries.new(root, {
                    name: "Current Progress",
                    xAxis: xAxis,
                    yAxis: yAxis,
                    valueXField: "newProgress",
                    categoryYField: "name",
                    tooltip: am5.Tooltip.new(root, {
                        pointerOrientation: "horizontal",
                        labelText: "[bold]{categoryY}[/]\nCurrent: {valueX}%\nChange: {changeText}"
                    })
                })
            );

            currentSeries.columns.template.setAll({
                height: am5.percent(70),
                fillOpacity: 0.9,
                fill: am5.color("#3B82F6"),
                strokeOpacity: 0
            });

            // Create series for previous progress
            const previousSeries = chart.series.push(
                am5xy.ColumnSeries.new(root, {
                    name: "Previous Progress",
                    xAxis: xAxis,
                    yAxis: yAxis,
                    valueXField: "oldProgress",
                    categoryYField: "name",
                    clustered: true,
                    tooltip: am5.Tooltip.new(root, {
                        pointerOrientation: "horizontal",
                        labelText: "[bold]{categoryY}[/]\nPrevious: {valueX}%"
                    })
                })
            );

            previousSeries.columns.template.setAll({
                height: am5.percent(70),
                fillOpacity: 0.5,
                fill: am5.color("#94A3B8"),
                strokeOpacity: 0
            });

            // Add legend
            const legend = chart.children.push(am5.Legend.new(root, {
                centerY: am5.percent(50),
                y: am5.percent(50),
                layout: root.verticalLayout
            }));

            legend.data.setAll(chart.series.values);

            // Add labels for change percentage
            currentSeries.bullets.push((root) => {
                return am5.Bullet.new(root, {
                    locationX: 1,
                    sprite: am5.Label.new(root, {
                        text: "{changeText}",
                        centerY: am5.p50,
                        centerX: am5.p100,
                        populateText: true,
                        fill: am5.color("#000000")
                    })
                });
            });

            // Set data
            yAxis.data.setAll(sortedData);
            previousSeries.data.setAll(sortedData);
            currentSeries.data.setAll(sortedData);

            // Make stuff animate on load
            chart.appear(1000, 100);
            
        } catch (error) {
            (window as any).DebugLogger.error("Error creating chart:", error);
        }
    };

    onMount(() => {
        (window as any).DebugLogger.log("Component mounted, creating chart...");
        createChart();
    });

    onCleanup(() => {
        if (root) {
            (window as any).DebugLogger.log("Cleaning up chart...");
            root.dispose();
        }
    });

    return (
        <Card>
            <Text size="lg" fontWeight="$semibold" mb="$4">Project Progress Trends</Text>
            
            {/* Key Metrics */}
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Box class="bg-blue-50 p-4 rounded-lg">
                    <Text size="sm" color="$blue800">Overall Progress</Text>
                    <Text size="2xl" fontWeight="$bold" color="$blue900">
                        {stats().avgProgress.toFixed(1)}%
                    </Text>
                    <Text size="xs" color="$blue700">average across projects</Text>
                </Box>
                
                <Box class="bg-green-50 p-4 rounded-lg">
                    <Text size="sm" color="$green800">Improving Projects</Text>
                    <Text size="2xl" fontWeight="$bold" color="$green900">
                        {stats().improved}/{stats().totalProjects}
                    </Text>
                    <Text size="xs" color="$green700">showing positive change</Text>
                </Box>
                
                <Box class={`bg-${stats().avgChange >= 0 ? 'green' : 'red'}-50 p-4 rounded-lg`}>
                    <Text size="sm" color={`$${stats().avgChange >= 0 ? 'green' : 'red'}800`}>
                        Progress Change
                    </Text>
                    <Text size="2xl" fontWeight="$bold" color={`$${stats().avgChange >= 0 ? 'green' : 'red'}900`}>
                        {stats().avgChange >= 0 ? '+' : ''}{stats().avgChange.toFixed(1)}%
                    </Text>
                    <Text size="xs" color={`$${stats().avgChange >= 0 ? 'green' : 'red'}700`}>
                        average improvement
                    </Text>
                </Box>
                
                <Box class="bg-purple-50 p-4 rounded-lg">
                    <Text size="sm" color="$purple800">Best Progress</Text>
                    <Text size="2xl" fontWeight="$bold" color="$purple900">
                        +{stats().maxImprovement.toFixed(1)}%
                    </Text>
                    <Text size="xs" color="$purple700">highest improvement</Text>
                </Box>
            </div>

            {/* Chart */}
            {props.projectChanges?.length > 0 ? (
                <div class="h-[400px]" ref={chartDiv} />
            ) : (
                <div class="h-[400px] flex items-center justify-center bg-gray-50 rounded-lg">
                    <Text color="$neutral11">No project data available</Text>
                </div>
            )}
            
            {/* Chart Legend */}
            <Box mt="$4" p="$4" bg="$neutral50" rounded="$lg">
                <Text size="sm" color="$neutral800">
                    Comparing previous (gray) and current (blue) progress for top projects. 
                    Percentages show the overall change in progress.
                </Text>
            </Box>
        </Card>
    );
};