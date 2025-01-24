/**
 * Utility function to conditionally join class names
 * @param classes - A list of class names or conditional class expressions
 * @returns A single concatenated string of class names
 */
export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}
