export function initRouter(ctx) {
  const { elements } = ctx;

  const routes = {
    '/landing': () => {
      elements.landingPage.classList.remove('fade-out');
    },
    '/map': () => {
      elements.landingPage.classList.add('fade-out');
    }
  };

  const handleRoute = () => {
    const path = window.location.pathname;
    if (routes[path]) {
      routes[path]();
    } else {
      // Default to landing if path not recognized or "/"
      window.history.replaceState({}, '', '/landing');
      routes['/landing']();
    }
  };

  window.addEventListener('popstate', handleRoute);

  // Initial routing
  handleRoute();

  return {
    navigate: (path) => {
      window.history.pushState({}, '', path);
      handleRoute();
    }
  };
}
