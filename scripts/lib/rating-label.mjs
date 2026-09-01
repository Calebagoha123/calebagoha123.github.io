/** Format a Letterboxd rating as five visible positions, preserving half stars. */
export function ratingLabel(rating) {
  const value = Math.min(5, Math.max(0, Math.round(Number(rating || 0) * 2) / 2));
  const fullStars = Math.floor(value);
  const hasHalfStar = value % 1 !== 0;
  const emptyStars = 5 - fullStars - Number(hasHalfStar);
  return `${"★".repeat(fullStars)}${hasHalfStar ? "½" : ""}${"☆".repeat(emptyStars)}`;
}
