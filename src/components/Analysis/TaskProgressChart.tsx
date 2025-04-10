import { Component, onMount, onCleanup } from 'solid-js';
import { Text } from "@hope-ui/solid";
import { Card } from '../UI/Card';
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import type { ProjectChange } from '../../types/analysis';

interface TaskProgressChartProps {
    projectChanges: ProjectChange[];
}

export const TaskProgressChart: Component<TaskProgressChartProps> = (props) => {
    let chartDiv: HTMLDivElement | undefined;
    let root: am5.Root | undefined;

    const createChart = () => {
        if (!props.projectChanges.length) return;

        if (root) {
            root.dispose();
        }

        // Create root and chart
        root = am5.Root.new(chartDiv!);
        root.setThemes([am5themes_Animated.new(root)]);

        const chart = root.container.children.push(
            am5xy.XYChart.new(root, {
                panX: false,
                panY: false,
                wheelX: "none",
                wheelY: "none",
                layout: root.verticalLayout,
                paddingLeft: 0,
                paddingRight: 25
            })
        );

        // Create axes
        const yAxis = chart.yAxes.push(
            am5xy.CategoryAxis.new(root, {
                categoryField: "name",
                renderer: am5xy.AxisRendererY.new(root, {
                    minGridDistance: 30,
                    inversed: true
                }),
                tooltip: am5.Tooltip.new(root, {})
            })
        );

        const xAxis = chart.xAxes.push(
            am5xy.ValueAxis.new(root, {
                renderer: am5xy.AxisRendererX.new(root, {}),
                min: 0,
                max: 100,
                numberFormat: "#'%'"
            })
        );

        // Create series
        const oldSeries = chart.series.push(
            am5xy.ColumnSeries.new(root, {
                name: "Previous Task Progress",
                xAxis: xAxis,
                yAxis: yAxis,
                valueXField: "oldTaskProgress",
                categoryYField: "name",
                clustered: true,
                tooltip: am5.Tooltip.new(root, {
                    labelText: "{name}: {oldTaskProgress}% ({oldCompleted}/{oldTotal})"
                })
            })
        );

        const newSeries = chart.series.push(
            am5xy.ColumnSeries.new(root, {
                name: "Current Task Progress",
                xAxis: xAxis,
                yAxis: yAxis,
                valueXField: "newTaskProgress",
                categoryYField: "name",
                clustered: true,
                tooltip: am5.Tooltip.new(root, {
                    labelText: "{name}: {newTaskProgress}% ({newCompleted}/{newTotal})"
                })
            })
        );

        // Set data
        const data = props.projectChanges.map(project => ({
            name: project.name,
            oldTaskProgress: project.tasks.old.percentage,
            newTaskProgress: project.tasks.new.percentage,
            oldCompleted: project.tasks.old.completed,
            oldTotal: project.tasks.old.total,
            newCompleted: project.tasks.new.completed,
            newTotal: project.tasks.new.total
        }));

        yAxis.data.setAll(data);
        oldSeries.data.setAll(data);
        newSeries.data.setAll(data);

        // Add legend
        const legend = chart.children.push(am5.Legend.new(root, {
            centerX: am5.percent(50),
            x: am5.percent(50),
            marginTop: 15
        }));

        legend.data.setAll(chart.series.values);

        // Style series
        oldSeries.columns.template.setAll({
            height: am5.percent(70),
            strokeOpacity: 0,
            fillOpacity: 0.7,
            fill: am5.color(0x6366F1)
        });

        newSeries.columns.template.setAll({
            height: am5.percent(70),
            strokeOpacity: 0,
            fillOpacity: 0.7,
            fill: am5.color(0x10B981)
        });
    };

    onMount(() => {
        createChart();
    });

    onCleanup(() => {
        root?.dispose();
    });

    return (
        <Card>
            <Text size="lg" fontWeight="$semibold" mb="$4">Task Progress Comparison</Text>
            <div class="h-[400px]" ref={chartDiv} />
        </Card>
    );
};