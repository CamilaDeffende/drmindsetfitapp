// MF_NEON_UIKIT_V1

export function MFPageShell({
  title,
  subtitle,
  children,
  className = "",
  headerRight,
}: {
  title?: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`mf-app-bg mf-bg-neon ${className}`.trim()}>
      <div className="min-h-[calc(100vh-0px)]">
        <div className="mx-auto w-full max-w-6xl px-4 py-6">
          {(title || subtitle || headerRight) ? (
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                {title ? (
                  <h1 className="text-xl font-bold tracking-tight">{title}</h1>
                ) : null}
                {subtitle ? (
                  <p className="mt-1 text-sm mf-subtle">{subtitle}</p>
                ) : null}
              </div>
              {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
            </div>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
}
