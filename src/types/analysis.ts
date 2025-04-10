export interface HistoricalData {
    repositories: any;
    projects: Array<{
        number: number;
        name: string;
        issues: Array<{
            number: number;
            repository: string;
        }>;
    }>;
    issues: Array<{
        number: number;
        repository: {
            name: string;
        };
        state: string;
        body: string | null;
        assignee?: {
            login: string;
        };
    }>;
    members: Array<{
        login: string;
    }>;
    pullRequests: Array<{
        repository: {
            name: string;
        };
        user: {
            login: string;
        };
    }>;
    commits: Array<{
        repository: {
            name: string;
        };
        author?: {
            login: string;
        };
    }>;
}

export interface TaskMetrics {
    total: number;
    completed: number;
    percentage: number;
}

export interface ProjectChange {
    name: string;
    oldProgress: number;
    newProgress: number;
    change: number;
    totalIssues: number;
    completedChange: number;
    tasks: {
        old: TaskMetrics;
        new: TaskMetrics;
        change: number;
    };
}

export interface MemberChange {
    name: string;
    oldProgress: number;
    newProgress: number;
    change: number;
    totalIssues: number;
    completedChange: number;
    prChange: number;
    commitChange: number;
    activityLevel: string;
    tasks: {
        old: TaskMetrics;
        new: TaskMetrics;
        change: number;
    };
}

export interface RepoChange {
    name: string;
    oldProgress: number;
    newProgress: number;
    change: number;
    totalIssues: number;
    completedChange: number;
    prChange: number;
    tasks: {
        old: TaskMetrics;
        new: TaskMetrics;
        change: number;
    };
}

export interface AnalysisData {
    projectChanges: ProjectChange[];
    memberChanges: MemberChange[];
    repoChanges: RepoChange[];
    summary: {
        overallProgress: number;
        totalCompletedIssues: number;
        totalNewPRs: number;
        totalNewCommits: number;
        needsAttention: number;
        highPerformers: number;
        taskProgress: {
            completed: number;
            total: number;
            change: number;
        };
    };
}