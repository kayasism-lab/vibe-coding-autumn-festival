interface PageHeaderProps {
  title: string
  description?: string
  subtitle?: string
}

export function PageHeader({ title, description, subtitle }: PageHeaderProps) {
  return (
    <div className="bg-foreground text-background py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {subtitle && (
          <p className="text-sm font-medium tracking-widest uppercase text-background/60 mb-2">
            {subtitle}
          </p>
        )}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-balance">
          {title}
        </h1>
        {description && (
          <p className="mt-4 text-lg text-background/70 max-w-2xl whitespace-pre-line">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}
