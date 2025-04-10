import { TimelineEvent, TimelineEventType } from '@/types/github';
import axios from 'axios';
import { Cache } from '../utils/cache';

const getGithubToken = () => {
    // Check environment variable first
    const envToken = import.meta.env.VITE_GITHUB_TOKEN;
    if (envToken) {
        return envToken;
    }
    // Fallback to localStorage
    return localStorage.getItem('GITHUB_TOKEN') || '';
};

// Initialize REST client
const initializeRestClient = (token: string) => {
    return axios.create({
        baseURL: 'https://api.github.com',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });
};

// Initialize GraphQL client
const initializeGraphQLClient = (token: string) => {
    return axios.create({
        baseURL: 'https://api.github.com/graphql',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
};

// Get token and initialize both clients
const GITHUB_TOKEN = getGithubToken();
const restClient = initializeRestClient(GITHUB_TOKEN);
const graphqlClient = initializeGraphQLClient(GITHUB_TOKEN);

// Add token refresh/update capability
export const updateGithubToken = (newToken: string) => {
    const token = newToken || getGithubToken();
    // Update both clients with new token
    restClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    graphqlClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    // Update localStorage if using fallback
    if (!import.meta.env.VITE_GITHUB_TOKEN) {
        localStorage.setItem('GITHUB_TOKEN', token);
    }
};

interface RateLimitResponse {
    rateLimit: {
        limit: number;
        remaining: number;
        used: number;
        resetAt: string;
    };
    error?: string;
}

export const isBotOrSystem = (login: string) => {
    const botPatterns = [
        /\[bot\]$/i,          // Matches names ending with [bot]
        /^dependabot/i,       // Dependabot
        /^renovate/i,         // Renovate bot
        /^semantic-release/i, // Semantic release bot
        /^vercel/i,          // Vercel
        /^github-actions/i,   // GitHub Actions
        /^system$/i,          // System
    ];

    return botPatterns.some(pattern => pattern.test(login));
};

export const checkRateLimit = async (): Promise<RateLimitResponse> => {
    try {
        const query = `
        query {
            rateLimit {
                limit
                remaining
                used
                resetAt
            }
        }
        `;

        const response = await graphqlClient.post('', { query });

        if (!response.data?.data?.rateLimit) {
            return {
                rateLimit: {
                    limit: 5000,
                    remaining: 0,
                    used: 5000,
                    resetAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
                },
                error: 'Could not fetch rate limit data'
            };
        }

        return { rateLimit: response.data.data.rateLimit };
    } catch (error) {
        return {
            rateLimit: {
                limit: 5000,
                remaining: 0,
                used: 5000,
                resetAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
            },
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};

export const projectsCache = new Cache<any>(5); // 5 minutes TTL

export const getProjectCacheStatus = () => {
    return projectsCache.getCacheInfo('projects');
};

export const fetchOrgProjects = async () => {
    try {
        // Check cache first
        const cachedData = projectsCache.get('projects');
        if (cachedData) {
            console.log('Returning cached project data');
            return cachedData;
        }

        // If no cache:
        // Check rate limit first
        const rateLimitResponse = await checkRateLimit();
        (window as any).DebugLogger.log('Rate limit response:', rateLimitResponse);

        if (rateLimitResponse.rateLimit.remaining === 0) {
            throw new Error('RATE_LIMITED');
        }

        const query = `
        query {
            organization(login: "Smartelco") {
                projectsV2(first: 20) {
                    nodes {
                        id
                        number
                        title
                        shortDescription
                        url
                        fields(first: 20) {
                            nodes {
                                __typename
                                ... on ProjectV2FieldCommon {
                                    id
                                    name
                                }
                                ... on ProjectV2SingleSelectField {
                                    id
                                    name
                                    options {
                                        id
                                        name
                                    }
                                }
                            }
                        }
                        items(first: 100) {
                            nodes {
                                id
                                content {
                                    __typename
                                    ... on Issue {
                                        number
                                        repository {
                                            name
                                        }
                                        assignees(first: 1) {
                                            nodes {
                                                login
                                                avatarUrl
                                            }
                                            totalCount
                                        }
                                        state
                                        title
                                    }
                                }
                                fieldValues(first: 20) {
                                    nodes {
                                        __typename
                                        ... on ProjectV2ItemFieldDateValue {
                                            field {
                                                ... on ProjectV2FieldCommon {
                                                    id
                                                    name
                                                }
                                            }
                                            date
                                        }
                                        ... on ProjectV2ItemFieldSingleSelectValue {
                                            field {
                                                ... on ProjectV2FieldCommon {
                                                    id
                                                    name
                                                }
                                            }
                                            name
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }`;

        const { data } = await graphqlClient.post('', { query });
        (window as any).DebugLogger.log('Project query response:', data);

        if (!data.data?.organization?.projectsV2?.nodes) {
            return [];
        }

        // Process the data
        const processedProjects = data.data.organization.projectsV2.nodes.map((project: any) => ({
            id: project.id,
            number: project.number,
            name: project.title,
            body: project.shortDescription,
            html_url: project.url,
            issues: (project.items?.nodes || [])
                .map((item: any) => {
                    if (!item?.content?.repository?.name) return null;

                    // Extract start date and due date from fieldValues
                    const fieldValues = item.fieldValues?.nodes || [];
                    const startDate = fieldValues.find((fv: any) =>
                        fv?.field?.name === 'Start date'
                    )?.date;
                    const dueDate = fieldValues.find((fv: any) =>
                        fv?.field?.name === 'Due date'
                    )?.date;
                    const status = fieldValues.find((fv: any) =>
                        fv?.field?.name === 'Status'
                    )?.name;

                    const assigneeNode = item.content.assignees?.nodes?.[0];

                    return {
                        number: item.content.number,
                        repository: item.content.repository.name,
                        start_date: startDate || null,
                        due_date: dueDate || null,
                        status: status || null,
                        assignee: assigneeNode ? {
                            login: assigneeNode.login,
                            avatar_url: assigneeNode.avatarUrl
                        } : null
                    };
                })
                .filter(Boolean)
        }));

        // Cache the result before returning
        projectsCache.set('projects', processedProjects);
        return processedProjects;
    } catch (error: unknown) {
        if (error instanceof Error && error.message === 'RATE_LIMITED') {
            throw error;
        }
        (window as any).DebugLogger.error('Error fetching projects:', error);
        return [];
    }
};

export const fetchOrgRepositories = async () => {
    try {
        const { data } = await restClient.get('/orgs/Smartelco/repos?per_page=100');
        return data;
    } catch (error) {
        (window as any).DebugLogger.error('Error fetching repositories:', error);
        return [];
    }
};

export const fetchRepoIssues = async (repoName: string) => {
    try {
        const { data: issues } = await restClient.get(`/repos/Smartelco/${repoName}/issues`, {
            params: {
                state: 'all',
                per_page: 100
            }
        });

        let projectData = [];
        try {
            const projects = await fetchOrgProjects();
            projectData = projects;
        } catch (error: unknown) {
            if (error instanceof Error && error.message.includes('RATE_LIMITED')) {
                (window as any).DebugLogger.warn('Project data not available due to rate limit');
            } else {
                (window as any).DebugLogger.error('Error fetching project data:', error);
            }
        }

        // Fetch comments untuk setiap issue
        const issuesWithComments = await Promise.all(issues.map(async (issue: any) => {
            try {
                const comments = await fetchIssueComments(repoName, issue.number);
                return {
                    ...issue,
                    comments: comments.map((comment: { id: any; body: any; user: { login: any; avatar_url: any; }; created_at: any; html_url: any; }) => ({
                        id: comment.id,
                        body: comment.body,
                        user: {
                            login: comment.user.login,
                            avatar_url: comment.user.avatar_url
                        },
                        created_at: comment.created_at,
                        html_url: comment.html_url
                    }))
                };
            } catch (error) {
                (window as any).DebugLogger.warn(
                    `Error fetching comments for issue #${issue.number}:`,
                    error
                );
                return {
                    ...issue,
                    comments: []
                };
            }
        }));

        // Map issues dengan project data dan comments
        return issuesWithComments.map((issue: any) => {
            const projectItem = projectData.length > 0 ?
                findProjectItem(projectData, issue.number, repoName) : null;

            return {
                number: issue.number,
                title: issue.title,
                state: issue.state.toLowerCase(),
                body: issue.body,
                created_at: issue.created_at,
                updated_at: issue.updated_at,
                repository: {
                    name: repoName,
                    full_name: `Smartelco/${repoName}`
                },
                assignee: issue.assignee ? {
                    login: issue.assignee.login,
                    avatar_url: issue.assignee.avatar_url
                } : null,
                start_date: projectItem?.start_date,
                due_date: projectItem?.due_date,
                comments: issue.comments // Menambahkan comments ke objek yang di-return
            };
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        (window as any).DebugLogger.warn(`Error fetching issues for ${repoName}:`, errorMessage);
        return [];
    }
};

interface ProjectItem {
    number: number;
    repository: string;
    start_date?: string;
    due_date?: string;
}

const findProjectItem = (
    projects: Array<{ issues?: ProjectItem[] }>,
    issueNumber: number,
    repoName: string
): ProjectItem | null => {
    for (const project of projects) {
        const item = project.issues?.find(i =>
            i.number === issueNumber && i.repository === repoName
        );
        if (item) return item;
    }
    return null;
};

export const fetchRepoPulls = async (repoName: string) => {
    try {
        // Dapatkan semua PR dulu
        const { data: prs } = await restClient.get(`/repos/Smartelco/${repoName}/pulls`, {
            params: {
                state: 'all',
                per_page: 100
            }
        });

        // Untuk setiap PR, ambil detail statistiknya
        const detailedPRs = await Promise.all(prs.map(async (pr: { number: any; }) => {
            try {
                const { data: details } = await restClient.get(
                    `repos/Smartelco/${repoName}/pulls/${pr.number}`
                );
                return {
                    ...pr,
                    additions: details.additions,
                    deletions: details.deletions,
                    changed_files: details.changed_files,
                    repository: {
                        name: repoName,
                        full_name: `Smartelco/${repoName}`
                    }
                };
            } catch (error) {
                (window as any).DebugLogger.warn(`Could not fetch details for PR #${pr.number}:`, error);
                return {
                    ...pr,
                    additions: 0,
                    deletions: 0,
                    changed_files: 0,
                    repository: {
                        name: repoName,
                        full_name: `Smartelco/${repoName}`
                    }
                };
            }
        }));

        return detailedPRs;
    } catch (error) {
        (window as any).DebugLogger.warn(`Error fetching pulls for ${repoName}:`, error);
        return [];
    }
};

export const fetchRepoCommits = async (repoName: string) => {
    try {
        // First check if the repository exists and has commits
        const repoResponse = await restClient.get(`/repos/Smartelco/${repoName}`);

        // If repository is empty, return empty array with repository info
        if (repoResponse.data.size === 0) {
            (window as any).DebugLogger.log(`Repository ${repoName} is empty`);
            return [{
                sha: '',
                commit: {
                    message: 'Repository is empty',
                    author: {
                        name: 'System',
                        email: '',
                        date: new Date().toISOString()
                    }
                },
                author: null,
                repository: {
                    name: repoName,
                    full_name: `Smartelco/${repoName}`
                }
            }];
        }

        const { data } = await restClient.get(`/repos/Smartelco/${repoName}/commits`, {
            params: { per_page: 100 }
        });

        return data.map((commit: any) => ({
            sha: commit.sha,
            commit: {
                message: commit.commit.message,
                author: {
                    name: commit.commit.author.name,
                    email: commit.commit.author.email,
                    date: commit.commit.author.date
                }
            },
            author: commit.author ? {
                login: commit.author.login,
                avatar_url: commit.author.avatar_url
            } : null,
            repository: {
                name: repoName,
                full_name: `Smartelco/${repoName}`
            }
        }));
    } catch (error: any) {
        if (error.response?.status === 409 || error.response?.status === 404) {
            return [{
                sha: '',
                commit: {
                    message: 'Repository not accessible',
                    author: {
                        name: 'System',
                        email: '',
                        date: new Date().toISOString()
                    }
                },
                author: null,
                repository: {
                    name: repoName,
                    full_name: `Smartelco/${repoName}`
                }
            }];
        }

        (window as any).DebugLogger.warn(`Error fetching commits for ${repoName}:`, error);
        return [];
    }
};

// Add to existing fetchRepoIssues function
const fetchIssueComments = async (repoName: string, issueNumber: number) => {
    try {
        const { data } = await restClient.get(
            `/repos/Smartelco/${repoName}/issues/${issueNumber}/comments`
        );

        return data.map((comment: any) => ({
            id: comment.id,
            body: comment.body,
            user: {
                login: comment.user.login,
                avatar_url: comment.user.avatar_url
            },
            created_at: comment.created_at,
            html_url: comment.html_url
        }));


    } catch (error) {
        (window as any).DebugLogger.warn(`Error fetching comments for issue #${issueNumber}:`, error);
        return [];
    }
};

// Add to existing fetchRepoPulls function
const fetchPullComments = async (repoName: string, pullNumber: number) => {
    try {
        const { data } = await restClient.get(
            `/repos/Smartelco/${repoName}/pulls/${pullNumber}/comments`
        );
        console.log('Pull comments:', data);
        return data.map((comment: any) => ({
            id: comment.id,
            body: comment.body,
            user: {
                login: comment.user.login,
                avatar_url: comment.user.avatar_url
            },
            created_at: comment.created_at,
            html_url: comment.html_url,
            path: comment.path,
            position: comment.position
        }));
    } catch (error) {
        (window as any).DebugLogger.warn(`Error fetching comments for PR #${pullNumber}:`, error);
        return [];
    }
};

export const fetchGithubData = async () => {
    try {
        // Fetch basic data first
        const [membersResponse, reposResponse] = await Promise.all([
            restClient.get('/orgs/Smartelco/members?per_page=100'),
            restClient.get('/orgs/Smartelco/repos?per_page=100'),
        ]);

        const members = membersResponse.data;
        const repositories = reposResponse.data;

        // Fetch projects with rate limit handling
        let projects = [];
        try {
            projects = await fetchOrgProjects();
        } catch (error) {
            if (error instanceof Error && error.message === 'RATE_LIMITED') {
                (window as any).DebugLogger.warn('Projects data not available due to rate limit');
                // Continue with empty projects array
            } else {
                throw error;
            }
        }

        // Get all repos data
        const [issuesArrays, pullsArrays, commitsArrays] = await Promise.all([
            Promise.all(repositories.map((repo: { name: string; }) => fetchRepoIssues(repo.name))),
            Promise.all(repositories.map((repo: { name: string; }) => fetchRepoPulls(repo.name))),
            Promise.all(repositories.map((repo: { name: string; }) => fetchRepoCommits(repo.name)))
        ]);

        // Safely process comments
        const issueComments = await Promise.all(
            issuesArrays.flat()
                .filter(issue => issue?.repository?.number)
                .map(issue => fetchIssueComments(issue.repository.name, issue.number))
        );

        const pullComments = await Promise.all(
            pullsArrays.flat()
                .filter(pull => pull?.repository?.number != null)
                .map(pull => fetchPullComments(pull.repository.name, pull.number))
        );

        // Create timeline events safely
        const timelineEvents: TimelineEvent[] = [
            // Commit events
            ...commitsArrays.flat()
                .filter(commit =>
                    commit?.repository &&
                    commit?.author?.login &&
                    !isBotOrSystem(commit.author.login)
                )
                .map(commit => ({
                    id: commit.sha || 'no-sha',
                    type: 'commit' as TimelineEventType,
                    title: commit.commit?.message?.split('\n')[0] || 'No message',
                    content: commit.commit?.message?.split('\n').slice(1).join('\n') || '',
                    author: commit.author || {
                        login: commit.commit?.author?.name || 'Unknown',
                        avatar_url: 'https://github.com/ghost.png'
                    },
                    timestamp: commit.commit?.author?.date || new Date().toISOString(),
                    repository: commit.repository.name,
                    linkUrl: commit.sha ?
                        `https://github.com/${commit.repository.full_name}/commit/${commit.sha}` :
                        `https://github.com/${commit.repository.full_name}`
                })),

            // Issue Comments
            ...issueComments.flat()
                .filter(comment =>
                    comment?.id &&
                    comment.created_at &&
                    comment.user?.login &&
                    !isBotOrSystem(comment.user.login)
                )
                .map(comment => ({
                    id: comment.id.toString(),
                    type: 'issue_comment' as TimelineEventType,
                    title: 'Commented on issue',
                    content: comment.body || 'No content',
                    author: {
                        login: comment.user.login,
                        avatar_url: comment.user.avatar_url || 'https://github.com/ghost.png'
                    },
                    timestamp: comment.created_at,
                    repository: comment.repository?.name || 'Unknown',
                    linkUrl: comment.html_url || ''
                })),

            // Pull Request Comments
            ...pullComments.flat()
                .filter(comment =>
                    comment?.id &&
                    comment?.created_at &&
                    comment?.user?.login &&
                    !isBotOrSystem(comment.user.login)
                )
                .map(comment => ({
                    id: comment.id.toString(),
                    type: 'pr_comment' as TimelineEventType,
                    title: `Commented on ${comment.path || 'file'}`,
                    content: comment.body || 'No content',
                    author: {
                        login: comment.user.login,
                        avatar_url: comment.user.avatar_url || 'https://github.com/ghost.png'
                    },
                    timestamp: comment.created_at,
                    repository: comment.repository?.name || 'Unknown',
                    linkUrl: comment.html_url || ''
                }))
        ].sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        return {
            members,
            repositories,
            projects,
            issues: issuesArrays.flat().filter(issue => issue && issue.repository),
            pullRequests: pullsArrays.flat().filter(pull => pull && pull.repository),
            commits: commitsArrays.flat().filter(commit => commit && commit.repository),
            timelineEvents,
            hasProjectData: projects.length > 0
        };
    } catch (error) {
        (window as any).DebugLogger.error('Error fetching Github data:', error);
        throw error;
    }
};