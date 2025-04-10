export interface GithubMember {
  login: string;
  name?: string;
  avatar_url: string;
  html_url: string;
  type: string;
}

export interface MemberDetailedStats {
  member: GithubMember;
  projects: Array<{
    name: string;
    description: string;
    issues: Array<ProjectIssue>;
  }>;
  repoMap: Record<string, ExtendedGithubRepo>;
  projectMap: Record<string, ExtendedGithubProject>;
}

export interface ExtendedGithubProject {
  id: number;
  name: string;
  description: string;
  html_url: string;
  issues: Array<ProjectIssue>;
  contributors: Array<{
    login: string;
    avatar_url: string;
    name?: string;
  }>;
}

export interface ProjectIssue {
  id: number;
  title: string;
  state: string;
  created_at: string;
  updated_at: string;
  author?: {
    login: string;
  };
}

export interface GithubIssue {
  id: number;
  title: string;
  state: string;
  created_at: string;
  updated_at: string;
  author?: {
    login: string;
  };
}

export interface ExtendedGithubRepo {
  id: number;
  name: string;
  description: string;
  html_url: string;
  issues: Array<GithubIssue>;
  contributors: Array<{
    login: string;
    avatar_url: string;
    name?: string;
  }>;
} 