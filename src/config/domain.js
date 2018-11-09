import { domain as packageJsonDomain } from './../../package.json';

export const scheme = window.__API_SCHEME || process.env.REACT_APP_API_SCHEME || 'https://';
export const domain = window.__API_DOMAIN || process.env.REACT_APP_API_DOMAIN || packageJsonDomain;
