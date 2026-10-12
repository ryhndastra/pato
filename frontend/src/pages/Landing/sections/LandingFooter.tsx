import wordmark from "../../../assets/pato-withtext.png";

export function LandingFooter() {
  return (
    <footer className="flex flex-col items-center gap-3 border-t border-hairline px-6 py-8 lg:flex-row lg:justify-between lg:px-12">
      <img src={wordmark} alt="PaTo" className="h-10 w-auto opacity-70" />
      <p className="text-xs text-ink-muted">PaTo - Pay Together, 2026.</p>
    </footer>
  );
}
