"use client";
import { usePathname } from "next/navigation";
import { useRef, useEffect, useState } from "react";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitioning, setTransitioning] = useState(false);
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      setTransitioning(true);
      const timer = setTimeout(() => {
        setDisplayChildren(children);
        setTransitioning(false);
        prevPathname.current = pathname;
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setDisplayChildren(children);
    }
  }, [pathname, children]);

  return (
    <div
      style={{
        opacity: transitioning ? 0 : 1,
        transition: transitioning
          ? "opacity 0.15s ease-out"
          : "opacity 0.3s ease-in",
      }}
    >
      {displayChildren}
    </div>
  );
}
