
Project layout & local dev
-----------------

The Featured Projects section now uses a scoped include at `_includes/featured-projects.njk`.

To edit the cards, open `_includes/featured-projects.njk`. Each card is a `.card` element inside the `.grid` container. Update titles, descriptions, tags, and link hrefs as needed.

Site sources are now located in the `src/` directory. To preview locally:

	npm run build
	npm run dev

Notes:
- `npm run dev` runs `eleventy --serve --quiet` (no `--incremental`).
- Keep source templates and includes inside `src/` (`_includes/`, `_layouts/`, pages).

