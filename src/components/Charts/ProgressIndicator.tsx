import { Component, onCleanup, onMount, createEffect, on } from 'solid-js';
import * as am5 from "@amcharts/amcharts5";
import * as am5percent from "@amcharts/amcharts5/percent";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

interface ProgressIndicatorProps {
    progress?: number; // Optional untuk mencegah undefined
    total?: number;    // Optional untuk mencegah undefined
}

const ProgressIndicator: Component<ProgressIndicatorProps> = (props) => {
    let chartDiv: HTMLDivElement | undefined;
    let root: am5.Root | undefined;
    let series: am5percent.PieSeries | undefined;
    let chart: am5percent.PieChart | undefined;
    let label: am5.Label | undefined;

    const updateChartData = () => {
        if (!series || !label) return;
    
        const progress = Number(props.progress) || 0;
        const total = Number(props.total) || 1;
        const isValid = total > 0;
    
        // Jika progress dan total sama-sama 0
        if (progress === 0 && props.total === 0) {
            series.data.setAll([
                { category: "Progress", value: 0, isProgress: true },
                { category: "Remaining", value: 100, isProgress: false },
            ]);
            label.set("text", `[fontSize:14px]No Issues[/]\n[fontSize:24px]0%[/]`);
            return;
        }
    
        // Hitung persentase
        const percentage = isValid ? (progress / total) * 100 : 0;
    
        series.data.setAll([
            {
                category: "Progress",
                value: isValid ? percentage : 0,
                isProgress: true,
            },
            {
                category: "Remaining",
                value: isValid ? 100 - percentage : 100,
                isProgress: false,
            },
        ]);
    
        label.set(
            "text",
            `[fontSize:8px][fontFamily:Figtree]${progress}/${total} issues[/]\n[fontSize:24px]${percentage.toFixed(1)}%[/]`
        );
    };    

    onMount(() => {
        // Inisialisasi chart
        root = am5.Root.new(chartDiv!);
        root.setThemes([am5themes_Animated.new(root)]);

        // Buat chart
        chart = root.container.children.push(
            am5percent.PieChart.new(root, {
                radius: am5.percent(90),
                innerRadius: am5.percent(75),
                layout: root.verticalLayout,
            })
        );

        // Buat series
        series = chart.series.push(
            am5percent.PieSeries.new(root, {
                valueField: "value",
                categoryField: "category",
                startAngle: 180,
                endAngle: 360,
            })
        );

        series.slices.template.setAll({
            cornerRadius: 5,
            fillOpacity: 0.9,
            strokeWidth: 0,
        });

        series.ticks.template.setAll({
            forceHidden: true,
        });

        series.labels.template.setAll({
            forceHidden: true,
        });

        // Atur warna berdasarkan progress
        series.slices.template.adapters.add("fill", (_fill, target: any) => {
            const dataContext = target.dataItem?.dataContext;
            if (dataContext?.isProgress) {
                const progressValue = dataContext.value;
                if (progressValue >= 75) return am5.color("#169a47"); // Hijau
                if (progressValue >= 50) return am5.color("#3B82F6"); // Biru
                if (progressValue >= 25) return am5.color("#F59E0B"); // Kuning
                return am5.color("#EF4444"); // Merah
            }
            return am5.color("#E5E7EB"); // Default
        });

        // Tambahkan label
        label = chart.seriesContainer.children.push(
            am5.Label.new(root, {
                textAlign: "center",
                centerY: am5.percent(50),
                centerX: am5.percent(50),
                text: "",
            })
        );

        // Perbarui data pertama kali
        updateChartData();
    });

    // Perbarui data saat props berubah
    createEffect(
        on([() => props.progress, () => props.total], () => {
            updateChartData();
        })
    );

    onCleanup(() => {
        if (root) root.dispose();
    });

    return <div ref={chartDiv} class="w-full h-full" />;
};

export default ProgressIndicator;
