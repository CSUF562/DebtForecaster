import Link from "next/link";

export function AppNav() {
  return (
    <header className="app-header">
      <div className="nav-inner">
        <Link className="brand" href="/">
          ENCLAVE
        </Link>
        <nav className="main-nav" aria-label="Primary navigation">
          <Link href="/">Today</Link>
          <Link href="/history">History</Link>
          <Link href="/forecaster">Forecaster</Link>
          <Link href="/methodology">Methodology</Link>
        </nav>
      </div>
    </header>
  );
}
