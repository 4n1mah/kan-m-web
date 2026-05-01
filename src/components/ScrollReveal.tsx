"use client";
import { useEffect } from "react";

export default function ScrollReveal() {
  useEffect(() => {
    // Only mark elements AFTER mount — avoids blank flash on first load
    const els = document.querySelectorAll(".reveal");
    els.forEach((el) => {
      // Don't animate what's already in the viewport on load
      const rect = el.getBoundingClientRect();
      if (rect.top > window.innerHeight * 0.92) {
        el.classList.add("will-reveal");
      }
    });

    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.1 }
    );

    document.querySelectorAll(".will-reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
