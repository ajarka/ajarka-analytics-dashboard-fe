import { Component, onMount, onCleanup } from 'solid-js';
import { Card } from '../UI/Card';
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import { TimelineEvent } from '@/types/github';
import { isBotOrSystem } from '../../services/github';

interface ActivityAnalysisProps {
    timelineEvents: TimelineEvent[];
}

export const ActivityAnalysis: Component<ActivityAnalysisProps> = (props) => {
    let chartDiv: HTMLDivElement | undefined;
    let root: am5.Root | undefined;

    const processEventsData = () => {
        // Get last 30 days
        const days = Array.from({ length: 30 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return date.toISOString().split('T')[0];
        }).reverse();

        return days.map(day => {
            const dayEvents = props.timelineEvents.filter(event =>
                event.timestamp.startsWith(day)
            );

            // Get member activity details for each type, filtering out bots
            const commitEvents = dayEvents.filter(e => 
                e.type === 'commit' && 
                e.author && 
                !isBotOrSystem(e.author.login)
            );
            
            const issueCommentEvents = dayEvents.filter(e => 
                e.type === 'issue_comment' && 
                e.author && 
                !isBotOrSystem(e.author.login)
            );
            
            const prCommentEvents = dayEvents.filter(e => 
                e.type === 'pr_comment' && 
                e.author && 
                !isBotOrSystem(e.author.login)
            );

            // Create member details strings
            const commitMembers = Array.from(new Set(commitEvents.map(e => e.author.login))).join(', ');
            const issueCommentMembers = Array.from(new Set(issueCommentEvents.map(e => e.author.login))).join(', ');
            const prCommentMembers = Array.from(new Set(prCommentEvents.map(e => e.author.login))).join(', ');

            return {
                date: new Date(day).getTime(), // Convert to timestamp for amCharts
                commits: commitEvents.length,
                issueComments: issueCommentEvents.length,
                prComments: prCommentEvents.length,
                commitBy: commitMembers,
                issueCommentsBy: issueCommentMembers,
                prCommentsBy: prCommentMembers
            };
        });
    };

    onMount(() => {
        // Create root element
        root = am5.Root.new(chartDiv!);

        // Set themes
        root.setThemes([am5themes_Animated.new(root)]);

        // Create chart
        const chart = root.container.children.push(
            am5xy.XYChart.new(root, {
                panX: true,
                panY: true,
                wheelX: "panX",
                wheelY: "zoomX",
                pinchZoomX: true,
                paddingLeft: 0,
                paddingRight: 0
            })
        );

        // Create axes
        const xAxis = chart.xAxes.push(
            am5xy.DateAxis.new(root, {
                maxDeviation: 0.2,
                baseInterval: {
                    timeUnit: "day",
                    count: 1
                },
                renderer: am5xy.AxisRendererX.new(root, {}),
                tooltip: am5.Tooltip.new(root, {})
            })
        );

        const yAxis = chart.yAxes.push(
            am5xy.ValueAxis.new(root, {
                maxDeviation: 0.2,
                renderer: am5xy.AxisRendererY.new(root, {})
            })
        );

        // Add series
        function createSeries(name: string, field: string, detailField: string, color: string) {
            const series = chart.series.push(
                am5xy.LineSeries.new(root!, {
                    name: name,
                    xAxis: xAxis,
                    yAxis: yAxis,
                    valueYField: field,
                    valueXField: "date",
                    tooltip: am5.Tooltip.new(root!, {
                        pointerOrientation: "horizontal",
                        labelText: `[bold]{name}[/]
Number: {valueY}
By: {${detailField}}`
                    })
                })
            );

            series.strokes.template.setAll({
                strokeWidth: 2,
                stroke: am5.color(color)
            });

            series.fills.template.setAll({
                fillOpacity: 0.1,
                fill: am5.color(color),
                visible: true
            });

            series.bullets.push(function() {
                return am5.Bullet.new(root!, {
                    sprite: am5.Circle.new(root!, {
                        radius: 4,
                        fill: am5.color(color)
                    })
                });
            });

            return series;
        }

        // Create the series
        const commitSeries = createSeries("Commits", "commits", "commitBy", "#4F46E5");
        const issueSeries = createSeries("Issue Comments", "issueComments", "issueCommentsBy", "#10B981");
        const prSeries = createSeries("PR Comments", "prComments", "prCommentsBy", "#F59E0B");

        // Add legend
        const legend = chart.children.push(
            am5.Legend.new(root, {
                centerX: am5.percent(50),
                x: am5.percent(50),
                marginTop: 15,
                marginBottom: 15
            })
        );

        legend.data.setAll([commitSeries, issueSeries, prSeries]);

        // Add cursor
        chart.set("cursor", am5xy.XYCursor.new(root, {
            behavior: "zoomX",
            xAxis: xAxis
        }));

        xAxis.set("tooltip", am5.Tooltip.new(root, {
            themeTags: ["axis"]
        }));

        yAxis.set("tooltip", am5.Tooltip.new(root, {
            themeTags: ["axis"]
        }));

        // Process and set data
        const data = processEventsData();
        commitSeries.data.setAll(data);
        issueSeries.data.setAll(data);
        prSeries.data.setAll(data);

        // Make stuff animate on load
        commitSeries.appear(1000);
        issueSeries.appear(1000);
        prSeries.appear(1000);
        chart.appear(1000, 100);
    });

    onCleanup(() => {
        root?.dispose();
    });

    return (
        <Card>
            <h3 class="text-lg font-semibold text-gray-700 mb-4">Activity Overview</h3>
            <div class="h-[400px]" ref={chartDiv} />
        </Card>
    );
};