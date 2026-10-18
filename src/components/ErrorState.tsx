import Link from "next/link";

export function ErrorState({
  title,
  description,
  onRetry,
}: {
  title: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <main className="grid min-h-[70vh] place-items-center px-6 pb-28 pt-10">
      <div className="panel w-full max-w-md p-8 text-center">
        <p className="eyebrow">UniConnect</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em]">{title}</h1>
        <p className="mt-3 leading-7 text-muted">{description}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {onRetry && (
            <button type="button" onClick={onRetry} className="primary-button">
              Try again
            </button>
          )}
          <Link href="/dashboard" className="secondary-button">
            Go to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
