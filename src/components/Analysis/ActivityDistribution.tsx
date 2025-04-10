import { Component, onMount, onCleanup } from 'solid-js';
import { Text } from "@hope-ui/solid";
import { Card } from '../UI/Card';
import * as am5 from "@amcharts/amcharts5";
import * as am5percent from "@amcharts/amcharts5/percent";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import type { AnalysisData } from '../../types/analysis';

interface ActivityDistributionProps {
    memberChanges: AnalysisData['memberChanges'];
}

export const ActivityDistribution: Component<ActivityDistributionProps> = (props) => {
    let chartDiv: HTMLDivElement | undefined;
    let root: am5.Root | undefined;

    const createChart = () => {
        if (!props.memberChanges.length) return;

        if (root) {
            root.dispose();
        }

        root = am5.Root.new(chartDiv!);
        root.setThemes([am5themes_Animated.new(root)]);

        const chart = root.container.children.push(
            am5percent.PieChart.new(root, {
                layout: root.verticalLayout,
                innerRadius: am5.percent(50)
            })
        );

        const series = chart.series.push(
            am5percent.PieSeries.new(root, {
                valueField: "value",
                categoryField: "category",
                alignLabels: false
            })
        );

        series.slices.template.setAll({
            strokeWidth: 2
        });

        series.labels.template.setAll({
            text: "{category}: {value.formatNumber('#.0')}%"
        });

        // Calculate activity level distribution
        const activityData = props.memberChanges.reduce((acc: any, member) => {
            acc[member.activityLevel] = (acc[member.activityLevel] || 0) + 1;
            return acc;
        }, {});

        const pieData = Object.entries(activityData).map(([category, count]) => ({
            category,
            value: (count as number / props.memberChanges.length) * 100
        }));

        series.data.setAll(pieData);

        // Add legend
        const legend = chart.children.push(am5.Legend.new(root, {
            centerX: am5.percent(50),
            x: am5.percent(50),
            marginTop: 15,
            marginBottom: 15
        }));

        legend.data.setAll(series.dataItems);
    };

    onMount(() => {
        createChart();
    });

    onCleanup(() => {
        root?.dispose();
    });

    return (
        <Card>
            <Text size="lg" fontWeight="$semibold" mb="$4">Team Activity Distribution</Text>
            <div class="h-[400px]" ref={chartDiv} />
        </Card>
    );
};