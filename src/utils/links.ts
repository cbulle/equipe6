export const isHttpUrl = (value: string) => /^https?:\/\/\S+$/.test(value.trim());

/** Host name displayed under a link, e.g. `drive.google.com`. */
export function getLinkHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
