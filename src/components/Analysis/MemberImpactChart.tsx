import { Component, onMount, onCleanup } from 'solid-js';
import { Text } from "@hope-ui/solid";
import { Card } from '../UI/Card';
import * as am5 from "@amcharts/amcharts5";
import * as am5radar from "@amcharts/amcharts5/radar";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import type { AnalysisData } from '../../types/analysis';
import * as am5xy from "@amcharts/amcharts5/xy";

interface MemberImpactProps {
    memberChanges: AnalysisData['memberChanges'];
}

export const MemberImpact: Component<MemberImpactProps> = (props) => {
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
            am5radar.RadarChart.new(root, {
                panX: false,
                panY: false
            })
        );

        const xAxis = chart.xAxes.push(
            am5xy.CategoryAxis.new(root, {
                renderer: am5radar.AxisRendererCircular.new(root, {}),
                categoryField: "name"
            })
        );

        const yAxis = chart.yAxes.push(
            am5xy.ValueAxis.new(root, {
                renderer: am5radar.AxisRendererRadial.new(root, {})
            })
        );

        const series = chart.series.push(
            am5radar.RadarLineSeries.new(root, {
                name: "Progress Change",
                xAxis: xAxis,
                yAxis: yAxis,
                valueYField: "change",
                categoryXField: "name",
                tooltip: am5.Tooltip.new(root, {
                    labelText: "{name}: {valueY}%"
                })
            })
        );

        series.strokes.template.setAll({
            strokeWidth: 2
        });

        series.bullets.push(() => {
            return am5.Bullet.new(root!, {
                sprite: am5.Circle.new(root!, {
                    radius: 5,
                    fill: series.get("fill")
                })
            });
        });

        xAxis.data.setAll(props.memberChanges);
        series.data.setAll(props.memberChanges);
    };

    onMount(() => {
        createChart();
    });

    onCleanup(() => {
        root?.dispose();
    });

    return (
        <Card>
            <Text size="lg" fontWeight="$semibold" mb="$4">Member Impact Analysis</Text>
            <div class="h-[400px]" ref={chartDiv} />
        </Card>
    );
};