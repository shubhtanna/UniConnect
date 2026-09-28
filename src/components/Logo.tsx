import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="inline-flex items-center gap-3" aria-label="UniConnect home">
      <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-teal to-amber text-sm font-black text-app">
        U
      </span>
      <span className="gradient-text text-lg font-bold tracking-[-0.03em]">UniConnect</span>
    </Link>
  );
}
