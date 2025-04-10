import { Component, onMount, onCleanup } from 'solid-js';
import { Text } from "@hope-ui/solid";
import { Card } from '../UI/Card';
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import type { AnalysisData } from '../../types/analysis';

interface TrendAnalysisProps {
    projectChanges: AnalysisData['projectChanges'];
}

export const TrendAnalysis: Component<TrendAnalysisProps> = (props) => {
    let chartDiv: HTMLDivElement | undefined;
    let root: am5.Root | undefined;

    const createChart = () => {
        if (!props.projectChanges.length) return;

        // Dispose existing chart if any
        if (root) {
            root.dispose();
        }

        // Create root element
        root = am5.Root.new(chartDiv!);
        root.setThemes([am5themes_Animated.new(root)]);

        // Create chart
        const chart = root.container.children.push(
            am5xy.XYChart.new(root, {
                panX: false,
                panY: false,
                wheelX: "none",
                wheelY: "none",
                layout: root.verticalLayout
            })
        );

        // Create axes
        const xAxis = chart.xAxes.push(
            am5xy.CategoryAxis.new(root, {
                categoryField: "name",
                renderer: am5xy.AxisRendererX.new(root, {}),
                tooltip: am5.Tooltip.new(root, {})
            })
        );

        const yAxis = chart.yAxes.push(
            am5xy.ValueAxis.new(root, {
                renderer: am5xy.AxisRendererY.new(root, {})
            })
        );

        // Add series
        const oldSeries = chart.series.push(
            am5xy.LineSeries.new(root, {
                name: "Previous Progress",
                xAxis: xAxis,
                yAxis: yAxis,
                valueYField: "oldProgress",
                categoryXField: "name",
                tooltip: am5.Tooltip.new(root, {
                    labelText: "{name}: {valueY}%"
                })
            })
        );

        const newSeries = chart.series.push(
            am5xy.LineSeries.new(root, {
                name: "Current Progress",
                xAxis: xAxis,
                yAxis: yAxis,
                valueYField: "newProgress",
                categoryXField: "name",
                tooltip: am5.Tooltip.new(root, {
                    labelText: "{name}: {valueY}%"
                })
            })
        );

        // Add legend
        const legend = chart.children.push(am5.Legend.new(root, {}));
        legend.data.setAll(chart.series.values);

        // Set data
        xAxis.data.setAll(props.projectChanges);
        oldSeries.data.setAll(props.projectChanges);
        newSeries.data.setAll(props.projectChanges);
    };

    onMount(() => {
        createChart();
    });

    onCleanup(() => {
        root?.dispose();
    });

    return (
        <Card>
            <Text size="lg" fontWeight="$semibold" mb="$4">Progress Trends</Text>
            <div class="h-[400px]" ref={chartDiv} />
        </Card>
    );
};