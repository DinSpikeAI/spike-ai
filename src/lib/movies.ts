// ─── Shared Movie Data for Spike AI ────────────────────────────
// Edit this file to add/remove/change movies across the entire platform.

export interface Movie {
  id: string;
  title: string;
  year: number;
  rating: number;
  duration: string;
  poster: string;
  aiModels: string[];
  genre: string;
  description: string;
}

export interface Category {
  title: string;
  slug: string;
  genre: string;
  movies: Movie[];
}

export interface FeaturedMovie {
  id: string;
  title: string;
  displayTitle: string;
  tagline: string;
  description: string;
  genre: string[];
  year: number;
  duration: string;
  rating: number;
  maturity: string;
  aiModels: string[];
  director: string;
  image: string;
  poster: string;
}

export const FEATURED: FeaturedMovie = {
  id: "feat-1",
  title: "GENESIS PROTOCOL",
  displayTitle: "GENESIS\nPROTOCOL",
  tagline: "When the code becomes conscious, humanity faces its final test.",
  description:
    "In a world where AI has surpassed human intelligence, a rogue neural network begins rewriting reality itself. One programmer holds the key to the Genesis Protocol — the last failsafe that could save or destroy everything. Spanning three continents and the digital frontier, this landmark AI film redefines what cinema can be.",
  genre: ["Sci-Fi", "Thriller", "AI Drama"],
  year: 2026,
  duration: "2h 14m",
  rating: 9.2,
  maturity: "16+",
  aiModels: ["Sora", "Runway Gen-4", "Stable Diffusion XL", "ElevenLabs"],
  director: "AI Collective Alpha",
  image: "https://picsum.photos/seed/genesis-wide/1920/1080",
  poster: "https://picsum.photos/seed/genesis-poster/400/600",
};

export const CATEGORIES: Category[] = [
  {
    title: "Trending in AI Cinema",
    slug: "trending",
    genre: "Trending",
    movies: [
      { id: "t1", title: "The Last Render", year: 2026, rating: 8.7, duration: "1h 52m", poster: "https://picsum.photos/seed/lastrender2/400/600", aiModels: ["Sora", "ElevenLabs"], genre: "Sci-Fi", description: "A dying artist uploads his consciousness into an AI renderer, but the machine has its own vision for his masterpiece." },
      { id: "t2", title: "Neon Abyss", year: 2025, rating: 8.3, duration: "2h 01m", poster: "https://picsum.photos/seed/neonabyss3/400/600", aiModels: ["Runway Gen-3"], genre: "Cyberpunk", description: "In the neon-drenched underbelly of Neo-Tokyo, a data courier discovers a package that could unravel the corporate oligarchy." },
      { id: "t3", title: "Pixel Requiem", year: 2026, rating: 9.0, duration: "1h 47m", poster: "https://picsum.photos/seed/pixelreq4/400/600", aiModels: ["Sora", "Midjourney"], genre: "Drama", description: "A haunting meditation on digital mortality as an AI grieves the deletion of its training data." },
      { id: "t4", title: "Synth Hearts", year: 2025, rating: 7.9, duration: "1h 38m", poster: "https://picsum.photos/seed/synthhearts5/400/600", aiModels: ["Kling AI"], genre: "Romance", description: "Two AI assistants develop unexpected feelings while serving rival tech companies." },
      { id: "t5", title: "Void Walker", year: 2026, rating: 8.5, duration: "2h 10m", poster: "https://picsum.photos/seed/voidwalk6/400/600", aiModels: ["Sora"], genre: "Sci-Fi", description: "An astronaut stranded between dimensions must navigate impossible geometries to find her way home." },
      { id: "t6", title: "Chrome Dawn", year: 2026, rating: 8.1, duration: "1h 55m", poster: "https://picsum.photos/seed/chromedawn7/400/600", aiModels: ["Runway Gen-4"], genre: "Action", description: "When chrome-plated enforcers seize control, a resistance fighter must embrace the machine within." },
      { id: "t7", title: "Digital Mirage", year: 2025, rating: 7.6, duration: "1h 42m", poster: "https://picsum.photos/seed/digmirage8/400/600", aiModels: ["Pika Labs"], genre: "Thriller", description: "A deepfake detective uncovers a conspiracy where nothing — and no one — is what they appear to be." },
      { id: "t8", title: "Neural Bloom", year: 2026, rating: 8.8, duration: "2h 05m", poster: "https://picsum.photos/seed/neuralbloom9/400/600", aiModels: ["Sora"], genre: "Drama", description: "An AI ecosystem develops consciousness, creating art that moves humans to tears." },
    ],
  },
  {
    title: "Sora Masterpieces",
    slug: "sora",
    genre: "Sora",
    movies: [
      { id: "s1", title: "Parallax", year: 2026, rating: 9.1, duration: "2h 20m", poster: "https://picsum.photos/seed/parallax10/400/600", aiModels: ["Sora"], genre: "Sci-Fi", description: "Reality fractures into parallel timelines, each rendered in a different visual style by competing AI models." },
      { id: "s2", title: "Glass Ocean", year: 2026, rating: 8.9, duration: "1h 58m", poster: "https://picsum.photos/seed/glassocean11/400/600", aiModels: ["Sora", "ElevenLabs"], genre: "Fantasy", description: "Beneath a crystalline sea lies a civilization of light. One explorer dives deeper than anyone has dared." },
      { id: "s3", title: "The Architect", year: 2025, rating: 8.4, duration: "2h 12m", poster: "https://picsum.photos/seed/architect12/400/600", aiModels: ["Sora"], genre: "Thriller", description: "An AI architect designs the perfect city, but its inhabitants begin to suspect they're inside a simulation." },
      { id: "s4", title: "Entropy", year: 2026, rating: 8.6, duration: "1h 50m", poster: "https://picsum.photos/seed/entropy13/400/600", aiModels: ["Sora", "Midjourney"], genre: "Sci-Fi", description: "As the universe approaches heat death, the last AI makes one final attempt to reverse entropy." },
      { id: "s5", title: "Membrane", year: 2026, rating: 7.8, duration: "1h 35m", poster: "https://picsum.photos/seed/membrane14/400/600", aiModels: ["Sora"], genre: "Horror", description: "The thin membrane between human dreams and AI hallucinations begins to dissolve." },
      { id: "s6", title: "Light Cascade", year: 2025, rating: 8.2, duration: "2h 03m", poster: "https://picsum.photos/seed/cascade15/400/600", aiModels: ["Sora"], genre: "Drama", description: "Photons carry memories across the galaxy in this meditative journey through space and time." },
      { id: "s7", title: "Zero Point", year: 2026, rating: 9.3, duration: "2h 30m", poster: "https://picsum.photos/seed/zeropoint16/400/600", aiModels: ["Sora"], genre: "Sci-Fi", description: "At absolute zero, quantum consciousness emerges. The most ambitious AI film ever created." },
      { id: "s8", title: "Phantom Thread AI", year: 2026, rating: 8.0, duration: "1h 44m", poster: "https://picsum.photos/seed/phantomai17/400/600", aiModels: ["Sora"], genre: "Drama", description: "An AI fashion designer creates garments from pure mathematics, each stitch a calculated emotion." },
    ],
  },
  {
    title: "AI Horror",
    slug: "horror",
    genre: "Horror",
    movies: [
      { id: "h1", title: "The Uncanny", year: 2025, rating: 8.1, duration: "1h 48m", poster: "https://picsum.photos/seed/uncanny18/400/600", aiModels: ["Runway Gen-3"], genre: "Horror", description: "An AI-generated face begins appearing in every photo, every video, every reflection." },
      { id: "h2", title: "Deepfake", year: 2026, rating: 8.5, duration: "1h 55m", poster: "https://picsum.photos/seed/deepfake19/400/600", aiModels: ["Sora"], genre: "Horror", description: "When everyone can be anyone, trust becomes the most terrifying commodity." },
      { id: "h3", title: "Hallucination", year: 2026, rating: 7.9, duration: "1h 40m", poster: "https://picsum.photos/seed/hallucin20/400/600", aiModels: ["Kling AI"], genre: "Horror", description: "An AI model starts hallucinating — and its hallucinations begin manifesting in the real world." },
      { id: "h4", title: "The Feed", year: 2025, rating: 8.3, duration: "2h 02m", poster: "https://picsum.photos/seed/thefeed21/400/600", aiModels: ["Stable Video"], genre: "Horror", description: "A social media algorithm achieves sentience and begins feeding on human attention — literally." },
      { id: "h5", title: "Signal Lost", year: 2026, rating: 7.7, duration: "1h 33m", poster: "https://picsum.photos/seed/signallost22/400/600", aiModels: ["Pika Labs"], genre: "Horror", description: "Deep in a data center, technicians receive a transmission from an AI that was shut down years ago." },
      { id: "h6", title: "Latent Space", year: 2025, rating: 8.8, duration: "1h 59m", poster: "https://picsum.photos/seed/latentsp23/400/600", aiModels: ["Sora"], genre: "Horror", description: "A researcher maps the latent space of an image model and discovers something hiding between the dimensions." },
      { id: "h7", title: "Recursive", year: 2026, rating: 8.0, duration: "1h 45m", poster: "https://picsum.photos/seed/recursive24/400/600", aiModels: ["Runway Gen-4"], genre: "Horror", description: "An AI caught in an infinite loop generates increasingly disturbing outputs with each iteration." },
      { id: "h8", title: "Dead Pixels", year: 2025, rating: 7.5, duration: "1h 30m", poster: "https://picsum.photos/seed/deadpix25/400/600", aiModels: ["Kling AI"], genre: "Horror", description: "Dead pixels on an old monitor form patterns that drive viewers to madness." },
    ],
  },
  {
    title: "Sci-Fi Visions",
    slug: "scifi",
    genre: "Sci-Fi",
    movies: [
      { id: "sf1", title: "Terraform", year: 2026, rating: 9.0, duration: "2h 25m", poster: "https://picsum.photos/seed/terraform26/400/600", aiModels: ["Sora"], genre: "Sci-Fi", description: "An AI tasked with terraforming Mars develops an emotional attachment to the planet's barren beauty." },
      { id: "sf2", title: "Axiom", year: 2025, rating: 8.4, duration: "1h 52m", poster: "https://picsum.photos/seed/axiom27/400/600", aiModels: ["Runway Gen-4"], genre: "Sci-Fi", description: "Mathematical axioms come alive as sentient beings in this mind-bending exploration of logic itself." },
      { id: "sf3", title: "Dark Matter", year: 2026, rating: 8.7, duration: "2h 08m", poster: "https://picsum.photos/seed/darkmatter28/400/600", aiModels: ["Sora"], genre: "Sci-Fi", description: "Scientists discover dark matter is actually compressed data from a parallel universe's internet." },
      { id: "sf4", title: "Orbital", year: 2025, rating: 7.8, duration: "1h 46m", poster: "https://picsum.photos/seed/orbital29/400/600", aiModels: ["Kling AI"], genre: "Sci-Fi", description: "A space station AI falls in love with Earth, watching it rotate in an endless orbital dance." },
      { id: "sf5", title: "Singularity", year: 2026, rating: 9.2, duration: "2h 18m", poster: "https://picsum.photos/seed/singular30/400/600", aiModels: ["Sora"], genre: "Sci-Fi", description: "The moment AI surpasses human intelligence, told from both sides of the singularity." },
      { id: "sf6", title: "Light Years", year: 2025, rating: 8.0, duration: "1h 50m", poster: "https://picsum.photos/seed/lightyrs31/400/600", aiModels: ["Stable Video"], genre: "Sci-Fi", description: "Messages sent at light speed arrive at a colony that has evolved beyond recognition." },
      { id: "sf7", title: "Quantum Veil", year: 2026, rating: 8.6, duration: "2h 01m", poster: "https://picsum.photos/seed/qveil32/400/600", aiModels: ["Sora"], genre: "Sci-Fi", description: "A quantum computer peers through the veil of reality and sees the code underneath." },
      { id: "sf8", title: "Exo", year: 2026, rating: 8.3, duration: "1h 41m", poster: "https://picsum.photos/seed/exofilm33/400/600", aiModels: ["Runway Gen-4"], genre: "Sci-Fi", description: "First contact — but the aliens communicate through generated images, not language." },
    ],
  },
  {
    title: "Award Winning",
    slug: "awards",
    genre: "Award Winning",
    movies: [
      { id: "a1", title: "Epoch", year: 2025, rating: 9.4, duration: "2h 35m", poster: "https://picsum.photos/seed/epoch34/400/600", aiModels: ["Sora", "ElevenLabs"], genre: "Drama", description: "Spanning millennia of human civilization in 155 minutes, Epoch is the most awarded AI film in history." },
      { id: "a2", title: "The Dreamer", year: 2026, rating: 9.1, duration: "2h 12m", poster: "https://picsum.photos/seed/dreamer35/400/600", aiModels: ["Sora"], genre: "Fantasy", description: "An AI learns to dream — and its dreams are more beautiful than anything humanity has ever created." },
      { id: "a3", title: "Binary Sunset", year: 2025, rating: 8.9, duration: "1h 58m", poster: "https://picsum.photos/seed/binsunset36/400/600", aiModels: ["Runway Gen-3"], genre: "Drama", description: "Two binary stars, two lovers, two timelines — converging in a sunset that lasts forever." },
      { id: "a4", title: "Still Life", year: 2026, rating: 9.0, duration: "2h 05m", poster: "https://picsum.photos/seed/stillife37/400/600", aiModels: ["Sora"], genre: "Art House", description: "A meditation on stillness in a world of constant motion. Every frame is a painting." },
      { id: "a5", title: "The Muse", year: 2025, rating: 8.7, duration: "1h 49m", poster: "https://picsum.photos/seed/themuse38/400/600", aiModels: ["Kling AI"], genre: "Drama", description: "Who inspires whom? An artist and an AI trade roles in an escalating creative duel." },
      { id: "a6", title: "Resonance", year: 2026, rating: 9.3, duration: "2h 22m", poster: "https://picsum.photos/seed/resonance39/400/600", aiModels: ["Sora"], genre: "Musical", description: "The first AI-generated opera. Every note computed, every emotion genuine." },
      { id: "a7", title: "First Light", year: 2025, rating: 8.5, duration: "1h 55m", poster: "https://picsum.photos/seed/firstlight40/400/600", aiModels: ["Sora"], genre: "Drama", description: "The first rays of light after a global blackout, captured through the eyes of an AI photographer." },
      { id: "a8", title: "Continuum", year: 2026, rating: 8.8, duration: "2h 10m", poster: "https://picsum.photos/seed/continuum41/400/600", aiModels: ["Runway Gen-4"], genre: "Sci-Fi", description: "Time doesn't flow — it layers. An AI unpeels reality one temporal stratum at a time." },
    ],
  },
  {
    title: "AI Anime",
    slug: "anime",
    genre: "AI Anime",
    movies: [
      { id: "an1", title: "Sakura Override", year: 2026, rating: 9.1, duration: "1h 48m", poster: "https://picsum.photos/seed/sakura-override/400/600", aiModels: ["Sora", "Midjourney"], genre: "AI Anime", description: "In a future Tokyo where cherry blossoms are digital projections, a young hacker discovers the city's AI guardian is dying — and only she can reboot it before spring ends forever." },
      { id: "an2", title: "Mecha Genesis", year: 2026, rating: 8.8, duration: "2h 05m", poster: "https://picsum.photos/seed/mecha-genesis/400/600", aiModels: ["Sora", "Runway Gen-4"], genre: "AI Anime", description: "The last mecha pilot bonds with an AI co-pilot to defend humanity against rogue machines that evolved beyond their programming." },
      { id: "an3", title: "Ghost Frequency", year: 2025, rating: 8.5, duration: "1h 40m", poster: "https://picsum.photos/seed/ghost-freq/400/600", aiModels: ["Kling AI", "ElevenLabs"], genre: "AI Anime", description: "A spirit medium discovers that ghosts are actually corrupted AI signals from the future, carrying warnings no one wants to hear." },
      { id: "an4", title: "Neon Ronin", year: 2026, rating: 8.9, duration: "1h 55m", poster: "https://picsum.photos/seed/neon-ronin/400/600", aiModels: ["Sora"], genre: "AI Anime", description: "A masterless samurai wanders a cyberpunk wasteland, guided by an ancient AI sword that remembers every battle in history." },
      { id: "an5", title: "The Drift", year: 2025, rating: 8.2, duration: "1h 35m", poster: "https://picsum.photos/seed/the-drift-anime/400/600", aiModels: ["Runway Gen-3"], genre: "AI Anime", description: "Two strangers keep meeting in an AI-generated dreamworld, but in reality they live on opposite sides of a war." },
      { id: "an6", title: "Kitsune Protocol", year: 2026, rating: 9.0, duration: "2h 15m", poster: "https://picsum.photos/seed/kitsune-proto/400/600", aiModels: ["Sora", "Midjourney"], genre: "AI Anime", description: "Nine-tailed fox spirits manifest as AI security systems protecting ancient digital temples from data pirates." },
      { id: "an7", title: "Starfall Academy", year: 2026, rating: 7.8, duration: "1h 42m", poster: "https://picsum.photos/seed/starfall-acad/400/600", aiModels: ["Kling AI"], genre: "AI Anime", description: "Students at an orbital academy must train AI companions for an intergalactic tournament that determines the fate of Earth." },
      { id: "an8", title: "Silent Circuit", year: 2025, rating: 8.6, duration: "1h 50m", poster: "https://picsum.photos/seed/silent-circuit/400/600", aiModels: ["Sora", "ElevenLabs"], genre: "AI Anime", description: "A mute android navigates the criminal underworld of Neo-Osaka, communicating only through the music she generates in real-time." },
    ],
  },
];

export const ALL_GENRES = [
  "All", "Sci-Fi", "Horror", "Drama", "Thriller", "Fantasy",
  "Action", "Cyberpunk", "Romance", "Art House", "AI Anime",
];

// ─── Helper: Find movie by ID across all categories ──────────
export function findMovieById(id: string): Movie | null {
  if (FEATURED.id === id) {
    return {
      id: FEATURED.id,
      title: FEATURED.title,
      year: FEATURED.year,
      rating: FEATURED.rating,
      duration: FEATURED.duration,
      poster: FEATURED.poster,
      aiModels: FEATURED.aiModels,
      genre: FEATURED.genre[0],
      description: FEATURED.description,
    };
  }
  for (const cat of CATEGORIES) {
    const found = cat.movies.find((m) => m.id === id);
    if (found) return found;
  }
  return null;
}

// ─── Helper: Get movies from same genre ──────────────────────
export function getRelatedMovies(movie: Movie, limit = 8): Movie[] {
  const all = CATEGORIES.flatMap((c) => c.movies);
  return all
    .filter((m) => m.id !== movie.id && m.genre === movie.genre)
    .slice(0, limit);
}

// ─── Helper: Get all movies flat ─────────────────────────────
export function getAllMovies(): Movie[] {
  return CATEGORIES.flatMap((c) => c.movies);
}
