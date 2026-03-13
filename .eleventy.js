const { DateTime } = require("luxon");

module.exports = function(eleventyConfig) {
    // Ignore directories and files that shouldn't be processed as templates
    eleventyConfig.ignores.add("_site/**");
    eleventyConfig.ignores.add("node_modules/**");
    eleventyConfig.ignores.add("package-lock.json");
    eleventyConfig.ignores.add("package.json");
    eleventyConfig.ignores.add("googlef*.html");

    
    // Add date filter
    eleventyConfig.addFilter("formatDate", (dateObj) => {
        return DateTime.fromJSDate(dateObj).toFormat("dd-MM-yy");
    });

    // Add a `jsonify` filter so templates can safely inline JSON (Nunjucks doesn't provide this by default)
    eleventyConfig.addFilter("jsonify", (obj) => {
        try {
            return JSON.stringify(obj);
        } catch (e) {
            return null;
        }
    });

    // Passthrough for static assets placed inside `src/assets`
    eleventyConfig.addPassthroughCopy({"src/assets": "assets"});

    // Configure blog post collection - only process markdown files in blog directory
    eleventyConfig.addCollection("posts", function(collectionApi) {
        return collectionApi.getFilteredByGlob("blog/**/*.md");
    });

    // Pass through static assets - copied without template processing
    // Note: Prefer placing passthrough assets inside `src/` and reference them from there.

    return {
        dir: {
            input: "src",
            output: "_site",
            includes: "_includes",
            layouts: "_layouts"
        },
        // Specify template formats to avoid processing unnecessary files
        templateFormats: ["njk", "md", "html"],
        htmlTemplateEngine: "njk",
        markdownTemplateEngine: "njk"
    };
};