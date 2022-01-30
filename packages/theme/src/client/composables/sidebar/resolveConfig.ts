import { useRoute } from "vue-router";
import { usePageData, usePageFrontmatter } from "@vuepress/client";
import { isArray, isPlainObject, isString } from "@vuepress/shared";
import { useAutoLink } from "../navLink";
import { resolvePrefix } from "./utils";
import { useThemeLocaleData } from "../themeData";

import type { PageHeader } from "@vuepress/client";
import type {
  HopeThemeNormalPageFrontmatter,
  SidebarConfigArray,
  SidebarConfigObject,
  SidebarItem,
  ResolvedSidebarItem,
  ResolvedSidebarHeaderItem,
  ResolvedSidebarPageItem,
  ResolvedSidebarGroupItem,
} from "../../../shared";

/**
 * Util to transform page header to sidebar item
 */
export const headerToSidebarItem = (
  header: PageHeader,
  sidebarDepth: number
): ResolvedSidebarHeaderItem => {
  const page = usePageData();

  return {
    type: "heading",
    text: header.title,
    link: `${page.value.path}#${header.slug}`,
    children: headersToSidebarItemChildren(header.children, sidebarDepth),
  };
};

export const headersToSidebarItemChildren = (
  headers: PageHeader[],
  sidebarDepth: number
): ResolvedSidebarHeaderItem[] =>
  sidebarDepth > 0
    ? headers.map((header) => headerToSidebarItem(header, sidebarDepth - 1))
    : [];

/**
 * Resolve sidebar items if the config is `auto`
 */
export const resolveAutoSidebarItems = (
  sidebarDepth: number
): ResolvedSidebarGroupItem[] => {
  const frontmatter = usePageFrontmatter<HopeThemeNormalPageFrontmatter>();
  const page = usePageData();

  return [
    {
      type: "group",
      text: page.value.title,
      icon: frontmatter.value.icon,
      children: headersToSidebarItemChildren(page.value.headers, sidebarDepth),
    },
  ];
};

/**
 * Resolve sidebar items if the config is an array
 */
export const resolveArraySidebarItems = (
  sidebarConfig: SidebarConfigArray,
  sidebarDepth: number,
  prefix = ""
): ResolvedSidebarItem[] => {
  const page = usePageData();
  const route = useRoute();

  const handleChildItem = (
    item: SidebarItem,
    pathPrefix = prefix
  ): ResolvedSidebarPageItem | ResolvedSidebarGroupItem => {
    const childItem = isString(item)
      ? useAutoLink(resolvePrefix(pathPrefix, item))
      : item.link
      ? { ...item, link: resolvePrefix(pathPrefix, item.link) }
      : item;

    // resolved group item
    if ("children" in childItem) {
      return {
        type: "group",
        ...childItem,
        children: childItem.children.map((item) =>
          handleChildItem(item, resolvePrefix(pathPrefix, childItem.prefix))
        ),
      };
    }

    return {
      type: "page",
      ...childItem,
      children:
        // if the sidebar item is current page and children is not set
        // use headers of current page as children
        childItem.link === route.path
          ? headersToSidebarItemChildren(
              // skip h1 header
              page.value.headers[0]?.level === 1
                ? page.value.headers[0].children
                : page.value.headers,
              sidebarDepth
            )
          : [],
    };
  };

  return sidebarConfig.map((item) => handleChildItem(item));
};

/**
 * Resolve sidebar items if the config is a key -> value (path-prefix -> array) object
 */
export const resolveMultiSidebarItems = (
  sidebarConfig: SidebarConfigObject,
  sidebarDepth: number
): ResolvedSidebarItem[] => {
  const route = useRoute();
  const keys = Object.keys(sidebarConfig).sort((x, y) => y.length - x.length);

  // find matching config
  for (const base of keys) {
    if (route.path.startsWith(base))
      return resolveArraySidebarItems(
        sidebarConfig[base] ?? [],
        sidebarDepth,
        base
      );
  }

  console.warn(`${route.path} do not have valid sidebar config`);

  return [];
};

/**
 * Resolve sidebar items global computed
 *
 * It should only be resolved and provided once
 */
export const resolveSidebarItems = (): ResolvedSidebarItem[] => {
  const frontmatter = usePageFrontmatter<HopeThemeNormalPageFrontmatter>();
  const themeLocale = useThemeLocaleData();

  // get sidebar config from frontmatter > themeConfig
  const sidebarConfig = frontmatter.value.home
    ? false
    : frontmatter.value.sidebar ?? themeLocale.value.sidebar ?? "auto";
  const sidebarDepth =
    frontmatter.value.headingDepth ?? themeLocale.value.headingDepth ?? 2;

  // resolve sidebar items according to the config
  return sidebarConfig === false
    ? []
    : sidebarConfig === "auto"
    ? resolveAutoSidebarItems(sidebarDepth)
    : isArray(sidebarConfig)
    ? resolveArraySidebarItems(sidebarConfig, sidebarDepth)
    : isPlainObject(sidebarConfig)
    ? resolveMultiSidebarItems(sidebarConfig, sidebarDepth)
    : [];
};
