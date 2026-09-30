// Bar Sądecki — scroll motion: reveal-on-scroll, 3-depth transform parallax,
// hero video control, sticky nav/call bar. Fully disabled for reduced motion.
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var video = document.querySelector(".hero__video");
  var hero = document.querySelector(".hero");
  var nav = document.querySelector(".nav");
  var callbar = document.querySelector(".callbar");
  var layers = Array.prototype.slice.call(document.querySelectorAll("[data-depth]"));

  // Content stays visible without JS: reveals are hidden only once this class is set.
  root.classList.add("motion-ready");
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px" }
    );
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  function setNav() {
    var past = window.scrollY > (hero ? hero.offsetHeight : 600) - 90;
    if (nav) nav.classList.toggle("nav--solid", past);
    if (callbar) callbar.classList.toggle("is-shown", past);
  }
  window.addEventListener("scroll", setNav, { passive: true });
  setNav();

  var raf = 0;
  var active = false;

  function frame() {
    raf = 0;
    var vh = window.innerHeight;
    var mobile = window.innerWidth < 768 ? 0.6 : 1;
    var heroH = hero ? hero.offsetHeight : vh;
    var y = window.scrollY;
    for (var i = 0; i < layers.length; i++) {
      var el = layers[i];
      var depth = Number(el.getAttribute("data-depth")) * mobile;
      if (el.getAttribute("data-anchor") === "hero") {
        if (y > heroH * 1.2) continue;
        el.style.transform = "translate3d(0," + (y * depth).toFixed(1) + "px,0)";
        if (el.hasAttribute("data-fade")) {
          el.style.opacity = Math.max(0, 1 - y / (heroH * 0.7)).toFixed(3);
        }
        continue;
      }
      // Measure the untransformed parent so the offset never feeds back into itself.
      var box = (el.parentElement || el).getBoundingClientRect();
      if (box.bottom < -vh || box.top > vh * 2) continue;
      var delta = box.top + box.height / 2 - vh / 2;
      el.style.transform = "translate3d(0," + (-delta * depth).toFixed(1) + "px,0)";
    }
  }
  function onScroll() {
    if (!raf) raf = requestAnimationFrame(frame);
  }
  function playVideo() {
    if (!video) return;
    video.muted = true;
    var p = video.play();
    if (p && p.catch) p.catch(function () {});
  }

  function start() {
    if (active) return;
    active = true;
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    frame();
    playVideo();
  }
  function stop() {
    active = false;
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    layers.forEach(function (el) {
      el.style.transform = "";
      el.style.opacity = "";
    });
    if (video) video.pause();
  }
  function sync() {
    if (reduce.matches) stop();
    else start();
  }
  sync();
  if (reduce.addEventListener) reduce.addEventListener("change", sync);
  else if (reduce.addListener) reduce.addListener(sync);

  // Save battery: pause the loop while the hero is off-screen.
  if (hero && video && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      if (reduce.matches) return;
      if (entries[0].isIntersecting) playVideo();
      else video.pause();
    }).observe(hero);
  }

  // Browsers defer autoplay in background tabs — resume once the page is shown.
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible" && !reduce.matches && window.scrollY < window.innerHeight) {
      playVideo();
    }
  });
})();
