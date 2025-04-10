export type EntityType = 'Project' | 'Repository' | 'Member';

export interface GithubMember {
    login: string;
    avatar_url: string;
    id: number;
}

export interface GithubRepository {
    id: number;
    name: string;
    full_name: string;
    description: string;
    html_url: string;
}

export interface GithubProject {
    id: number;
    number: number;
    name: string;
    body: string;
    html_url: string;
    issues: Array<{
        status: any;
        number: number;
        repository: string;
    }>;
}

export interface IssueComment {
    id: string;
    body: string;
    user: {
        login: string;
        avatar_url: string;
    };
    created_at: string;
    html_url: string;
}

export interface GithubIssue {
    issue: GithubIssue;
    comments?: IssueComment[];
    pull_request: unknown;
    number: number;
    title: string;
    state: 'open' | 'closed';
    body: string;
    created_at: string;
    updated_at: string;
    start_date?: string;
    due_date?: string;
    repository: {
        name: string;
        full_name: string;
    };
    project?: {
        name: string;
        number: number;
    };
    assignee: {
        login: string;
        avatar_url: string;
    } | null;
}

export interface TaskProgress {
    total: number;
    completed: number;
    percentage: number;
}

export interface MemberStats {
    member: GithubMember;
    issueStats: {
        total: number;
        completed: number;
        percentage: number;
    };
    taskStats: {
        total: number;
        completed: number;
        percentage: number;
    };
    issues: GithubIssue[];
}

export type FilterType = 'all' | 'repository' | 'project' | 'member';

export interface FilterValue {
    type: FilterType;
    values: string[];
}

export interface Filter {
    repository: string[];
    project: string[];
    member: string[];
}

export interface ReportCategory {
    id: string;
    name: string;
    type: FilterType;
    value?: string;
}

export interface Filter {
    type: FilterType;
    value?: string;
}

export interface ReportCategory {
    id: string;
    name: string;
    type: FilterType;
    value?: string;
}

export interface GithubPullRequest {
    number: number;
    title: string;
    state: 'open' | 'closed' | 'merged';
    body: string;
    created_at: string;
    updated_at: string;
    merged_at: string | null;
    repository: {
        name: string;
        full_name: string;
    };
    user: {
        login: string;
        avatar_url: string;
    };
    additions: number;
    deletions: number;
    changed_files: number;
    commits: number;
    review_comments: number;
}

export interface GithubCommit {
    sha: string;
    commit: {
        author: {
            name: string;
            email: string;
            date: string;
        };
        message: string;
    };
    author: {
        login: string;
        avatar_url: string;
    };
    repository: {
        name: string;
        full_name: string;
    };
    stats: {
        additions: number;
        deletions: number;
        total: number;
    };
}

export interface MemberCodeStats {
    totalCommits: number;
    totalPRs: number;
    mergedPRs: number;
    linesAdded: number;
    linesDeleted: number;
    filesChanged: number;
    averageCommitsPerDay: number;
    averagePRSize: number;
    commits: GithubCommit[];
    pullRequests: GithubPullRequest[];
}

export interface MemberDetailedStats extends MemberStats {
    codeStats: MemberCodeStats;
}

export type ViewType = 'members' | 'projects' | 'repositories';

export type TimelineEventType = 'commit' | 'issue_comment' | 'pr_comment';

export interface TimelineEvent {
    id: string;
    type: TimelineEventType;
    title: string;
    content: string;
    author: {
        login: string;
        avatar_url: string;
    };
    timestamp: string;
    repository: string;
    linkUrl: string;
}

export interface ProjectItem {
    number: number;
    repository: string;
    status?: string;
    start_date?: string;
    due_date?: string;
  }