(() => {
  "use strict";

  const RSS_FEED_URL = "https://anchor.fm/s/f6f3f68c/podcast/rss";
  const FALLBACK_EPISODE = {
    title: "Ep. 44 2026...7",
    duration: "01:01:22",
    audioUrl: "https://anchor.fm/s/f6f3f68c/podcast/play/113353899/https%3A%2F%2Fd3ctxlq1ktw2nl.cloudfront.net%2Fstaging%2F2026-0-1%2F17e51835-11b1-090c-e5f1-ec78537265d7.mp3"
  };

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainder = Math.floor(seconds % 60);
    return `${minutes}:${String(remainder).padStart(2, "0")}`;
  };

  async function fetchPodcastXml() {
    try {
      const response = await fetch(RSS_FEED_URL);
      if (!response.ok) throw new Error(`Podcast feed returned ${response.status}`);
      return response.text();
    } catch {
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(RSS_FEED_URL)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error(`Podcast proxy returned ${response.status}`);
      const payload = await response.json();
      return payload.contents;
    }
  }

  async function getLatestEpisode() {
    const xml = await fetchPodcastXml();
    const documentNode = new DOMParser().parseFromString(xml, "text/xml");
    const item = documentNode.querySelector("item");
    const enclosure = item?.querySelector("enclosure");
    const audioUrl = enclosure?.getAttribute("url");
    if (!item || !audioUrl) throw new Error("Podcast feed has no playable episode");

    return {
      title: item.querySelector("title")?.textContent || "Latest episode",
      duration: item.querySelector("duration")?.textContent || "",
      audioUrl
    };
  }

  function initialisePodcast() {
    const player = document.querySelector("#podcast-player");
    const toggle = document.querySelector("#podcast-toggle");
    const title = document.querySelector("#podcast-title");
    const duration = document.querySelector("#podcast-duration");
    const audio = document.querySelector("#podcast-audio");
    const playButton = document.querySelector("#podcast-play");
    const progress = document.querySelector("#podcast-progress");
    const progressFill = document.querySelector("#podcast-progress-fill");
    const time = document.querySelector("#podcast-time");
    if (!player || !toggle || !title || !duration || !audio || !playButton || !progress || !progressFill || !time) return;

    let episodeLoaded = false;

    const applyEpisode = (episode) => {
      title.textContent = episode.title;
      duration.textContent = episode.duration ? `(${episode.duration})` : "";
      audio.src = episode.audioUrl;
      audio.load();
      episodeLoaded = true;
    };

    const loadEpisode = async () => {
      if (episodeLoaded) return;
      try {
        applyEpisode(await getLatestEpisode());
      } catch {
        applyEpisode(FALLBACK_EPISODE);
      }
    };

    const updateProgress = () => {
      const ratio = audio.duration ? audio.currentTime / audio.duration : 0;
      progressFill.style.width = `${ratio * 100}%`;
      time.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
    };

    toggle.addEventListener("click", () => {
      const expanded = player.classList.toggle("is-expanded");
      toggle.setAttribute("aria-expanded", String(expanded));
      if (expanded) loadEpisode();
    });

    playButton.addEventListener("click", async () => {
      await loadEpisode();
      if (audio.paused) {
        try {
          await audio.play();
          playButton.textContent = "⏸";
          playButton.setAttribute("aria-label", "Pause latest podcast episode");
        } catch {
          playButton.textContent = "▶";
        }
      } else {
        audio.pause();
        playButton.textContent = "▶";
        playButton.setAttribute("aria-label", "Play latest podcast episode");
      }
    });

    progress.addEventListener("click", (event) => {
      if (!audio.duration) return;
      const rect = progress.getBoundingClientRect();
      audio.currentTime = ((event.clientX - rect.left) / rect.width) * audio.duration;
    });

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("loadedmetadata", updateProgress);
    audio.addEventListener("ended", () => {
      playButton.textContent = "▶";
      playButton.setAttribute("aria-label", "Play latest podcast episode");
      updateProgress();
    });
  }

  function initialiseBackToTop() {
    const button = document.querySelector(".back-to-top");
    if (!button) return;

    const updateVisibility = () => button.classList.toggle("is-visible", window.scrollY > 300);
    window.addEventListener("scroll", updateVisibility, { passive: true });
    button.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    updateVisibility();
  }

  initialisePodcast();
  initialiseBackToTop();
})();
