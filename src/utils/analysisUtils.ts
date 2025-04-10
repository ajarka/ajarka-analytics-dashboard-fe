import type { HistoricalData, AnalysisData, TaskMetrics } from '../types/analysis';

const calculateActivityLevel = (commitChange: number, prChange: number, issueChange: number, taskChange: number) => {
    // Weight each metric
    const score = (
        (commitChange * 0.25) + 
        (prChange * 0.25) + 
        (issueChange * 0.25) + 
        (taskChange * 0.25)
    );

    if (score > 20) return 'Very High';
    if (score > 10) return 'High';
    if (score > 0) return 'Moderate';
    if (score > -10) return 'Low';
    return 'Critical';
};

const calculateTaskProgress = (body: string | null): TaskMetrics => {
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

const calculateIssuesTaskProgress = (issues: Array<{ body: string | null }>) => {
    const progress = issues.reduce(
        (acc, issue) => {
            const taskProgress = calculateTaskProgress(issue.body);
            return {
                total: acc.total + taskProgress.total,
                completed: acc.completed + taskProgress.completed,
                percentage: 0 // Will be calculated after reduction
            };
        },
        { total: 0, completed: 0, percentage: 0 }
    );

    // Calculate final percentage
    progress.percentage = progress.total > 0 
        ? (progress.completed / progress.total) * 100 
        : 0;

    return progress;
};

const calculateSummaryMetrics = (
    projectChanges: AnalysisData['projectChanges'],
    memberChanges: AnalysisData['memberChanges'],
    repoChanges: AnalysisData['repoChanges']
) => {
    // Calculate average progress changes
    const avgProjectProgress = projectChanges.length > 0
        ? projectChanges.reduce((acc, curr) => acc + curr.change, 0) / projectChanges.length
        : 0;

    const avgMemberProgress = memberChanges.length > 0
        ? memberChanges.reduce((acc, curr) => acc + curr.change, 0) / memberChanges.length
        : 0;

    const avgRepoProgress = repoChanges.length > 0
        ? repoChanges.reduce((acc, curr) => acc + curr.change, 0) / repoChanges.length
        : 0;

    // Calculate task progress changes
    const taskChanges = {
        old: projectChanges.reduce(
            (acc, project) => ({
                completed: acc.completed + project.tasks.old.completed,
                total: acc.total + project.tasks.old.total
            }),
            { completed: 0, total: 0 }
        ),
        new: projectChanges.reduce(
            (acc, project) => ({
                completed: acc.completed + project.tasks.new.completed,
                total: acc.total + project.tasks.new.total
            }),
            { completed: 0, total: 0 }
        )
    };

    return {
        overallProgress: (avgProjectProgress + avgMemberProgress + avgRepoProgress) / 3,
        totalCompletedIssues: memberChanges.reduce((acc, curr) => acc + curr.completedChange, 0),
        totalNewPRs: memberChanges.reduce((acc, curr) => acc + (curr.prChange > 0 ? curr.prChange : 0), 0),
        totalNewCommits: memberChanges.reduce((acc, curr) => acc + (curr.commitChange > 0 ? curr.commitChange : 0), 0),
        needsAttention: memberChanges.filter(m => m.activityLevel === 'Critical').length,
        highPerformers: memberChanges.filter(m => m.activityLevel === 'Very High').length,
        taskProgress: {
            completed: taskChanges.new.completed,
            total: taskChanges.new.total,
            change: taskChanges.new.completed - taskChanges.old.completed
        }
    };
};

export const calculateProgressAnalysis = (
    oldData: HistoricalData,
    currentData: HistoricalData
): AnalysisData => {
    // Project Progress Changes
    const projectChanges = currentData.projects.map(newProject => {
        const oldProject = oldData.projects.find(p => p.number === newProject.number);
        if (!oldProject) return null;

        // Calculate issue progress
        const oldIssues = oldData.issues.filter(i => 
            newProject.issues.some(pi => pi.number === i.number && pi.repository === i.repository.name)
        );
        const newIssues = currentData.issues.filter(i => 
            newProject.issues.some(pi => pi.number === i.number && pi.repository === i.repository.name)
        );

        const oldCompleted = oldIssues.filter(i => i.state === 'closed').length;
        const newCompleted = newIssues.filter(i => i.state === 'closed').length;

        // Calculate task progress
        const oldTaskProgress = calculateIssuesTaskProgress(oldIssues);
        const newTaskProgress = calculateIssuesTaskProgress(newIssues);

        return {
            name: newProject.name,
            oldProgress: oldIssues.length > 0 ? (oldCompleted / oldIssues.length) * 100 : 0,
            newProgress: newIssues.length > 0 ? (newCompleted / newIssues.length) * 100 : 0,
            change: oldIssues.length > 0 
                ? ((newCompleted / newIssues.length) - (oldCompleted / oldIssues.length)) * 100 
                : 0,
            totalIssues: newIssues.length,
            completedChange: newCompleted - oldCompleted,
            tasks: {
                old: oldTaskProgress,
                new: newTaskProgress,
                change: newTaskProgress.percentage - oldTaskProgress.percentage
            }
        };
    }).filter((item): item is NonNullable<typeof item> => item !== null);

    // Member Progress Changes
    const memberChanges = currentData.members.map(member => {
        // Calculate issue metrics
        const oldMemberIssues = oldData.issues.filter(i => i.assignee?.login === member.login);
        const newMemberIssues = currentData.issues.filter(i => i.assignee?.login === member.login);
        
        const oldCompleted = oldMemberIssues.filter(i => i.state === 'closed').length;
        const newCompleted = newMemberIssues.filter(i => i.state === 'closed').length;

        // Calculate PR and commit changes
        const oldPRs = oldData.pullRequests.filter(pr => pr.user.login === member.login).length;
        const newPRs = currentData.pullRequests.filter(pr => pr.user.login === member.login).length;

        const oldCommits = oldData.commits.filter(c => c.author?.login === member.login).length;
        const newCommits = currentData.commits.filter(c => c.author?.login === member.login).length;

        // Calculate task progress
        const oldTaskProgress = calculateIssuesTaskProgress(oldMemberIssues);
        const newTaskProgress = calculateIssuesTaskProgress(newMemberIssues);
        const taskChange = newTaskProgress.percentage - oldTaskProgress.percentage;

        return {
            name: member.login,
            oldProgress: oldMemberIssues.length > 0 ? (oldCompleted / oldMemberIssues.length) * 100 : 0,
            newProgress: newMemberIssues.length > 0 ? (newCompleted / newMemberIssues.length) * 100 : 0,
            change: oldMemberIssues.length > 0 
                ? ((newCompleted / newMemberIssues.length) - (oldCompleted / oldMemberIssues.length)) * 100 
                : 0,
            totalIssues: newMemberIssues.length,
            completedChange: newCompleted - oldCompleted,
            prChange: newPRs - oldPRs,
            commitChange: newCommits - oldCommits,
            tasks: {
                old: oldTaskProgress,
                new: newTaskProgress,
                change: taskChange
            },
            activityLevel: calculateActivityLevel(
                newCommits - oldCommits,
                newPRs - oldPRs,
                newCompleted - oldCompleted,
                taskChange
            )
        };
    });

    // Repository Progress Changes
    const repoChanges = currentData.repositories.map((repo: { name: string; }) => {
        // Calculate issue metrics
        const oldRepoIssues = oldData.issues.filter(i => i.repository.name === repo.name);
        const newRepoIssues = currentData.issues.filter(i => i.repository.name === repo.name);
        
        const oldCompleted = oldRepoIssues.filter(i => i.state === 'closed').length;
        const newCompleted = newRepoIssues.filter(i => i.state === 'closed').length;

        // Calculate PR metrics
        const oldPRs = oldData.pullRequests.filter(pr => pr.repository.name === repo.name).length;
        const newPRs = currentData.pullRequests.filter(pr => pr.repository.name === repo.name).length;

        // Calculate task progress
        const oldTaskProgress = calculateIssuesTaskProgress(oldRepoIssues);
        const newTaskProgress = calculateIssuesTaskProgress(newRepoIssues);

        return {
            name: repo.name,
            oldProgress: oldRepoIssues.length > 0 ? (oldCompleted / oldRepoIssues.length) * 100 : 0,
            newProgress: newRepoIssues.length > 0 ? (newCompleted / newRepoIssues.length) * 100 : 0,
            change: oldRepoIssues.length > 0 
                ? ((newCompleted / newRepoIssues.length) - (oldCompleted / oldRepoIssues.length)) * 100 
                : 0,
            totalIssues: newRepoIssues.length,
            completedChange: newCompleted - oldCompleted,
            prChange: newPRs - oldPRs,
            tasks: {
                old: oldTaskProgress,
                new: newTaskProgress,
                change: newTaskProgress.percentage - oldTaskProgress.percentage
            }
        };
    });

    return {
        projectChanges,
        memberChanges,
        repoChanges,
        summary: calculateSummaryMetrics(projectChanges, memberChanges, repoChanges)
    };
};