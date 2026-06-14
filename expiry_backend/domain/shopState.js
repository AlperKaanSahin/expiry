const SHOP_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  REJECTED: 'rejected'
};

const TRANSITIONS = {
  pending: ['active', 'rejected'],
  active: ['inactive'],
  inactive: ['active'],
  rejected: []
};

function canTransition(from, to) {
  return TRANSITIONS[from].includes(to);
}

module.exports = {
  SHOP_STATUS,
  TRANSITIONS,
  canTransition
};