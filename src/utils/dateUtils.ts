export const calculateDueStatus = (dueDate: string | undefined, state: string) => {
    if (state === 'closed') return 'safe';
    
    if (!dueDate) return 'none';
    
    const now = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24));
    
    if (diffDays < 0) return 'overdue';
    if (diffDays <= 7) return 'soon';
    return 'safe';
};

export const getDueStatusColor = (status: string) => {
    switch (status) {
        case 'overdue':
            return 'danger'; // atau 'red'
        case 'soon':
            return 'warning'; // atau 'yellow'
        case 'safe':
            return 'success'; // atau 'green'
        default:
            return 'neutral'; // atau 'gray'
    }
};