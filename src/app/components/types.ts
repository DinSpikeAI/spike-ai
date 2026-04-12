export interface Movie {
  id: string;
  title: string;
  year: number;
  rating: number;
  duration: string;
  poster: string;
  aiModels: string[];
  genre?: string;
  description?: string;
  creator?: string;
  upvotes_count: number;
  view_count?: number;
  video_url?: string;
  sort_order?: number;
  series_name?: string;
  episode_number?: number;
}

export interface Category {
  title: string;
  slug: string;
  genre: string;
  movies: Movie[];
}

export interface HeroSlide {
  id: string;
  title: string;
  tagline: string;
  genre: string[];
  year: number;
  duration: string;
  rating: number;
  maturity: string;
  aiModels: string[];
  image: string;
  rank?: number;
}

export const HERO_SLIDES: HeroSlide[] = [];

export const COLLECTIONS = [
  { id: "col-anime", title: "AI Anime", subtitle: "Neural-powered animation", image: "/anime.jpg", genre: "Anime" },
  { id: "col-horror", title: "AI Horror", subtitle: "Fear generated frame by frame", image: "/horror.jpg", genre: "Horror" },
  { id: "col-scifi", title: "Sci-Fi Visions", subtitle: "Tomorrow rendered today", image: "https://images.unsplash.com/photo-1534996858221-380b92700493?w=800&h=450&fit=crop", genre: "Sci-Fi" },
  { id: "col-award", title: "Award Winners", subtitle: "The best of AI cinema", image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&h=450&fit=crop", genre: "Award Winning" },
  { id: "col-sora", title: "Made with Runway", subtitle: "Runway's finest works", image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&h=450&fit=crop", genre: "Runway Gen-4" },
];

export const FALLBACK_CATEGORIES: Category[] = [];

export const ALL_GENRES = ["All", "Sci-Fi", "Horror", "Drama", "Thriller", "Fantasy", "Action", "Cyberpunk", "Romance", "Art House", "Anime"];

export const ALL_AI_MODELS = ["All", "Runway Gen-4", "Runway Gen-3", "Midjourney", "Stable Diffusion XL", "Stable Video", "Kling AI", "Pika Labs", "ElevenLabs"];
