export function initAuroraEffect() {
  const root = document.documentElement;

  // Track mouse globally for general background/depth effects
  document.addEventListener('mousemove', (e) => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    root.style.setProperty('--mouse-x', x.toFixed(3));
    root.style.setProperty('--mouse-y', y.toFixed(3));
  });

  // Track mouse locally for elements that use a "spotlight" effect
  const spotlightTargets = document.querySelectorAll('.brand-logo, .hero-tagline, #go-to-map-hero');
  spotlightTargets.forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const lx = (e.clientX - rect.left) / rect.width;
      const ly = (e.clientY - rect.top) / rect.height;

      el.style.setProperty('--local-x', (lx * 100).toFixed(2) + '%');
      el.style.setProperty('--local-y', (ly * 100).toFixed(2) + '%');
    });

    el.addEventListener('mouseleave', () => {
      el.style.setProperty('--local-x', '-100%');
      el.style.setProperty('--local-y', '-100%');
    });
  });

  // Scroll Reveal Observer
  const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      } else {
        entry.target.classList.remove('is-visible');
      }
    });
  }, observerOptions);

  document.querySelectorAll('.reveal-item').forEach(item => {
    observer.observe(item);
  });
}
