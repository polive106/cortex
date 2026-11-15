/**
 * The design kit for HTML artifacts (ADR-0012, E5-US04): the web app's shadcn tokens, the
 * new-york component recipes as Tailwind classes, and a starter page. The sandbox gets these as
 * files under design/, and the artifact builder compiles pages on THEME_CSS, so a page looks the
 * same in the sandbox, the preview, and the brain. Tokens must match apps/web/app/globals.css
 * (design-kit.test.ts checks).
 */

const LIGHT = {
  background: "oklch(0.971 0 0)",
  foreground: "oklch(0.16 0 0)",
  card: "oklch(1 0 0)",
  "card-foreground": "oklch(0.16 0 0)",
  popover: "oklch(1 0 0)",
  "popover-foreground": "oklch(0.16 0 0)",
  primary: "oklch(0.19 0 0)",
  "primary-foreground": "oklch(0.985 0 0)",
  secondary: "oklch(0.94 0 0)",
  "secondary-foreground": "oklch(0.19 0 0)",
  muted: "oklch(0.94 0 0)",
  "muted-foreground": "oklch(0.6 0 0)",
  accent: "oklch(0.94 0 0)",
  "accent-foreground": "oklch(0.19 0 0)",
  destructive: "oklch(0.577 0.245 27.325)",
  border: "oklch(0.916 0 0)",
  input: "oklch(0.916 0 0)",
  ring: "oklch(0.708 0 0)",
  radius: "0.625rem",
} as const;

const DARK: Record<Exclude<keyof typeof LIGHT, "radius">, string> = {
  background: "oklch(0.145 0 0)",
  foreground: "oklch(0.985 0 0)",
  card: "oklch(0.205 0 0)",
  "card-foreground": "oklch(0.985 0 0)",
  popover: "oklch(0.205 0 0)",
  "popover-foreground": "oklch(0.985 0 0)",
  primary: "oklch(0.922 0 0)",
  "primary-foreground": "oklch(0.205 0 0)",
  secondary: "oklch(0.269 0 0)",
  "secondary-foreground": "oklch(0.985 0 0)",
  muted: "oklch(0.269 0 0)",
  "muted-foreground": "oklch(0.708 0 0)",
  accent: "oklch(0.269 0 0)",
  "accent-foreground": "oklch(0.985 0 0)",
  destructive: "oklch(0.704 0.191 22.216)",
  border: "oklch(1 0 0 / 10%)",
  input: "oklch(1 0 0 / 15%)",
  ring: "oklch(0.556 0 0)",
};

export const DESIGN_TOKENS = { light: LIGHT, dark: DARK };

const vars = (tokens: Record<string, string>, indent: string) =>
  Object.entries(tokens)
    .map(([name, value]) => `${indent}--${name}: ${value};`)
    .join("\n");

const COLORS = Object.keys(DARK)
  .map((name) => `  --color-${name}: var(--${name});`)
  .join("\n");

/** Tailwind theme and base styles, appended after `@import "tailwindcss"`. */
export const THEME_CSS = `@theme inline {
${COLORS}
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

/* Artifacts can't load web fonts (their CSP blocks the network), so they use the system stack. */
@theme {
  --font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

@custom-variant dark (@media (prefers-color-scheme: dark));

:root {
  color-scheme: light;
${vars(LIGHT, "  ")}
}

@media (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;
${vars(DARK, "    ")}
  }
}

@layer base {
  * {
    border-color: var(--border);
  }
  html {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  body {
    margin: 0;
    background: var(--background);
    color: var(--foreground);
    font-family: var(--font-sans);
  }
}
`;

const COMPONENTS_MD = `# Components (shadcn new-york)

Write these as plain HTML with exactly these classes. Colors come from the tokens in theme.css:
\`bg-background\`, \`bg-card\`, \`bg-muted\`, \`bg-primary\`, \`text-foreground\`,
\`text-muted-foreground\`, \`text-primary-foreground\`, \`border\`, \`text-destructive\`,
\`ring-ring\`. Never hard-code colors; the page then follows light and dark mode for free.
Any other Tailwind v4 utility works too (\`grid\`, \`md:grid-cols-3\`, \`gap-4\`, \`w-[37px]\`).

## Layout

- Page: \`<body class="min-h-screen bg-background text-foreground antialiased">\`
- Container: \`<main class="mx-auto flex max-w-5xl flex-col gap-6 p-6 sm:p-10">\`
- Heading: \`<h1 class="text-3xl font-semibold tracking-tight">\`, section title
  \`<h2 class="text-xl font-semibold tracking-tight">\`, lead
  \`<p class="text-muted-foreground">\`
- Separator: \`<div class="h-px w-full bg-border" role="separator"></div>\`

## Button

Base: \`inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50\`

| Variant | Add |
|---------|-----|
| default | \`bg-primary text-primary-foreground hover:bg-primary/90\` |
| secondary | \`bg-secondary text-secondary-foreground hover:bg-secondary/80\` |
| outline | \`border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground\` |
| ghost | \`hover:bg-accent hover:text-accent-foreground\` |
| destructive | \`bg-destructive text-white hover:bg-destructive/90\` |

Sizes: sm \`h-8 px-3\`, lg \`h-10 px-6\`, icon \`size-9 px-0\`.

## Card

\`\`\`html
<div class="flex flex-col gap-6 rounded-xl border bg-card py-6 text-card-foreground shadow-sm">
  <div class="flex flex-col gap-1.5 px-6">
    <div class="leading-none font-semibold">Title</div>
    <div class="text-sm text-muted-foreground">Description</div>
  </div>
  <div class="px-6">Content</div>
  <div class="flex items-center px-6">Footer</div>
</div>
\`\`\`

Stat card: title \`text-sm text-muted-foreground\`, value \`text-3xl font-semibold tabular-nums\`.

## Badge

Base: \`inline-flex w-fit items-center justify-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap\`
- default \`border-transparent bg-primary text-primary-foreground\`
- secondary \`border-transparent bg-secondary text-secondary-foreground\`
- outline \`text-foreground\`
- destructive \`border-transparent bg-destructive text-white\`

## Table

\`\`\`html
<div class="relative w-full overflow-x-auto rounded-xl border bg-card">
  <table class="w-full caption-bottom text-sm">
    <thead class="[&_tr]:border-b">
      <tr class="border-b"><th class="h-10 px-3 text-left align-middle font-medium whitespace-nowrap text-foreground">Name</th></tr>
    </thead>
    <tbody class="[&_tr:last-child]:border-0">
      <tr class="border-b transition-colors hover:bg-muted/50"><td class="p-3 align-middle whitespace-nowrap">Ada</td></tr>
    </tbody>
  </table>
</div>
\`\`\`

## Input and label

- Label: \`<label class="text-sm leading-none font-medium">\`
- Input: \`<input class="h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm">\`

## Alert

\`\`\`html
<div role="alert" class="relative grid w-full gap-1 rounded-lg border bg-card px-4 py-3 text-sm">
  <div class="font-medium tracking-tight">Heads up</div>
  <div class="text-muted-foreground">Details.</div>
</div>
\`\`\`

Destructive alert: add \`text-destructive\` to the outer div.

## Tabs (needs the inline script)

\`\`\`html
<div data-tabs class="flex flex-col gap-2">
  <div role="tablist" class="inline-flex h-9 w-fit items-center justify-center rounded-lg bg-muted p-[3px] text-muted-foreground">
    <button role="tab" data-tab="one" class="inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center rounded-md px-3 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] aria-selected:bg-background aria-selected:text-foreground aria-selected:shadow-sm">One</button>
    <button role="tab" data-tab="two" class="(same classes)">Two</button>
  </div>
  <div role="tabpanel" data-panel="one">First</div>
  <div role="tabpanel" data-panel="two" hidden>Second</div>
</div>
<script>
  for (const tabs of document.querySelectorAll("[data-tabs]")) {
    const select = (name) => {
      for (const tab of tabs.querySelectorAll("[data-tab]")) tab.setAttribute("aria-selected", String(tab.dataset.tab === name));
      for (const panel of tabs.querySelectorAll("[data-panel]")) panel.hidden = panel.dataset.panel !== name;
    };
    tabs.addEventListener("click", (event) => { const tab = event.target.closest("[data-tab]"); if (tab) select(tab.dataset.tab); });
    select(tabs.querySelector("[data-tab]").dataset.tab);
  }
</script>
\`\`\`

## Charts

No chart libraries can load. Draw simple charts with inline SVG or CSS bars, colored with
\`fill-primary\`, \`fill-muted-foreground\`, \`bg-primary\`, and label them in \`text-muted-foreground\`.
`;

const TEMPLATE_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Title</title>
</head>
<body class="min-h-screen bg-background text-foreground antialiased">
  <main class="mx-auto flex max-w-5xl flex-col gap-6 p-6 sm:p-10">
    <header class="flex flex-col gap-2">
      <h1 class="text-3xl font-semibold tracking-tight">Title</h1>
      <p class="text-muted-foreground">One line on what this page is.</p>
    </header>
    <section class="grid gap-4 md:grid-cols-3">
      <div class="flex flex-col gap-2 rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
        <div class="text-sm text-muted-foreground">Metric</div>
        <div class="text-3xl font-semibold tabular-nums">42</div>
      </div>
    </section>
  </main>
</body>
</html>
`;

const README_MD = `# Design kit

Artifacts use the same shadcn design system as the web app.

- \`theme.css\`: the tokens and Tailwind theme. It is compiled in for you when you publish; don't
  link or copy it into the page.
- \`components.md\`: class recipes for buttons, cards, badges, tables, inputs, alerts and tabs.
- \`template.html\`: a starter page. Copy it to \`artifacts/<slug>/index.html\`.
`;

/** The files the sandbox gets under `design/`. */
export const DESIGN_KIT_FILES: Readonly<Record<string, string>> = {
  "design/README.md": README_MD,
  "design/theme.css": THEME_CSS,
  "design/components.md": COMPONENTS_MD,
  "design/template.html": TEMPLATE_HTML,
};
