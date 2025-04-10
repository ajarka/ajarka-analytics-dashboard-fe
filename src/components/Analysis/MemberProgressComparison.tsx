import { Component, onMount, onCleanup } from 'solid-js';
import { Text, VStack, HStack, Box } from "@hope-ui/solid";
import { Card } from '../UI/Card';
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import type { MemberChange } from '../../types/analysis';

interface MemberProgressComparisonProps {
    memberChanges: MemberChange[];
}

export const MemberProgressComparison: Component<MemberProgressComparisonProps> = (props) => {
    let chartDiv: HTMLDivElement | undefined;
    let root: am5.Root | undefined;

    const createChart = () => {
        if (!props.memberChanges.length) return;

        if (root) {
            root.dispose();
        }

        // Sort members by progress change
        const sortedData = [...props.memberChanges]
            .sort((a, b) => b.newProgress - a.newProgress)
            .slice(0, 10); // Show top 10 for better readability

        root = am5.Root.new(chartDiv!);
        root.setThemes([am5themes_Animated.new(root)]);

        const chart = root.container.children.push(
            am5xy.XYChart.new(root, {
                panX: false,
                panY: false,
                paddingRight: 20,
                paddingLeft: 0
            })
        );

        // Create Y axis
        const yRenderer = am5xy.AxisRendererY.new(root, {
            minGridDistance: 30,
            inversed: true
        });

        yRenderer.grid.template.set("visible", false);

        const yAxis = chart.yAxes.push(
            am5xy.CategoryAxis.new(root, {
                categoryField: "name",
                renderer: yRenderer,
                tooltip: am5.Tooltip.new(root, {})
            })
        );

        // Style Y axis labels
        yRenderer.labels.template.setAll({
            fontSize: 12,
            fill: am5.color("#374151"),
            fontWeight: "500"
        });

        // Create X axis
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

        // Create series
        const createSeries = (field: string, name: string, color: string) => {
            const series = chart.series.push(
                am5xy.ColumnSeries.new(root!, {
                    name: name,
                    xAxis: xAxis,
                    yAxis: yAxis,
                    valueXField: field,
                    categoryYField: "name",
                    sequencedInterpolation: true,
                    tooltip: am5.Tooltip.new(root!, {
                        pointerOrientation: "horizontal",
                        labelText: `[bold]{name}[/]
${name}: {${field}}%
Tasks: {${field === 'newProgress' ? 'newTasksCompleted' : 'oldTasksCompleted'}}/{${field === 'newProgress' ? 'newTasksTotal' : 'oldTasksTotal'}}
Change: {change}%`
                    })
                })
            );

            series.columns.template.setAll({
                height: am5.percent(70),
                fill: am5.color(color),
                fillOpacity: field === 'oldProgress' ? 0.5 : 0.9,
                strokeOpacity: 0
            });

            return series;
        };

        // Add series
        const previousSeries = createSeries("oldProgress", "Previous Progress", "#94A3B8");
        const currentSeries = createSeries("newProgress", "Current Progress", "#3B82F6");

        // Add legend
        const legend = chart.children.push(
            am5.Legend.new(root, {
                centerX: am5.percent(50),
                x: am5.percent(50),
                marginTop: 15,
                marginBottom: 15
            })
        );

        legend.data.setAll([currentSeries, previousSeries]);

        // Add change indicator labels
        currentSeries.bullets.push(function () {
            return am5.Bullet.new(root!, {
                locationX: 1,
                sprite: am5.Label.new(root!, {
                    centerY: am5.p50,
                    text: "{changeText}",
                    populateText: true,
                    fontSize: 12
                })
            });
        });

        // Prepare and set data
        const data = sortedData.map(member => ({
            name: member.name,
            oldProgress: member.oldProgress,
            newProgress: member.newProgress,
            change: member.change,
            changeText: (member.change >= 0 ? "+" : "") + member.change.toFixed(1) + "%",
            oldTasksCompleted: member.tasks.old.completed,
            oldTasksTotal: member.tasks.old.total,
            newTasksCompleted: member.tasks.new.completed,
            newTasksTotal: member.tasks.new.total
        }));

        yAxis.data.setAll(data);
        previousSeries.data.setAll(data);
        currentSeries.data.setAll(data);

        // Make stuff animate on load
        chart.appear(1000, 100);
    };

    onMount(() => {
        createChart();
    });

    onCleanup(() => {
        root?.dispose();
    });

    const getMemberStats = () => {
        const improved = props.memberChanges.filter(m => m.change > 0).length;
        const total = props.memberChanges.length;
        const avgChange = props.memberChanges.reduce((acc, curr) => acc + curr.change, 0) / total;
        const avgTaskCompletion = props.memberChanges.reduce((acc, curr) =>
            acc + (curr.tasks.new.completed / Math.max(curr.tasks.new.total, 1)) * 100, 0) / total;

        const topMembers = [...props.memberChanges]
            .sort((a, b) => b.change - a.change)
            .slice(0, 3);

        const needsAttention = [...props.memberChanges]
            .sort((a, b) => a.change - b.change)
            .slice(0, 3);

        return {
            improved,
            total,
            avgChange,
            avgTaskCompletion,
            topMembers,
            needsAttention
        };
    };

    const stats = getMemberStats();

    return (
        <Card>
            <Text size="lg" fontWeight="$semibold" mb="$4">Member Progress Comparison</Text>

            {/* Key Metrics */}
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Box p="$4" bg="$blue50" rounded="$lg">
                    <Text color="$blue800" size="sm">Team Progress</Text>
                    <Text size="2xl" fontWeight="$bold" color="$blue900">
                        {stats.improved}/{stats.total}
                    </Text>
                    <Text size="xs" color="$blue700">members improved</Text>
                </Box>

                <Box p="$4" bg="$green50" rounded="$lg">
                    <Text color="$green800" size="sm">Average Growth</Text>
                    <Text size="2xl" fontWeight="$bold" color="$green900">
                        {stats.avgChange >= 0 ? '+' : ''}{stats.avgChange.toFixed(1)}%
                    </Text>
                    <Text size="xs" color="$green700">overall change</Text>
                </Box>

                <Box p="$4" bg="$purple50" rounded="$lg">
                    <Text color="$purple800" size="sm">Task Completion</Text>
                    <Text size="2xl" fontWeight="$bold" color="$purple900">
                        {stats.avgTaskCompletion.toFixed(1)}%
                    </Text>
                    <Text size="xs" color="$purple700">average rate</Text>
                </Box>

                <Box p="$4" bg="$amber50" rounded="$lg">
                    <Text color="$amber800" size="sm">Highest Growth</Text>
                    <Text size="2xl" fontWeight="$bold" color="$amber900">
                        +{Math.max(...props.memberChanges.map(m => m.change)).toFixed(1)}%
                    </Text>
                    <Text size="xs" color="$amber700">best improvement</Text>
                </Box>
            </div>

            {/* Main Chart */}
            <div class="h-[500px]" ref={chartDiv} />

            {/* Top Performers and Support Needed */}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <VStack spacing="$4" alignItems="stretch">
                    <Text color="$green800" fontWeight="$medium">Top Performers</Text>
                    {stats.topMembers.map(member => (
                        <Box p="$3" bg="$green50" rounded="$lg">
                            <HStack justifyContent="space-between" mb="$2">
                                <Text fontWeight="$medium">{member.name}</Text>
                                <Text color="$green700">+{member.change.toFixed(1)}%</Text>
                            </HStack>
                            <Text size="sm" color="$neutral11">
                                Completed {member.tasks.new.completed} of {member.tasks.new.total} tasks
                            </Text>
                        </Box>
                    ))}
                </VStack>

                <VStack spacing="$4" alignItems="stretch">
                    <Text color="$red800" fontWeight="$medium">Needs Additional Support</Text>
                    {stats.needsAttention.map(member => (
                        <Box p="$3" bg="$red50" rounded="$lg">
                            <HStack justifyContent="space-between" mb="$2">
                                <Text fontWeight="$medium">{member.name}</Text>
                                <Text color="$red700">{member.change.toFixed(1)}%</Text>
                            </HStack>
                            <Text size="sm" color="$neutral11">
                                {member.tasks.new.total - member.tasks.new.completed} tasks remaining
                            </Text>
                        </Box>
                    ))}
                </VStack>
            </div>
        </Card>
    );
};