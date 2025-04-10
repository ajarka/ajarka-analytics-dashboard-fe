export interface TaskMetrics {
    total: number;
    completed: number;
    percentage: number;
}

export interface ProgressStats {
    issues: TaskMetrics;
    tasks: TaskMetrics;
}

export const calculateTaskProgress = (body: string | null): TaskMetrics => {
    if (!body) return { total: 0, completed: 0, percentage: 0 };

    const tasks = body.match(/- \[.\] .+/g) || [];
    const completed = (body.match(/- \[x\] .+/g) || []).length;
    const total = tasks.length;

    return {
        total,
        completed,
        percentage: total > 0 ? (completed / total) * 100 : 0
    };
};

export const calculateProgressStats = (issues: any[]): ProgressStats => {
    // Calculate issue progress
    const completedIssues = issues.filter(issue => issue.state === 'closed').length;
    const issuePercentage = issues.length > 0 ? (completedIssues / issues.length) * 100 : 0;

    // Calculate task progress across all issues
    const taskProgress = issues.reduce((acc, issue) => {
        const progress = calculateTaskProgress(issue.body);
        return {
            total: acc.total + progress.total,
            completed: acc.completed + progress.completed
        };
    }, { total: 0, completed: 0 });

    const taskPercentage = taskProgress.total > 0
        ? (taskProgress.completed / taskProgress.total) * 100
        : 0;

    return {
        issues: {
            total: issues.length,
            completed: completedIssues,
            percentage: issuePercentage
        },
        tasks: {
            total: taskProgress.total,
            completed: taskProgress.completed,
            percentage: taskPercentage
        }
    };
};