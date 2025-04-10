import { IssueComment } from "../types/github";

interface AssigneeFromComment {
    is_primary: boolean;
    login: string;
    avatar_url: string;
    assigned_at: string;
    assigned_by: string;
}

export const parseAssignmentComment = (comment: IssueComment): AssigneeFromComment[] => {
    const body = comment.body.toLowerCase().trim();

    // If only '/assign'
    if (body === '/assign') {
        return [{
            is_primary: true,
            login: comment.user.login,
            avatar_url: comment.user.avatar_url,
            assigned_at: comment.created_at,
            assigned_by: comment.user.login
        }];
    }

    // If body starts with '/assign @username1 @username2 ...'
    if (body.startsWith('/assign @')) {
        // Extract semua username yang di-mention
        const mentions = body.match(/@[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}/gi) || [];

        // Delete @ from username
        return mentions.map(mention => ({
            is_primary: false,
            login: mention.slice(1), // Delete @
            avatar_url: `https://github.com/${mention.slice(1)}.png`, // GitHub avatar URL
            assigned_at: comment.created_at,
            assigned_by: comment.user.login
        }));
    }

    return [];
};

export const getAdditionalAssignees = (comments: any = []) => {
    const assigneesFromComments = comments
        .filter((comment : any) => comment.body.toLowerCase().trim().startsWith('/assign'))
        .flatMap((comment : any) => parseAssignmentComment(comment));

    const uniqueAssignees = new Map<string, AssigneeFromComment>();
    assigneesFromComments.forEach((assignee : any) => {
        if (!uniqueAssignees.has(assignee.login) ||
            new Date(assignee.assigned_at) > new Date(uniqueAssignees.get(assignee.login)!.assigned_at)) {
            uniqueAssignees.set(assignee.login, assignee);
        }
    });

    return Array.from(uniqueAssignees.values());
};