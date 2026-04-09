// ─── Shared Movie Data for Spike AI ────────────────────────────
// All movie data now comes from Supabase. This file only contains types.

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

// Empty defaults — real data comes from Supabase
export const FEATURED: FeaturedMovie = {
  id: "",
  title: "",
  displayTitle: "",
  tagline: "",
  description: "",
  genre: [],
  year: 2026,
  duration: "",
  rating: 0,
  maturity: "",
  aiModels: [],
  director: "",
  image: "",
  poster: "",
};

export const CATEGORIES: Category[] = [];
