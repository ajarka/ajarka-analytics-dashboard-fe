import * as am5 from "@amcharts/amcharts5";

export interface ActivityData {
    date: string;
    commits: number;
    pullRequests: number;
    issues: number;
}

export interface TaskCompletionData {
    name: string;
    value: number;
}

export interface PieDataItem {
    status: string;
    value: number;
    color: am5.Color;
}

export interface ChartDataItem {
    name: string;
    fullName: string;
    progress: number;
    completed: number;
    total: number;
}