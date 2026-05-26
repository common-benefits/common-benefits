import type { Props as NavMenuItem } from "@/components/NavMenuItem.astro";

/** Dropdown menus rendered in the site header. */
export const navMenuItems: NavMenuItem[] = [
  {
    label: "Learn",
    items: [
      { label: "Getting started", href: "/getting-started/" },
      { label: "About CommonBenefits", href: "/about/" },
    ],
  },
  {
    label: "Protocol",
    items: [
      { label: "API docs", href: "/protocol/api-docs" },
      { label: "Overview", href: "/protocol/overview" },
      { label: "Types", href: "/protocol/types/" },
      { label: "Fields", href: "/protocol/fields/" },
      { label: "Models", href: "/protocol/models/" },
      { label: "Filters", href: "/protocol/filters/" },
      { label: "Responses", href: "/protocol/responses/" },
    ],
  },
];
