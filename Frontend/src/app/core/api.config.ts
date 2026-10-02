import { environment } from '../../environments/environment';

// Single source of truth for the backend address.
export const API_ORIGIN = environment.apiOrigin;
export const API_BASE_URL = `${API_ORIGIN}/api`;

// All endpoints wired to the Express backend:
export const CRAFTS_ENDPOINT = `${API_BASE_URL}/v1/crafts`;
export const ARTISANS_ENDPOINT = `${API_BASE_URL}/v1/artisans`;
export const OFFERS_ENDPOINT = `${API_BASE_URL}/v1/offers`;
export const JOBS_ENDPOINT = `${API_BASE_URL}/v1/jobs`;
export const MARKET_ENDPOINT = `${API_BASE_URL}/v1/market`;
export const CONTACT_ENDPOINT = `${API_BASE_URL}/v1/contact`;
export const WALLET_ENDPOINT = `${API_BASE_URL}/v1/wallet`;
export const USERS_ENDPOINT = `${API_BASE_URL}/users`;
export const REVIEWS_BASE = `${API_BASE_URL}/v1`;
