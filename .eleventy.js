const { DateTime } = require("luxon");

module.exports = function(eleventyConfig) {
    // Add date filter
    eleventyConfig.addFilter("formatDate", (dateObj) => {
        return DateTime.fromJSDate(dateObj).toFormat("dd-MM-yy");
    });

    // Configure blog post collection
    eleventyConfig.addCollection("posts", function(collectionApi) {
        return collectionApi.getFilteredByGlob("blog/**/*.md");
    });

    // Pass through static assets
    eleventyConfig.addPassthroughCopy("*.png");
    eleventyConfig.addPassthroughCopy("*.mov");
    eleventyConfig.addPassthroughCopy("graphs");
    eleventyConfig.addPassthroughCopy("thesis.pdf");

    return {
        dir: {
            input: ".",
            output: "_site",
            includes: "_includes",
            layouts: "_layouts"
        }
    };
};