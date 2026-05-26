// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightLinksValidator from "starlight-links-validator";
import { pagesByCategory, type PageEntry, type ProtocolCategory } from "./src/lib/protocol-catalog";

const categoryGroup = (label: string, category: ProtocolCategory) => ({
  label,
  collapsed: true,
  items: pagesByCategory(category).map((p: PageEntry) => ({
    label: p.title,
    link: `/protocol/${category}/${p.page}`,
  })),
});

// https://astro.build/config
export default defineConfig({
  site: "https://common-benefits.example",
  integrations: [
    starlight({
      title: "CommonBenefits",
      customCss: ["./src/styles/custom.css"],
      components: {
        Header: "./src/components/starlight-overrides/Header.astro",
        PageFrame: "./src/components/starlight-overrides/PageFrame.astro",
      },
      plugins: [
        starlightLinksValidator({
          // Pages under /protocol/{fields,filters,responses,types,models}/ are
          // custom Astro routes (src/pages/), not Starlight content entries,
          // so the validator can't see them. Exclude those URL patterns from
          // validation; broken links between content pages still surface.
          exclude: [
            "/protocol/fields/**",
            "/protocol/filters/**",
            "/protocol/responses/**",
            "/protocol/types/**",
            "/protocol/models/**",
            "/protocol/api-docs",
          ],
        }),
      ],
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/OWNER/common-benefits",
        },
      ],
      sidebar: [
        { label: "Introduction", link: "/" },
        {
          label: "Protocol",
          items: [
            { label: "Overview", link: "/protocol/overview" },
            { label: "API docs", link: "/protocol/api-docs" },
            categoryGroup("Types", "types"),
            categoryGroup("Fields", "fields"),
            categoryGroup("Models", "models"),
            categoryGroup("Filters", "filters"),
            categoryGroup("Responses", "responses"),
            { label: "Pagination", link: "/protocol/pagination" },
            { label: "Sorting", link: "/protocol/sorting" },
          ],
        },
      ],
    }),
  ],
});
