export const PRIORITY_LEVELS = {
  1: { label: 'LOW', color: 'green', desc: 'Minor Request' },
  2: { label: 'MEDIUM', color: 'blue', desc: 'Standard Support' },
  3: { label: 'HIGH', color: 'orange', desc: 'Urgent Issue' },
  4: { label: 'CRITICAL', color: 'red', desc: 'Service Down' },
};

export const TICKET_STATUS = {
  open: { label: 'Open', status: 'error' },
  'in progress': { label: 'In Progress', status: 'processing' },
  resolved: { label: 'Resolved', status: 'success' },
  cancelled: { label: 'Cancelled', status: 'default' },
};
