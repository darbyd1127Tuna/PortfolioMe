(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------
     PROFILE IMAGE
     Treat PortfolioMe.png as the asset reference. If it hasn't
     been added next to this file, fall back to a neutral
     initials avatar instead of breaking the layout.
  ------------------------------------------------------------ */
  var profileImage = "PortfolioMe.png";

  (function setProfileImage() {
    var img = document.getElementById("profileImg");
    if (!img) return;

    img.addEventListener("error", function () {
      var frame = img.closest(".portrait-frame");
      if (!frame) return;
      img.remove();
      var fallback = document.createElement("div");
      fallback.setAttribute("role", "img");
      fallback.setAttribute("aria-label", "Portrait of Darby M. Duran");
      fallback.textContent = "DMD";
      fallback.style.cssText = [
        "width:100%", "height:100%", "border-radius:50%",
        "display:flex", "align-items:center", "justify-content:center",
        "background:var(--surface-2)", "color:var(--text-faint)",
        "font-family:var(--font-mono)", "font-size:1.4rem",
        "letter-spacing:0.05em"
      ].join(";");
      frame.appendChild(fallback);
    }, { once: true });

    img.src = profileImage;
  })();

  /* ------------------------------------------------------------
     HEADER: scrolled state + scroll progress bar
  ------------------------------------------------------------ */
  var header = document.getElementById("siteHeader");
  var progress = document.getElementById("scrollProgress");

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle("is-scrolled", y > 8);

    if (progress) {
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var pct = docHeight > 0 ? (y / docHeight) * 100 : 0;
      progress.style.width = pct + "%";
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ------------------------------------------------------------
     MOBILE NAV
  ------------------------------------------------------------ */
  var menuToggle = document.getElementById("menuToggle");
  var siteNav = document.getElementById("siteNav");

  if (menuToggle && siteNav) {
    menuToggle.addEventListener("click", function () {
      var isOpen = siteNav.classList.toggle("is-open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
    });

    siteNav.querySelectorAll(".nav-link").forEach(function (link) {
      link.addEventListener("click", function () {
        siteNav.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Open navigation menu");
      });
    });
  }

  /* ------------------------------------------------------------
     THEME TOGGLE (dark default, persisted in localStorage)
  ------------------------------------------------------------ */
  var themeToggle = document.getElementById("themeToggle");
  var THEME_KEY = "dmd-portfolio-theme";

  function applyTheme(theme) {
    if (theme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    if (themeToggle) {
      var isLight = theme === "light";
      themeToggle.setAttribute("aria-pressed", String(isLight));
      themeToggle.setAttribute("aria-label", isLight ? "Switch to dark theme" : "Switch to light theme");
    }
  }

  (function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) { /* storage unavailable */ }
    applyTheme(saved === "light" ? "light" : "dark");
  })();

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var isLight = document.documentElement.getAttribute("data-theme") === "light";
      var next = isLight ? "dark" : "light";
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* storage unavailable */ }
    });
  }

  /* ------------------------------------------------------------
     SCROLL REVEAL (IntersectionObserver)
  ------------------------------------------------------------ */
  var revealEls = document.querySelectorAll(".reveal");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------------
     HERO SPIRAL BACKGROUND (canvas, grayscale, barber-pole style)
  ------------------------------------------------------------ */
  (function spiral() {
    var canvas = document.getElementById("spiralCanvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var width, height, rotation = 0;
    var rafId = null;

    var grays = ["#050506", "#1a1a1c", "#2e2e31", "#3f3f43"];

    function resize() {
      var rect = canvas.parentElement.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      var cx = width * 0.32;
      var cy = height * 0.5;
      var maxR = Math.max(width, height) * 0.85;
      var segments = 64;
      var bands = grays.length;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);

      for (var i = 0; i < segments; i++) {
        var t0 = i / segments;
        var t1 = (i + 1) / segments;
        var r0 = t0 * maxR;
        var r1 = t1 * maxR;
        var a0 = t0 * Math.PI * 10;
        var a1 = t1 * Math.PI * 10;

        ctx.beginPath();
        ctx.arc(0, 0, (r0 + r1) / 2, a0, a1);
        ctx.lineWidth = (r1 - r0) + 1.5;
        ctx.strokeStyle = grays[i % bands];
        ctx.stroke();
      }

      ctx.restore();
    }

    function tick() {
      rotation += 0.0016;
      draw();
      rafId = requestAnimationFrame(tick);
    }

    resize();
    window.addEventListener("resize", resize);

    if (reduceMotion) {
      draw();
    } else {
      tick();
      document.addEventListener("visibilitychange", function () {
        if (document.hidden && rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        } else if (!document.hidden && !rafId) {
          tick();
        }
      });
    }
  })();

  /* ------------------------------------------------------------
     GITHUB API — per-project stats with graceful fallback.
     Never fabricates data; if a request fails, the stat area
     is simply left empty.
  ------------------------------------------------------------ */
  (function githubProjectStats() {
    var cards = document.querySelectorAll(".project-card[data-repo]");
    if (!cards.length) return;

    cards.forEach(function (card) {
      var repo = card.getAttribute("data-repo");
      var statsEl = card.querySelector("[data-stats]");
      if (!repo || !statsEl) return;

      fetch("https://api.github.com/repos/" + repo)
        .then(function (res) {
          if (!res.ok) throw new Error("GitHub API error");
          return res.json();
        })
        .then(function (data) {
          var parts = [];
          if (typeof data.stargazers_count === "number") {
            parts.push("★ " + data.stargazers_count);
          }
          if (data.language) {
            parts.push(data.language);
          }
          if (data.updated_at) {
            var d = new Date(data.updated_at);
            parts.push("updated " + d.toLocaleDateString(undefined, { month: "short", year: "numeric" }));
          }
          statsEl.textContent = parts.join(" · ");
        })
        .catch(function () {
          /* Graceful fallback: leave stats blank, portfolio still works fully offline. */
          statsEl.textContent = "";
        });
    });
  })();

  /* ------------------------------------------------------------
     GITHUB API — profile-level quick stats for the GitHub section.
  ------------------------------------------------------------ */
  (function githubProfileStats() {
    var el = document.getElementById("githubStats");
    if (!el) return;

    fetch("https://api.github.com/users/darbyd1127Tuna")
      .then(function (res) {
        if (!res.ok) throw new Error("GitHub API error");
        return res.json();
      })
      .then(function (data) {
        var items = [];
        if (typeof data.public_repos === "number") {
          items.push({ label: "Public repos", value: data.public_repos });
        }
        if (typeof data.followers === "number") {
          items.push({ label: "Followers", value: data.followers });
        }
        if (!items.length) return;

        el.innerHTML = items.map(function (item) {
          return '<div class="gh-stat"><strong>' + item.value + "</strong>" + item.label + "</div>";
        }).join("");
      })
      .catch(function () {
        /* Graceful fallback: no stats block shown, no fabricated numbers. */
        el.innerHTML = "";
      });
  })();

})();
