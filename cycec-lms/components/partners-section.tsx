export function PartnersSection() {
  const partners = [
    { name: "ISO", label: "International Organization for Standardization" },
    { name: "ISO 9001", label: "ISO 9001:2015" },
    { name: "ICEMEXICO", label: "ICE México" },
    { name: "CONOCER", label: "CONOCER" },
    { name: "SEP", label: "Secretaría de Educación Pública" },
  ]

  return (
    <section className="py-12 bg-card border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-muted-foreground mb-8">
          Avalados por organizaciones nacionales e internacionales
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-16">
          {partners.map((partner) => (
            <div 
              key={partner.name}
              className="flex items-center justify-center px-6 py-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
            >
              <span className="font-semibold text-muted-foreground text-sm tracking-wide">
                {partner.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
