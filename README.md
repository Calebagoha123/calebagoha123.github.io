# Caleb Agoha — portfolio

Personal portfolio built with [Eleventy](https://www.11ty.dev/) and deployed to GitHub Pages.

## Local development

Requires Node.js 22 or later.

```sh
npm ci
npm run dev
```

Eleventy serves the site at `http://localhost:8080`. Other useful commands:

```sh
npm run build                 # Generate the production site in _site/
npm test                      # Check the five-position rating formatter
npm run refresh:letterboxd    # Refresh the two latest Letterboxd watches
npm run check                 # Test, refresh dynamic data and build
```

## Project structure

- `src/index.njk` assembles the home page.
- `src/_layouts/site.njk` owns shared metadata, header, navigation and script/style loading.
- `src/_includes/home-content.njk` contains About and Experience content.
- `src/_includes/project-windows.njk` contains the side-project windows.
- `src/assets/css/` and `src/assets/js/` separate global, home and project-window behaviour.
- `src/_data/letterboxd.json` is the build-time fallback for recent watches.
- `scripts/update-letterboxd.mjs` refreshes that data from Caleb's public Letterboxd RSS feed.

## Letterboxd updates

The GitHub Pages workflow runs hourly at minute 23 and before every deployment. It reads the public `vcaleb` Letterboxd RSS feed, selects the two latest diary entries, and renders each poster and rating. Ratings always occupy five positions (`★★★☆☆` or `★★★½☆`).

If Letterboxd is temporarily unavailable, the build retains the committed JSON fallback instead of failing the site deployment. Local refreshes update the fallback; scheduled GitHub builds use fresh data for that deployment without modifying the repository.

## Updating project media

Project screenshots and videos live under `src/assets/projects/<project-name>/`. Keep the existing filenames when replacing media, or update the corresponding paths in `src/_includes/project-windows.njk`.

## Deployment

Pushes to `main` build and deploy through `.github/workflows/static.yml`. The same workflow also performs the hourly Letterboxd refresh.
