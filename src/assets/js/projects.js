(() => {
  "use strict";

  document.querySelectorAll(".project-window__minimize").forEach((button) => {
    button.addEventListener("click", () => {
      const project = button.closest(".project-window");
      if (!project) return;

      const minimized = project.classList.toggle("is-minimized");
      const name = project.dataset.projectName;
      const glyph = button.querySelector(".traffic-light__glyph");

      if (glyph) glyph.textContent = minimized ? "+" : "−";
      button.setAttribute("aria-expanded", String(!minimized));
      button.setAttribute("aria-label", `${minimized ? "Restore" : "Minimize"} ${name}`);
    });
  });
})();
