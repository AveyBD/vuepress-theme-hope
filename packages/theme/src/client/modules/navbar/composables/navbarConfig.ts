import { isLinkExternal, isString } from "@vuepress/shared";
import { computed } from "vue";

import { useAutoLink, useThemeLocaleData } from "@theme-hope/composables/index";

import type { ComputedRef } from "vue";
import type { ResolvedThemeNavbarItem } from "../utils/index.js";
import type {
  AutoLinkOptions,
  NavGroup,
  NavbarGroup,
  NavbarItem,
} from "../../../../shared/index.js";

export const resolveNavbarItem = (
  item: NavbarItem | NavbarGroup | string,
  prefix = ""
): ResolvedThemeNavbarItem => {
  if (isString(item)) return useAutoLink(`${prefix}${item}`);

  if ("children" in item)
    return {
      ...item,
      ...(item.link && !isLinkExternal(item.link)
        ? useAutoLink(`${prefix}${item.link}`)
        : {}),
      children: item.children.map(
        (child) =>
          resolveNavbarItem(child, `${prefix}${item.prefix || ""}`) as
            | NavGroup<AutoLinkOptions>
            | AutoLinkOptions
      ),
    };

  return {
    ...item,
    link: isLinkExternal(item.link)
      ? item.link
      : useAutoLink(`${prefix}${item.link}`).link,
  };
};

export const useNavbarConfig = (): ComputedRef<ResolvedThemeNavbarItem[]> =>
  computed(() =>
    (useThemeLocaleData().value.navbar || []).map((item) =>
      resolveNavbarItem(item)
    )
  );
