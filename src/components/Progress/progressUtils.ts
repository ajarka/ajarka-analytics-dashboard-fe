import type { GithubIssue } from '../../types/github';

export interface ProgressStats {
    issues: {
        total: number;
        completed: number;
        percentage: number;
    };
    tasks: {
        total: number;
        completed: number;
        percentage: number;
    };
}

// Helper function to calculate task progress from issue body
export const calculateTaskProgress = (body: string | null) => {
    if (!body) return { total: 0, completed: 0 };

    const tasks = body.match(/- \[.\] .+/g) || [];
    const completed = (body.match(/- \[x\] .+/g) || []).length;

    return {
        total: tasks.length,
        completed: completed
    };
};

export const calculateProgressStats = (issues: GithubIssue[]): ProgressStats => {
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