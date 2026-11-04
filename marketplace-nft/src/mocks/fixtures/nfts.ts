import type { Nft, NftCategory, NftNetwork } from '@/types/api'

const categories: NftCategory[] = [
  'arte-digital', 'fotografia', 'musica', 'arte-3d', 'colecionaveis',
  'generativa', 'jogos', 'assinaturas', 'utilidade',
]
const networks: NftNetwork[] = ['ethereum', 'polygon', 'solana']
const networkLabel: Record<NftNetwork, string> = {
  ethereum: 'Ethereum', polygon: 'Polygon', solana: 'Solana',
}

const looks = ['ape-green', 'nomad-purple', 'baron-black', 'beat-orange'] as const
type Look = (typeof looks)[number]

const collections: Record<Look, string> = {
  'ape-green': 'Kurio Apes',
  'nomad-purple': 'Kurio Nomads',
  'baron-black': 'Kurio Barons',
  'beat-orange': 'Kurio Beats',
}
const lookAttributes: Record<Look, string[]> = {
  'ape-green': ['Óculos', 'Esmeralda'],
  'nomad-purple': ['Chapéu', 'Moletom'],
  'baron-black': ['Blazer', 'Brinco'],
  'beat-orange': ['Fones', 'Jaqueta'],
}
const lookSuffix: Record<Look, string> = {
  'ape-green': 'Ape', 'nomad-purple': 'Nomad', 'baron-black': 'Baron', 'beat-orange': 'Beat',
}

interface Seed {
  name: string
  tokenId: string
  look: Look
  price: string
  previousPrice?: string
  rare?: boolean
}

// Os 9 NFTs que aparecem no Figma
const figmaSeeds: Seed[] = [
  { name: 'Emerald Ape', tokenId: '0042', look: 'ape-green', price: '1.19', rare: true },
  { name: 'Sage Nomad', tokenId: '0009', look: 'baron-black', price: '1.69' },
  { name: 'Neon Vessel', tokenId: '0552', look: 'ape-green', price: '1.99', previousPrice: '2.29', rare: true },
  { name: 'Cosmic Bloom', tokenId: '0118', look: 'nomad-purple', price: '1.29' },
  { name: 'Violet Nomad', tokenId: '0314', look: 'beat-orange', price: '1.39' },
  { name: 'Ivory Baron', tokenId: '0088', look: 'baron-black', price: '1.79' },
  { name: 'Golden Beat', tokenId: '0207', look: 'ape-green', price: '0.99' },
  { name: 'Golden Frequency', tokenId: '0071', look: 'nomad-purple', price: '0.59' },
  { name: 'Golden Signal', tokenId: '0160', look: 'beat-orange', price: '0.39' },
]

const prefixes = ['Amber', 'Cobalt', 'Jade', 'Onyx', 'Opal', 'Solar', 'Lunar', 'Echo', 'Prism']

// 27 NFTs gerados de forma determinística
const generatedSeeds: Seed[] = Array.from({ length: 27 }, (_, i) => {
  const look = looks[i % looks.length]
  const cents = ((i * 37) % 250) + 10
  return {
    name: `${prefixes[i % prefixes.length]} ${lookSuffix[look]}`,
    tokenId: String(600 + i * 7).padStart(4, '0'),
    look,
    price: (cents / 100).toFixed(2),
    rare: i % 6 === 0,
  }
})

function build(seed: Seed, n: number): Nft {
  const shortId = seed.tokenId.slice(1)
  const category = categories[n % categories.length]
  const network = networks[n % networks.length]
  const collection = collections[seed.look]

  return {
    id: `nft-${shortId}`,
    name: `${seed.name} #${shortId}`,
    tokenId: seed.tokenId,
    collection,
    category,
    network,
    price: seed.price,
    previousPrice: seed.previousPrice,
    isRare: seed.rare ?? false,
    isNew: n % 4 === 0,
    isTrending: n % 5 === 0,
    listedAt: new Date(Date.UTC(2026, 9, 1) - n * 86_400_000).toISOString(),
    images: Array.from({ length: 4 }, () => `/nfts/${seed.look}.png`),
    description: `Um colecionável digital finalizado à mão da coleção ${collection}, verificado na ${networkLabel[network]}.`,
    rating: 4.8 - (n % 5) / 10,
    reviewCount: 19 + ((n * 7) % 30),
    attributes: [...lookAttributes[seed.look], ...(seed.rare ? ['Raro'] : [])],
    editions: [
      { id: '1/1', label: '1/1', available: n % 6 === 1 ? 0 : 1 },
      { id: '1/10', label: '1/10', available: 10 - (n % 4) },
      { id: '1/50', label: '1/50', available: 50 - (n % 7) },
      { id: 'open', label: 'ABERTA', available: 99 },
    ],
    version: 1,
  }
}

export const nftFixtures: Nft[] = [...figmaSeeds, ...generatedSeeds].map(build)