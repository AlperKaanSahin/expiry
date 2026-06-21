export const actionsByStatus = {
    pending: ['approve', 'reject'],
    active: ['deactivate'],
    inactive: ['activate'],
    rejected: []
};

export const actionToStatus = {
    approve: 'active',
    reject: 'rejected',
    deactivate: 'inactive',
    activate: 'active'
};

export const actionLabels = {
    approve: 'Onayla',
    reject: 'Reddet',
    deactivate: 'Pasifleştir',
    activate: 'Aktif Et'
};

export const actionColors = {
    approve: '#4CAF50',
    reject: '#F44336',
    deactivate: '#FF9800',
    activate: '#2196F3'
};