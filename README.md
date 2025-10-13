
Featured projects
-----------------

The Featured Projects section now uses a scoped include at `_includes/featured-projects.njk`.

To edit the cards, open `_includes/featured-projects.njk`. Each card is a `.card` element inside the `.grid` container. Update titles, descriptions, tags, and link hrefs as needed.

To preview the site locally (if you're using Eleventy), run your usual build/serve command, for example:

	npm run build
	npm run start

Or, if you use Eleventy directly:

	npx @11ty/eleventy --serve

