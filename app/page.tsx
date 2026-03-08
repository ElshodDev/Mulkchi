export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <nav className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <h1 className="font-serif text-2xl font-bold text-primary">Mulkchi</h1>
          <div className="flex gap-8">
            <a href="#" className="hover:text-primary transition-colors">Жилой фонд</a>
            <a href="#" className="hover:text-primary transition-colors">Коммерция</a>
            <a href="#" className="hover:text-primary transition-colors">Услуги</a>
          </div>
        </nav>
      </header>

      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="mb-12">
          <h2 className="font-serif text-5xl font-bold text-balance mb-6">
            Премиум недвижимость в Узбекистане
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Откройте для себя лучшие предложения жилой и коммерческой недвижимости на нашей платформе
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-secondary rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="bg-muted h-64 flex items-center justify-center">
                <span className="text-muted-foreground">Изображение {i}</span>
              </div>
              <div className="p-6">
                <h3 className="font-serif text-lg font-bold mb-2">Премиум апартамент</h3>
                <p className="text-muted-foreground mb-4">Описание недвижимости</p>
                <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity">
                  Подробнее
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
