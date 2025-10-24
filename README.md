# White‑Label the Documentation (Mintlify)

Autocalls is a voice AI platform for automated outbound/inbound calls, SMS, and workflow automation. You can fully white‑label the product and these docs to your own brand. To learn more about white‑labeling the platform beyond documentation, see our [White‑Label program](https://autocalls.ai/white-label).

This guide walks you through creating your own white‑labeled copy of our documentation using Mintlify, updating the branding (colors, logos, name), deploying it to your Mintlify subdomain or custom domain, and finally linking the live docs in your admin panel.

## What you'll set up

- A new GitHub repository under your organization, containing these docs
- Your brand applied via `mint.json` (name, colors, logos, favicon)
- Deployed documentation on your Mintlify subdomain (or custom domain)
- The final docs URL referenced in your app's admin panel

## Prerequisites

- A GitHub organization or account with permission to create repos
- A Mintlify account with access to create a site and connect a GitHub repo
- Basic familiarity with Git

---

## 1) Create your GitHub repository

Pick one of the options below to get this code into a new repo under your org.

### Option A — Use this repo as a template (recommended)

1. On GitHub, click "Use this template" (or "Create a new repository" from template) for this repository.
2. Name the new repository under your organization.

### Option B — Import the repository (keeps only the latest state)

1. In GitHub, go to "Import repository".
2. Paste this repository's URL and import it into your org.

---

## 2) Run the docs locally (optional but recommended)

Install the Mintlify CLI, then start a local preview from the repo root where `mint.json` lives.

```
npm i -g mintlify
mintlify install
mintlify dev
```

Local preview will be available at the URL shown in your terminal.

---

## 3) Apply your branding in `mint.json`

Open `mint.json` at the repository root and update the brand fields. Common fields you may want to adjust:

```
{
  "name": "Your Brand Docs",
  "favicon": "/favicon.png",
  "logo": "/resources/logo-light.svg",
  "logoDark": "/resources/logo-dark.svg",
  "colors": {
    "primary": "#0041E6",
    "light": { "primary": "#0041E6" },
    "dark": { "primary": "#7DA2FF" }
  }
}
```

Notes:

- `name`: Shown in the UI and metadata.
- `logo` / `logoDark`: Paths to your light/dark logos (SVG or PNG). Keep paths relative to repo root.
- `favicon`: Path to a square icon (`.png` recommended).
- `colors.primary`: Your brand primary color. If your config includes light/dark variants, adjust those too.

Your `mint.json` may include additional fields such as navigation, footer, social links, analytics, etc. Update as needed for your brand.

---

## 4) Replace logos and assets

Place your assets in the repo and point `mint.json` to them:

- Replace the root `favicon.png` with your brand's favicon (512×512 PNG recommended).
- Add your logos under `resources/` (for example `resources/logo-light.svg` and `resources/logo-dark.svg`).
- Update the `logo`, `logoDark`, and `favicon` paths in `mint.json` to match your files.

Tip: SVG logos typically look best for crisp rendering. Provide a version that works on light backgrounds (`logo`) and one for dark backgrounds (`logoDark`).

---

## 5) (Optional) Update navigation and metadata

Depending on how your `mint.json` is structured, you may see fields like `navigation`, `topbarLinks`, `footerLinks`, `github`, or `ogImage`. Customize these to reflect your brand and information architecture. Keep existing paths consistent with your folder structure.

---

## 6) Connect your repo to Mintlify and deploy

1. In the Mintlify dashboard, create a new site.
2. Connect GitHub and select the repository you created above.
3. Choose the default branch (usually `main`) and docs root (repo root where `mint.json` is).
4. Set your site subdomain (e.g., `yourbrand.mintlify.site`).
5. Click Deploy. Mintlify will build and host your docs.

Optional: If you prefer a custom domain (e.g., `docs.yourbrand.com`), add it in the Mintlify dashboard and follow the DNS instructions (typically a CNAME to the Mintlify target). Wait for DNS to propagate and the certificate to issue.

---

## 7) Reference the live docs URL in your admin panel

Once deployment is live, copy the final docs URL. In your app's admin panel:

1. Go to Settings → White Label (or Branding).
2. Locate the "Documentation URL" (or equivalent) field.
3. Paste your live Mintlify URL (subdomain or custom domain) and save.

This makes the white‑labeled documentation available directly from your product for your users.

---

## 8) Ongoing updates

- Edit content (`.mdx` files) and configuration (`mint.json`) in your repo.
- Preview locally with `mintlify dev`.
- Commit and push to your default branch. If the Mintlify GitHub app is installed and connected, your site will auto‑deploy on push.

---

## Troubleshooting

- `mintlify dev` isn't running: run `mintlify install` to re‑install dependencies.
- 404 locally: ensure you are in the repository root where `mint.json` lives.
- Branding not updating: confirm asset paths in `mint.json` are correct and that files exist in the repo.
- Deploy didn’t update: verify Mintlify is connected to the correct repo/branch and that the latest commit finished building in the Mintlify dashboard.
