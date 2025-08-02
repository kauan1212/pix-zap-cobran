/**
 * Utility functions for safe date formatting without timezone issues
 */

/**
 * Safely formats a date string in YYYY-MM-DD format to Brazilian format (DD/MM/YYYY)
 * without timezone conversion issues
 */
export const formatDateSafely = (dateString: string): string => {
  // Parse the date string manually to avoid timezone issues
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Create date in local timezone
  const date = new Date(year, month - 1, day);
  
  // Format to Brazilian format
  return date.toLocaleDateString('pt-BR');
};

/**
 * Safely parses a date string and returns a Date object in local timezone
 */
export const parseDateSafely = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};