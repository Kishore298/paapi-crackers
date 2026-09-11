export const ORDER_STATUS = {
  PROCESSING: 'Processing',
  DISPATCHED: 'Dispatched',
  CANCELLED: 'Cancelled',
};

export const PAYMENT_STATUS = {
  PENDING: 'Pending',
  COMPLETED: 'Completed',
};

export const STATUS_COLORS = {
  Processing: 'badge-processing',
  Dispatched: 'badge-dispatched',
  Cancelled: 'badge-cancelled',
  Pending: 'badge-pending',
  Completed: 'badge-completed',
};

const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
export const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || apiUrl.replace(/\/api\/?$/, '');
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
