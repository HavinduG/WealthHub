/**
 * Splits a CMS title into a plain part and an accent part (shown in italic
 * serif across the site). Wrap words in asterisks in WordPress to choose them
 * ("Buy your home with *total confidence.*"); otherwise the last `accentWords`
 * words are used. Titles with no more words than that get no accent.
 */
export function splitAccent(title: string, accentWords = 2) {
  const marked = title.match(/^(.*?)\*(.+?)\*(.*)$/);
  if (marked) return { before: marked[1], accent: marked[2], after: marked[3] };

  const words = title.trim().split(/\s+/);
  if (words.length <= accentWords + 1) return { before: title, accent: "", after: "" };
  return {
    before: `${words.slice(0, -accentWords).join(" ")} `,
    accent: words.slice(-accentWords).join(" "),
    after: "",
  };
}
