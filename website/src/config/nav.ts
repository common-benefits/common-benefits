/** A dropdown menu rendered in the site header. */
export interface NavMenuGroup {
  label: string;
  items: Array<{
    label: string;
    href: string;
    external?: boolean;
  }>;
}

/** Dropdown menus rendered in the site header. */
export const navMenuItems: NavMenuGroup[] = [
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
