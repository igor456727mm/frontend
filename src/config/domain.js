import { domain as packageJsonDomain } from './../../package.json';

export const scheme = process.env.API_SCHEME || 'https://';
export const domain = process.env.API_DOMAIN || packageJsonDomain;
