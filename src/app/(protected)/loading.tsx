export default function ProtectedLoading() {
  return (
    <main
      className="min-h-screen px-6 pb-28 pt-10 sm:px-10 lg:px-12"
      aria-label="Loading page"
    >
      <div className="mx-auto max-w-6xl animate-pulse">
        <div className="h-3 w-32 rounded-full bg-teal/20" />
        <div className="mt-5 h-12 max-w-xl rounded-xl bg-white/10" />
        <div className="mt-4 h-4 max-w-md rounded bg-white/5" />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-48 rounded-2xl border border-line bg-surface"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
