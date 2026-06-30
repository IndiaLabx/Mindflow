/**
 * Utility function to conditionally join class names.
 *
 * This function takes any number of arguments, which can be strings, undefined, null, or false.
 * It filters out falsy values and joins the remaining strings with a space.
 * Useful for conditionally applying CSS classes in React components.
 *
 * @param {...(string | undefined | null | false)[]} classes - A list of class names or conditional expressions.
 * @returns {string} A single string containing the valid class names joined by spaces.
 */
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
