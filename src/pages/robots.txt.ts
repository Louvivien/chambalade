import type { APIRoute } from 'astro';
import { construireRobots } from '../lib/seo';

export const GET: APIRoute = ({ site }) =>
  new Response(construireRobots(new URL('/sitemap.xml', site).href, ['/admin/', '/api/']), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
