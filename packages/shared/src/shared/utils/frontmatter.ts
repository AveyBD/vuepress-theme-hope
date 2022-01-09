import { _getAuthor } from "./info";

import type {
  Author,
  AuthorInfo,
  BasePageFrontMatter,
  BaseThemeConfig,
} from "../types";

export const getAuthor = (
  frontmatter: BasePageFrontMatter,
  themeConfig: BaseThemeConfig,
  fallback?: Author
): AuthorInfo[] => {
  const { author } = frontmatter;

  if (author) return _getAuthor(author);
  if (author === false) return [];

  if (fallback) return _getAuthor(fallback, false);

  return _getAuthor(themeConfig.author, false);
};
