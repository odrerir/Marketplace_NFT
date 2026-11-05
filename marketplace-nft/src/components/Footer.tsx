const features = [
  { letter: 'W', title: 'Segurança da carteira', text: 'Proteja sua carteira e colecione arte digital verificada com confiança.' },
  { letter: 'C', title: 'Criadores em destaque', text: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.' },
  { letter: 'D', title: 'Alertas de lançamentos', text: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.' },
]

const columns = [
  { title: 'Meu perfil', items: ['Meu perfil', 'Minha coleção', 'Atividade', 'Estúdio do criador', 'Lista de interesse'] },
  { title: 'Central de ajuda', items: ['Central de ajuda', 'Como comprar NFTs', 'Carteira e segurança', 'Política do mercado', 'Denunciar item'] },
  { title: 'Coleções', items: ['Arte digital', 'Fotografia', 'Música', 'Arte 3D', 'Utilidade'] },
]

export function Footer() {
  return (
    <footer className="mx-auto mt-16 hidden w-full max-w-[1248px] px-6 lg:block">
      <div className="grid grid-cols-[1fr_1fr_1fr_1.2fr] gap-6 bg-card p-8">
        {features.map((f) => (
          <div key={f.letter} className="border-r border-border-soft pr-6">
            <div aria-hidden="true" className="mb-4 flex size-[74px] items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
              {f.letter}
            </div>
            <h2 className="mb-2 text-lg font-bold">{f.title}</h2>
            <p className="text-sm text-muted-foreground">{f.text}</p>
          </div>
        ))}
        <div>
          <h2 className="mb-3 text-lg font-bold">Antecipe-se ao próximo lançamento</h2>
          <form onSubmit={(e) => e.preventDefault()} className="flex">
            <label htmlFor="newsletter-email" className="sr-only">E-mail</label>
            <input id="newsletter-email" type="email" disabled placeholder="digite seu e-mail..." className="h-10 min-w-0 flex-1 bg-background px-3 text-sm opacity-60" />
            <button type="submit" disabled className="bg-primary px-4 font-bold text-primary-foreground opacity-60">Enviar</button>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">Newsletter indisponível nesta demonstração.</p>
        </div>
      </div>

      <div className="flex items-center justify-between bg-surface-dark px-8 py-6 text-sm">
        <strong className="tracking-[0.2em]">KURIO</strong>
        <p>Feito para colecionadores, criadores e cultura</p>
        <p>contato@email.com</p>
        <p>+55 11 4002 8922</p>
      </div>

      <div className="grid grid-cols-4 gap-6 bg-card p-8">
        {columns.map((c) => (
          <section key={c.title} aria-label={c.title}>
            <h2 className="mb-3 text-lg font-bold">{c.title}</h2>
            <ul className="space-y-2 text-sm">
              {c.items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>
        ))}
        <section aria-label="Redes sociais e carteiras">
          <h2 className="mb-3 text-lg font-bold">Redes sociais</h2>
          <div aria-hidden="true" className="mb-6 flex gap-2 text-xs">
            {['f', 'ig', 'x', 'in', 'yt'].map((s) => (
              <span key={s} className="flex size-8 items-center justify-center rounded border border-primary text-primary">{s}</span>
            ))}
          </div>
          <h2 className="mb-3 text-lg font-bold">Carteiras compatíveis</h2>
          <p className="text-xs text-primary">METAMASK · WALLETCONNECT · COINBASE</p>
        </section>
      </div>
      <p className="py-4 text-center text-xs">© 2026 Kurio. Propriedade digital para todos.</p>
    </footer>
  )
}