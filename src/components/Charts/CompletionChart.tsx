import { Component, onCleanup, onMount, createEffect, on } from 'solid-js';
import * as am5 from "@amcharts/amcharts5";
import * as am5percent from "@amcharts/amcharts5/percent";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

interface CompletionChartProps {
    percentage: number;
    title: string;
}

export const CompletionChart: Component<CompletionChartProps> = (props) => {
    let chartDiv: HTMLDivElement | undefined;
    let root: am5.Root | undefined;
    let series: am5percent.PieSeries | undefined;
    let chart: am5percent.PieChart | undefined;
    let label: am5.Label | undefined;

    const updateChartData = () => {
        if (!series || !label) return;

        // Get percentage and clamp between 0-100
        const percentage = Math.min(Math.max(props.percentage, 0), 100);

        // Update data
        series.data.setAll([
            {
                category: "Progress",
                value: percentage,
                isProgress: true
            },
            {
                category: "Remaining",
                value: 100 - percentage,
                isProgress: false
            }
        ]);

        // Update label
        label.set("text", `[fontSize:14px]${props.title}[/]\n[fontSize:24px]${percentage.toFixed(1)}%[/]`);
    };

    onMount(() => {
        // Create root element
        root = am5.Root.new(chartDiv!);
        root.setThemes([am5themes_Animated.new(root)]);

        // Create chart
        chart = root.container.children.push(
            am5percent.PieChart.new(root, {
                radius: am5.percent(90),
                innerRadius: am5.percent(75),
                layout: root.verticalLayout
            })
        );

        // Create series
        series = chart.series.push(
            am5percent.PieSeries.new(root, {
                valueField: "value",
                categoryField: "category",
                startAngle: 180,
                endAngle: 360
            })
        );

        series.slices.template.setAll({
            cornerRadius: 5,
            fillOpacity: 0.9,
            strokeWidth: 0
        });

        series.ticks.template.setAll({
            forceHidden: true
        });

        series.labels.template.setAll({
            forceHidden: true
        });

        // Set colors based on progress
        series.slices.template.adapters.add("fill", function(fill, target: any) {
            if (target.dataItem) {
                const dataContext = target.dataItem.dataContext;
                if (dataContext && typeof dataContext.value === 'number' && typeof dataContext.isProgress === 'boolean') {
                    if (dataContext.isProgress) {
                        const progressValue = dataContext.value;
                        if (progressValue >= 75) return am5.color("#10B981");
                        if (progressValue >= 50) return am5.color("#3B82F6");
                        if (progressValue >= 25) return am5.color("#F59E0B");
                        return am5.color("#EF4444");
                    }
                }
                return am5.color("#E5E7EB");
            }
            return fill;
        });

        // Add label
        label = chart.seriesContainer.children.push(
            am5.Label.new(root, {
                textAlign: "center",
                centerY: am5.percent(50),
                centerX: am5.percent(50),
                text: ""
            })
        );

        // Initial data
        updateChartData();
    });

    // Update on props change
    createEffect(on([() => props.percentage, () => props.title], () => {
        updateChartData();
    }));

    onCleanup(() => {
        if (root) {
            root.dispose();
        }
    });

    return (
        <div ref={chartDiv} class="w-full h-full" />
    );
};