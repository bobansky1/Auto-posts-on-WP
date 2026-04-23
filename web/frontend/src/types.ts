export interface GenerateRequest {
  prompt: string;
  wp_url: string;
  wp_username: string;
  wp_app_password: string;
  openrouter_api_key: string;
  openrouter_model?: string;
  publish_at?: string;
  categories?: number[];
  tags?: string[];
  image_count?: 2 | 3;
}

export interface HistoryEntry {
  id: string;
  date: string;
  prompt: string;
  post_url: string;
  status: string;
  wp_url: string;
}

export interface ModelSettings {
  openrouter_model: string;
}

export const OPENROUTER_MODELS = [
  'openai/gpt-4o-mini',
  'openai/gpt-4o',
  'anthropic/claude-3-haiku',
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemma-4-31b-it:free',
] as const;

export interface GenerateResponse {
  post_url: string;
  status: string;
}

export interface ErrorResponse {
  error: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface PublicationRecord {
  id: number;
  prompt: string;
  post_url: string;
  status: string;
  wp_url: string;
  created_at: string;
}

export interface FormState {
  prompt: string;
  wp_url: string;
  wp_username: string;
  wp_app_password: string;
  openrouter_api_key: string;
  publish_at: string;
  categories: string;
  tags: string;
  image_count: 2 | 3;
}

export interface FormErrors {
  prompt?: string;
  wp_url?: string;
  wp_username?: string;
  wp_app_password?: string;
  openrouter_api_key?: string;
  publish_at?: string;
  categories?: string;
}
