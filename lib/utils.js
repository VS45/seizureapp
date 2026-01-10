import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date) {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStatusColor(status) {
  const colors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    suspended: 'bg-red-100 text-red-800',
    issued: 'bg-blue-100 text-blue-800',
    returned: 'bg-gray-100 text-gray-800',
    overdue: 'bg-red-100 text-red-800',
    due: 'bg-yellow-100 text-yellow-800',
    pending: 'bg-blue-100 text-blue-800',
    serviceable: 'bg-green-100 text-green-800',
    unserviceable: 'bg-red-100 text-red-800',
    'under_maintenance': 'bg-yellow-100 text-yellow-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}