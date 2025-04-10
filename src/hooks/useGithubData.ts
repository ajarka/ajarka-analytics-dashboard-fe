import { createResource, createSignal } from 'solid-js';
import type { 
    GithubMember, 
    GithubIssue, 
    MemberStats, 
    Filter, 
    FilterType,  
    ViewType, 
    GithubPullRequest, 
    GithubCommit, 
    MemberCodeStats} from '../types/github';
import { fetchGithubData } from '../services/github';

function calculateTaskProgress(body: string | null) {
    if (!body) return { total: 0, completed: 0, percentage: 0 };

    const tasks = body.match(/- \[.\] .+/g) || [];
    const completed = tasks.filter(task => task.includes('- [x]')).length;

    return {
        total: tasks.length,
        completed,
        percentage: tasks.length ? (completed / tasks.length) * 100 : 0,
    };
}

function calculateMemberStats(member: GithubMember, issues: GithubIssue[]): MemberStats {
    const memberIssues = issues.filter(
        issue => issue.assignee?.login === member.login
    );

    // Issue stats - based on open/closed status
    const completedIssues = memberIssues.filter(issue => issue.state === 'closed');
    const issueStats = {
        total: memberIssues.length,
        completed: completedIssues.length,
        percentage: memberIssues.length ? (completedIssues.length / memberIssues.length) * 100 : 0,
    };

    // Task stats - based on checkboxes in issue body
    const taskStats = memberIssues.reduce(
        (acc, issue) => {
            const progress = calculateTaskProgress(issue.body);
            return {
                total: acc.total + progress.total,
                completed: acc.completed + progress.completed,
                percentage: 0, // Will be calculated below
            };
        },
        { total: 0, completed: 0, percentage: 0 }
    );

    // Calculate final task percentage
    taskStats.percentage = taskStats.total > 0 
        ? (taskStats.completed / taskStats.total) * 100 
        : 0;

    return {
        member,
        issueStats,
        taskStats,
        issues: memberIssues,
    };
}

function calculateCodeStats(member: GithubMember, pulls: GithubPullRequest[], commits: GithubCommit[]): MemberCodeStats {
    const memberPulls = pulls.filter(pr => pr.user.login === member.login);
    const memberCommits = commits.filter(commit => commit.author?.login === member.login);
    
    const mergedPRs = memberPulls.filter(pr => pr.merged_at !== null);
    const totalAdditions = memberPulls.reduce((sum, pr) => sum + (pr.additions || 0), 0);
    const totalDeletions = memberPulls.reduce((sum, pr) => sum + (pr.deletions || 0), 0);
    const totalFiles = memberPulls.reduce((sum, pr) => sum + (pr.changed_files || 0), 0);

    // Calculate average commits per day
    const commitDates = memberCommits.map(c => new Date(c.commit.author.date).toDateString());
    const uniqueDays = new Set(commitDates).size;
    const avgCommitsPerDay = uniqueDays ? memberCommits.length / uniqueDays : 0;

    // Calculate average PR size
    const avgPRSize = memberPulls.length 
        ? (totalAdditions + totalDeletions) / memberPulls.length 
        : 0;

    return {
        totalCommits: memberCommits.length,
        totalPRs: memberPulls.length,
        mergedPRs: mergedPRs.length,
        linesAdded: totalAdditions,
        linesDeleted: totalDeletions,
        filesChanged: totalFiles,
        averageCommitsPerDay: avgCommitsPerDay,
        averagePRSize: avgPRSize,
        commits: memberCommits,
        pullRequests: memberPulls
    };
}

export function useGithubData() {
    const [view, setView] = createSignal<ViewType>('projects');  // Set default to 'projects'
    const [filter, setFilter] = createSignal<Filter>({
        repository: [],
        project: [],
        member: [],
        type: 'repository'
    });

    const [data, { refetch }] = createResource(fetchGithubData);

    const isProjectDataAvailable = () => {
        const currentData = data(); 
        console.log("currentData 111-> " ,currentData );
        return currentData?.projects && currentData.projects.length > 0;
    };

    const updateFilter = (type: FilterType, values: string[]) => {
        setFilter(prev => ({
            ...prev,
            [type]: values
        }));
    };

    const filteredIssues = () => {
        if (!data()) return [];
        const currentFilter = filter();
        
        return data()!.issues.filter(issue => {
            const matchesRepo = currentFilter.repository.length === 0 || 
                currentFilter.repository.includes(issue.repository.name);
            
                const matchesProject = currentFilter.project.length === 0 || 
                data()!.projects.some((project: { name: string; issues: any[]; }) => 
                    currentFilter.project.includes(project.name) && 
                    project.issues.some(
                        projIssue => 
                            projIssue.number === issue.number && 
                            projIssue.repository === issue.repository.name
                    )
                );
            
            const matchesMember = currentFilter.member.length === 0 || 
                (issue.assignee && currentFilter.member.includes(issue.assignee.login));
            
            return matchesRepo && matchesProject && matchesMember;
        });
    };

    const memberDetailedStats = () => {
        if (!data()) return [];
        
        return data()!.members.map((member: any) => ({
            ...calculateMemberStats(member, filteredIssues()),
            codeStats: calculateCodeStats(
                member, 
                data()!.pullRequests, 
                data()!.commits
            )
        }));
    };

    const overallStats = () => {
        if (!data()) return null;

        const issues = filteredIssues();
        const completedIssues = issues.filter(issue => issue.state === 'closed');

        // Calculate status distributions
        const statusDistribution = {
            open: issues.filter(issue => issue.state === 'open' && !issue.body?.match(/- \[x\]/g)?.length).length,
            inProgress: issues.filter(issue =>
                issue.state === 'open' &&
                issue.body?.match(/- \[x\]/g)?.length &&
                issue.body.match(/- \[x\]/g)!.length < (issue.body.match(/- \[.\]/g) || []).length
            ).length,
            closed: completedIssues.length
        };

        const taskProgress = issues.reduce(
            (acc, issue) => {
                const progress = calculateTaskProgress(issue.body);
                return {
                    total: acc.total + progress.total,
                    completed: acc.completed + progress.completed,
                    percentage: acc.total ? ((acc.completed + progress.completed) / (acc.total + progress.total)) * 100 : 0,
                };
            },
            { total: 0, completed: 0, percentage: 0 }
        );

        return {
            issues: {
                total: issues.length,
                completed: completedIssues.length,
                percentage: issues.length ? (completedIssues.length / issues.length) * 100 : 0,
            },
            tasks: taskProgress,
            statusDistribution
        };
    };

    const getReportCategories = () => {
        if (!data()) return [];

        const categories: Array<{
            id: string;
            name: string;
            type: FilterType;
            value?: string;
        }> = [
            { id: 'all', name: '📊 All Issues', type: 'all' }
        ];

        // Add repositories with issue counts
        data()!.repositories.forEach((repo: any) => {
            const repoIssues = data()!.issues.filter(issue => 
                issue.repository.name === repo.name
            );
            categories.push({
                id: `repo-${repo.name}`,
                name: `📁 ${repo.name} (${repoIssues.length} issues)`,
                type: 'repository',
                value: repo.name
            });

        });

        // Add projects with issue counts
        data()!.projects.forEach((project: any) => {
            categories.push({
                id: `project-${project.number}`,
                name: `📌 ${project.name} (${project.issues.length} issues)`,
                type: 'project',
                value: project.name
            });
        });

        // Add members with issue counts
        data()!.members.forEach((member: any) => {
            const memberIssues = data()!.issues.filter(issue => 
                issue.assignee?.login === member.login
            );
            categories.push({
                id: `member-${member.login}`,
                name: `👤 ${member.login} (${memberIssues.length} issues)`,
                type: 'member',
                value: member.login
            });
        });

        return categories;
    };

    return {
        data,
        refetch,
        view,
        setView,
        isProjectDataAvailable,
        filter,
        updateFilter,
        filteredIssues,
        memberDetailedStats,
        overallStats,
        getReportCategories,
    };
}