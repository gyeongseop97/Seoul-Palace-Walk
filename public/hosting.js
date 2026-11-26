export const GITHUB_PAGES_ORIGIN="https://gyeongseop97.github.io";
const GAME_SERVER_ORIGIN="https://yuram.vercel.app";

export function isGitHubPages(origin=globalThis.location?.origin){
  return origin===GITHUB_PAGES_ORIGIN;
}

export function gameApiUrl(path,origin=globalThis.location?.origin){
  return isGitHubPages(origin)?GAME_SERVER_ORIGIN+path:path;
}
