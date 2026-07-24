const ZoneRow = ({ title, isActive }: { title: string; isActive: boolean }) => {
  return (
    <div className="flex items-center gap-4 py-2 border-b">
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
          isActive ? 'bg-point' : 'border border-muted-foreground/40'
        }`}
      />
      <span>{title}</span>
    </div>
  )
}

export default ZoneRow
