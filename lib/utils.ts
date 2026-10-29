/** Join optional utility classes without introducing a styling dependency. */
export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
