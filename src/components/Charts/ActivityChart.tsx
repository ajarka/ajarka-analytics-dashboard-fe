import { Component, onCleanup, onMount } from 'solid-js';
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

interface ActivityData {
    date: string;
    commits: number;
    pullRequests: number;
    issues: number;
}

interface ActivityChartProps {
    data: ActivityData[];
}

export const ActivityChart: Component<ActivityChartProps> = (props) => {
    let chartDiv: HTMLDivElement | undefined;
    let root: am5.Root | undefined;

    onMount(() => {
        // Create root element
        root = am5.Root.new(chartDiv!);

        // Set themes
        root.setThemes([am5themes_Animated.new(root)]);

        // Create chart
        let chart = root.container.children.push(
            am5xy.XYChart.new(root, {
                panX: false,
                panY: false,
                wheelX: "none",
                wheelY: "none",
                paddingLeft: 0,
                paddingRight: 0
            })
        );

        // Create axes
        let xAxis = chart.xAxes.push(
            am5xy.DateAxis.new(root, {
                baseInterval: { timeUnit: "day", count: 1 },
                renderer: am5xy.AxisRendererX.new(root, {}),
                tooltip: am5.Tooltip.new(root, {}),
                gridIntervals: [{ timeUnit: "day", count: 1 }]
            })
        );

        let yAxis = chart.yAxes.push(
            am5xy.ValueAxis.new(root, {
                min: 0,
                renderer: am5xy.AxisRendererY.new(root, {})
            })
        );

        // Add series
        function makeSeries(name: string, field: string, color: string) {
            let series = chart.series.push(
                am5xy.LineSeries.new(root!, {
                    name: name,
                    xAxis: xAxis,
                    yAxis: yAxis,
                    valueYField: field,
                    valueXField: "date",
                    tooltip: am5.Tooltip.new(root!, {
                        labelText: "{name}: {valueY}"
                    }),
                    stroke: am5.color(color),
                    fill: am5.color(color)
                })
            );

            series.strokes.template.setAll({
                strokeWidth: 2
            });

            series.fills.template.setAll({
                fillOpacity: 0.1,
                visible: true
            });

            series.data.setAll(props.data.map(item => ({
                date: new Date(item.date).getTime(),
                [field]: item[field as keyof typeof item]
            })));

            return series;
        }

        let commitsSeries = makeSeries("Commits", "commits", "#4F46E5");
        let prSeries = makeSeries("Pull Requests", "pullRequests", "#10B981");
        let issuesSeries = makeSeries("Issues", "issues", "#F59E0B");

        // Add legend
        let legend = chart.children.push(
            am5.Legend.new(root, {
                centerX: am5.percent(50),
                x: am5.percent(50),
                layout: am5.GridLayout.new(root, {
                    maxColumns: 3,
                    fixedWidthGrid: true
                })
            })
        );

        legend.data.setAll([commitsSeries, prSeries, issuesSeries]);
        // legend.data.setAll(chart.series.values);

        // Add cursor
        chart.set("cursor", am5xy.XYCursor.new(root, {
            behavior: "zoomX"
        }));

        // Make stuff animate on load
        chart.appear(1000, 100);
    });

    onCleanup(() => {
        if (root) {
            root.dispose();
        }
    });

    return (
        <div ref={chartDiv} class="w-full h-full" />
    );
};