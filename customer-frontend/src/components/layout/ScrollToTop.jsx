import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const prevPathname = useRef(pathname);

  useEffect(() => {
    // Don't scroll to top when navigating TO Home — HomePage manages its own scroll restoration
    if (pathname === '/') {
      prevPathname.current = pathname;
      return;
    }

    // For all other pages, scroll to top on route change
    window.scrollTo(0, 0);
    prevPathname.current = pathname;
  }, [pathname]);

  return null;
};

export default ScrollToTop;
