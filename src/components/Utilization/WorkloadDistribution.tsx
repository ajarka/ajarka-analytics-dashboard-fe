import { Component, onMount, onCleanup, createSignal, createMemo, For, createEffect } from 'solid-js';
import { Card } from '../UI/Card';
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import * as am5percent from "@amcharts/amcharts5/percent";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import {
    Box,
    HStack,
    VStack,
    Text,
    Select,
    SelectTrigger,
    SelectPlaceholder,
    SelectValue,
    SelectIcon,
    SelectContent,
    SelectListbox,
    SelectOption,
    SelectOptionText,
    SelectOptionIndicator,
    Input,
    Button,
} from "@hope-ui/solid";

interface WorkloadDistributionProps {
    utilization: any[];
}

export const WorkloadDistribution: Component<WorkloadDistributionProps> = (props) => {
    let barChartDiv: HTMLDivElement | undefined;
    let pieChartDiv: HTMLDivElement | undefined;
    let root: am5.Root | undefined;
    let pieRoot: am5.Root | undefined;

    // Filter states
    const [searchQuery, setSearchQuery] = createSignal("");
    const [workloadFilter, setWorkloadFilter] = createSignal<string[]>([]);
    const [sortBy, setSortBy] = createSignal("utilization-desc");
    const [viewType, setViewType] = createSignal<'bar' | 'pie'>('bar');

    const workloadCategories = [
        { label: "Critical Load (>90%)", value: "critical" },
        { label: "High Load (75-90%)", value: "high" },
        { label: "Optimal Load (50-75%)", value: "optimal" },
        { label: "Low Load (<50%)", value: "low" }
    ];

    const sortOptions = [
        { label: "Utilization (High to Low)", value: "utilization-desc" },
        { label: "Utilization (Low to High)", value: "utilization-asc" },
        { label: "Tasks (High to Low)", value: "tasks-desc" },
        { label: "Tasks (Low to High)", value: "tasks-asc" },
        { label: "Name (A to Z)", value: "name-asc" },
        { label: "Name (Z to A)", value: "name-desc" }
    ];

    const getWorkloadCategory = (utilization: number) => {
        if (utilization >= 90) return "critical";
        if (utilization >= 75) return "high";
        if (utilization >= 50) return "optimal";
        return "low";
    };

    const getWorkloadColor = (utilization: number) => {
        if (utilization >= 90) return "#EF4444"; // Red
        if (utilization >= 75) return "#F59E0B"; // Yellow
        if (utilization >= 50) return "#10B981"; // Green
        return "#3B82F6"; // Blue
    };

    const filteredAndSortedData = createMemo(() => {
        let data = props.utilization.map(member => ({
            name: member.member.login,
            fullName: member.member.login,
            utilization: Math.round(member.utilizationPercentage),
            tasks: member.details.tasks.total,
            activeIssues: member.activeIssues,
            activePRs: member.activePRs,
            category: getWorkloadCategory(member.utilizationPercentage),
            color: getWorkloadColor(member.utilizationPercentage),
            details: member.details
        }));

        // Apply filters
        if (searchQuery()) {
            data = data.filter(item =>
                item.name.toLowerCase().includes(searchQuery().toLowerCase())
            );
        }

        if (workloadFilter().length > 0) {
            data = data.filter(item => workloadFilter().includes(item.category));
        }

        // Apply sorting
        switch (sortBy()) {
            case "utilization-desc":
                data.sort((a, b) => b.utilization - a.utilization);
                break;
            case "utilization-asc":
                data.sort((a, b) => a.utilization - b.utilization);
                break;
            case "tasks-desc":
                data.sort((a, b) => b.tasks - a.tasks);
                break;
            case "tasks-asc":
                data.sort((a, b) => a.tasks - b.tasks);
                break;
            case "name-asc":
                data.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case "name-desc":
                data.sort((a, b) => b.name.localeCompare(a.name));
                break;
        }

        return data;
    });

    const summaryData = createMemo(() => {
        const data = filteredAndSortedData();
        return {
            totalMembers: data.length,
            averageUtilization: data.reduce((sum, item) => sum + item.utilization, 0) / data.length,
            criticalCount: data.filter(item => item.category === 'critical').length,
            highCount: data.filter(item => item.category === 'high').length,
            optimalCount: data.filter(item => item.category === 'optimal').length,
            lowCount: data.filter(item => item.category === 'low').length,
        };
    });

    const createBarChart = () => {
        if (!barChartDiv) return;
    
        // Dispose existing chart if any
        if (root) {
            root.dispose();
        }
    
        root = am5.Root.new(barChartDiv);
        root.setThemes([am5themes_Animated.new(root)]);
    
        const chart = root.container.children.push(
            am5xy.XYChart.new(root, {
                panX: false,
                panY: false,
                wheelX: "none",
                wheelY: "none",
                layout: root.horizontalLayout,
                paddingLeft: 0,
                paddingRight: 20,
                paddingTop: 20,  // Add top padding for tooltip visibility
                paddingBottom: 0
            })
        );
    
        // Create Y axis
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
    
        // Style Y axis labels
        yAxis.get("renderer").labels.template.setAll({
            fontSize: 12,
            fill: am5.color("#4B5563"),
            maxWidth: 150,
            oversizedBehavior: "truncate"
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
    
        // Add series
        const series = chart.series.push(
            am5xy.ColumnSeries.new(root, {
                name: "Utilization",
                xAxis: xAxis,
                yAxis: yAxis,
                valueXField: "utilization",
                categoryYField: "name",
                tooltip: am5.Tooltip.new(root, {
                    pointerOrientation: "left",
                    getFillFromSprite: false,
                    autoTextColor: false,
                    labelText: "[#ffffff]{name}[/]\n[#ffffff]Utilization: {utilization}%[/]\n[#ffffff]Tasks: {tasks}[/]\n[#ffffff]Active Issues: {activeIssues}[/]\n[#ffffff]Pending PRs: {activePRs}[/]",
                    background: am5.RoundedRectangle.new(root, {
                        fill: am5.color("#1F2937")
                    }),
                    paddingTop: 10,
                    paddingBottom: 10,
                    paddingLeft: 15,
                    paddingRight: 15,
                })
            })
        );

        // Add value labels
        series.bullets.push(() => {
            return am5.Bullet.new(root!, {
                locationX: 1,
                sprite: am5.Label.new(root!, {
                    text: "{valueX}%",
                    fill: am5.color("#ffffff"),
                    centerY: am5.p50,
                    centerX: am5.p100,
                    populateText: true,
                    fontSize: 12,
                    fontWeight: "500"
                })
            });
        });
    
        // Fixed column colors adapter
        series.columns.template.adapters.add("fill", (fill: any, target: any) => {
            const dataItem = target.dataItem;
            if (dataItem) {
                const value = dataItem.get("valueX");
                if (typeof value === "number") {
                    return am5.color(getWorkloadColor(value));
                }
            }
            return fill;
        });
    
        // Style columns
        series.columns.template.setAll({
            height: am5.percent(70),
            strokeWidth: 0,
            cornerRadiusTR: 4,
            cornerRadiusBR: 4,
            tooltipY: 0,  // Align tooltip with the center of the column
        });
    
        // Hover state
        series.columns.template.states.create("hover", {
            fillOpacity: 0.8
        });
    
        // Add cursor
        chart.set("cursor", am5xy.XYCursor.new(root, {
            behavior: "none",
            xAxis: xAxis,
            yAxis: yAxis
        }));
    
        // Update data function
        const updateData = () => {
            const data = filteredAndSortedData();
            yAxis.data.setAll(data);
            series.data.setAll(data);
        };
    
        // Initial data
        updateData();
    
        // Make chart elements animate on data update
        series.appear(1000);
        chart.appear(1000, 100);
    
        // Update data when filters change
        createEffect(() => {
            const query = searchQuery();
            const filters = workloadFilter();
            const sort = sortBy();
            (window as any).DebugLogger.log('Filters changed:', { query, filters, sort });
            updateData();
        });
    
        return {
            updateData
        };
    };

    const createPieChart = () => {
        if (!pieChartDiv) return;

        // Dispose existing chart if any
        if (pieRoot) {
            pieRoot.dispose();
        }

        pieRoot = am5.Root.new(pieChartDiv);
        pieRoot.setThemes([am5themes_Animated.new(pieRoot)]);

        const chart = pieRoot.container.children.push(
            am5percent.PieChart.new(pieRoot, {
                layout: pieRoot.verticalLayout,
                innerRadius: am5.percent(50)
            })
        );

        // Create series
        const series = chart.series.push(
            am5percent.PieSeries.new(pieRoot, {
                name: "Workload",
                valueField: "value",
                categoryField: "category",
                alignLabels: false
            })
        );

        series.slices.template.setAll({
            strokeWidth: 2,
            stroke: am5.color("#ffffff")
        });

        series.labels.template.setAll({
            text: "{category}: {valuePercentTotal.formatNumber('#.0')}%",
            radius: 10
        });

        // Fixed slice colors adapter
        series.slices.template.adapters.add("fill", (fill: any, target: any) => {
            const dataItem = target.dataItem;
            if (dataItem) {
                const category = dataItem.get("category");
                switch (category) {
                    case "Critical": return am5.color("#EF4444");
                    case "High": return am5.color("#F59E0B");
                    case "Optimal": return am5.color("#10B981");
                    case "Low": return am5.color("#3B82F6");
                    default: return fill;
                }
            }
            return fill;
        });

        // Add legend
        const legend = chart.children.push(am5.Legend.new(pieRoot, {
            centerX: am5.percent(50),
            x: am5.percent(50),
            marginTop: 15,
            marginBottom: 15
        }));

        // Calculate distribution data
        const data = filteredAndSortedData();
        const total = data.length;

        if (total > 0) {
            const criticalCount = data.filter(item => item.category === 'critical').length;
            const highCount = data.filter(item => item.category === 'high').length;
            const optimalCount = data.filter(item => item.category === 'optimal').length;
            const lowCount = data.filter(item => item.category === 'low').length;

            const pieData = [
                { category: "Critical", value: criticalCount },
                { category: "High", value: highCount },
                { category: "Optimal", value: optimalCount },
                { category: "Low", value: lowCount }
            ];

            // Set data to series
            series.data.setAll(pieData);
            legend.data.setAll(series.dataItems);
        }

        // Make chart animate
        series.appear(1000, 100);
        chart.appear(1000, 100);
    };

    // Update the updateCharts function:
    const updateCharts = () => {
        (window as any).DebugLogger.log('Updating charts, viewType:', viewType());
        
        if (viewType() === 'bar') {
            if (pieRoot) {
                pieRoot.dispose();
                pieRoot = undefined;
            }
            createBarChart();
        } else {
            if (root) {
                root.dispose();
                root = undefined;
            }
            createPieChart();
        }
    };

    // Update the effect for view type changes
    createEffect(() => {
        const vType = viewType();
        const data = filteredAndSortedData();
        (window as any).DebugLogger.log('View type changed to:', vType);
        (window as any).DebugLogger.log('Data length:', data.length);
        updateCharts();
    });

    onMount(() => {
        updateCharts();
    });

    createMemo(() => {
        const data = filteredAndSortedData();
        updateCharts();
        return data;
    });

    onCleanup(() => {
        root?.dispose();
        pieRoot?.dispose();
    });

    return (
        <Card>
            <div style={{'font-family': 'Figtree'}}>
                <VStack spacing="$6" class="w-full">
                    <Card class="w-full">
                        <VStack spacing="$4">
                            <Text size="lg" fontWeight="$semibold">Workload Distribution Analysis</Text>

                            {/* Controls */}
                            <Box class="w-full">
                                <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
                                    <Box>
                                        <Text size="sm" mb="$2">Search Member</Text>
                                        <Input
                                            value={searchQuery()}
                                            onInput={(e: { currentTarget: { value: any; }; }) => setSearchQuery(e.currentTarget.value)}
                                            placeholder="Search by name..."
                                        />
                                    </Box>

                                    <Box>
                                        <Text size="sm" mb="$2">Workload Filter</Text>
                                        <Select
                                            multiple
                                            value={workloadFilter()}
                                            onChange={(values: string[]) => setWorkloadFilter(values)}
                                        >
                                            <SelectTrigger>
                                                <SelectPlaceholder>Filter by workload...</SelectPlaceholder>
                                                <SelectValue />
                                                <SelectIcon />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectListbox>
                                                    <For each={workloadCategories}>
                                                        {(category) => (
                                                            <SelectOption value={category.value}>
                                                                <SelectOptionText>{category.label}</SelectOptionText>
                                                                <SelectOptionIndicator />
                                                            </SelectOption>
                                                        )}
                                                    </For>
                                                </SelectListbox>
                                            </SelectContent>
                                        </Select>
                                    </Box>

                                    <Box>
                                        <Text size="sm" mb="$2">Sort By</Text>
                                        <Select
                                            value={sortBy()}
                                            onChange={(value: string) => setSortBy(value)}
                                        >
                                            <SelectTrigger>
                                                <SelectPlaceholder>Sort by...</SelectPlaceholder>
                                                <SelectValue />
                                                <SelectIcon />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectListbox>
                                                    <For each={sortOptions}>
                                                        {(option) => (
                                                            <SelectOption value={option.value}>
                                                                <SelectOptionText>{option.label}</SelectOptionText>
                                                                <SelectOptionIndicator />
                                                            </SelectOption>
                                                        )}
                                                    </For>
                                                </SelectListbox>
                                            </SelectContent>
                                        </Select>
                                    </Box>

                                    <Box>
                                        <Text size="sm" mb="$2">View Type</Text>
                                        <Select
                                            value={viewType()}
                                            onChange={(value: 'bar' | 'pie') => setViewType(value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                                <SelectIcon />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectListbox>
                                                    <SelectOption value="bar">
                                                        <SelectOptionText>Bar Chart</SelectOptionText>
                                                        <SelectOptionIndicator />
                                                    </SelectOption>
                                                    <SelectOption value="pie">
                                                        <SelectOptionText>Distribution Pie</SelectOptionText>
                                                        <SelectOptionIndicator />
                                                    </SelectOption>
                                                </SelectListbox>
                                            </SelectContent>
                                        </Select>
                                    </Box>

                                    <Box class="flex items-end">
                                        <Button
                                            variant="outline"
                                            colorScheme="danger"
                                            size="sm"
                                            onClick={() => {
                                                setSearchQuery("");
                                                setWorkloadFilter([]);
                                                setSortBy("utilization-desc");
                                            }}
                                        >
                                            Reset Filters
                                        </Button>
                                    </Box>
                                </div>
                            </Box>

                            {/* Summary Stats */}
                            <Box class="w-full bg-gray-50 p-4 rounded-lg">
                                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <Box>
                                        <Text size="sm" color="$neutral11">Total Members</Text>
                                        <Text size="xl" fontWeight="$semibold">
                                            {summaryData().totalMembers}
                                        </Text>
                                    </Box>
                                    <Box>
                                        <Text size="sm" color="$neutral11">Average Utilization</Text>
                                        <Text
                                            size="xl"
                                            fontWeight="$semibold"
                                            color={getWorkloadColor(summaryData().averageUtilization)}
                                        >
                                            {summaryData().averageUtilization.toFixed(1)}%
                                        </Text>
                                    </Box>
                                    <Box>
                                        <Text size="sm" color="$neutral11">Critical Load</Text>
                                        <Text size="xl" fontWeight="$semibold" color="$danger9">
                                            {summaryData().criticalCount}
                                        </Text>
                                    </Box>
                                    <Box>
                                        <Text size="sm" color="$neutral11">Optimal Load</Text>
                                        <Text size="xl" fontWeight="$semibold" color="$success9">
                                            {summaryData().optimalCount}
                                        </Text>
                                    </Box>
                                </div>
                            </Box>

                            {/* Active Filters Display */}
                            {(workloadFilter().length > 0 || searchQuery()) && (
                                <HStack spacing="$2" flexWrap="wrap">
                                    {workloadFilter().map((filter) => (
                                        <Box
                                            px="$2"
                                            py="$1"
                                            bg="$primary100"
                                            color="$primary900"
                                            borderRadius="$full"
                                            fontSize="$sm"
                                        >
                                            {workloadCategories.find(cat => cat.value === filter)?.label}
                                            <Button
                                                variant="ghost"
                                                size="xs"
                                                ml="$1"
                                                onClick={() => {
                                                    setWorkloadFilter(prev =>
                                                        prev.filter(f => f !== filter)
                                                    );
                                                }}
                                            >
                                                ×
                                            </Button>
                                        </Box>
                                    ))}
                                    {searchQuery() && (
                                        <Box
                                            px="$2"
                                            py="$1"
                                            bg="$primary100"
                                            color="$primary900"
                                            borderRadius="$full"
                                            fontSize="$sm"
                                        >
                                            Search: {searchQuery()}
                                            <Button
                                                variant="ghost"
                                                size="xs"
                                                ml="$1"
                                                onClick={() => setSearchQuery("")}
                                            >
                                                ×
                                            </Button>
                                        </Box>
                                    )}
                                </HStack>
                            )}

                            {/* Charts */}
                            <Box class="w-full h-[600px] relative">
                                {viewType() === 'bar' ? (
                                    <div
                                        ref={barChartDiv}
                                        class="w-full h-full"
                                    />
                                ) : (
                                    <div
                                        ref={pieChartDiv}
                                        class="w-full h-full"
                                    />
                                )}

                                {filteredAndSortedData().length === 0 && (
                                    <Box
                                        class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90"
                                    >
                                        <Text size="lg" color="$neutral11">
                                            No data matches the current filters
                                        </Text>
                                    </Box>
                                )}
                            </Box>
                        </VStack>
                    </Card>
                </VStack>
            </div>
        </Card>
    );
};