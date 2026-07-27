"use client";

export function SkipLink() {
  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    const main = document.getElementById("main-content");
    if (main) {
      main.focus();
      main.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <a
      href="#main-content"
      onClick={handleClick}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2"
    >
      Skip to main content
    </a>
  );
}
