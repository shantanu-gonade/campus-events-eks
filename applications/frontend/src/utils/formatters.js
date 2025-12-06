// Format date to readable string
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Format date and time
export const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Format time only
export const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Calculate days until event
export const daysUntilEvent = (dateString) => {
  const eventDate = new Date(dateString);
  const today = new Date();
  const diffTime = eventDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'Event has passed';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  return `In ${diffDays} days`;
};

// Check if event is upcoming
export const isUpcoming = (dateString) => {
  return new Date(dateString) > new Date();
};

// Check if event is past
export const isPast = (dateString) => {
  return new Date(dateString) < new Date();
};

// Format capacity as percentage
export const formatCapacity = (current, max) => {
  if (!max || max === 0) return '0%';
  return `${Math.round((current / max) * 100)}%`;
};

// Calculate capacity percentage
export const getCapacityPercentage = (current, max) => {
  if (!max || max === 0) return 0;
  return (current / max) * 100;
};

// Get capacity status color
export const getCapacityColor = (current, max) => {
  const percentage = getCapacityPercentage(current, max);
  if (percentage >= 90) return 'error';
  if (percentage >= 70) return 'warning';
  return 'success';
};

// Truncate text with ellipsis
export const truncateText = (text, maxLength = 150) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Generate initials from name
export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

// Format number with commas
export const formatNumber = (num) => {
  return new Intl.NumberFormat('en-US').format(num);
};

// Get relative time (e.g., "2 hours ago")
export const getRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return formatDate(dateString);
};
