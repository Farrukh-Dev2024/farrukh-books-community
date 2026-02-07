
export async function escapeHtml(str: string): Promise<string> {
  const truncated = str.length > 600 ? str.slice(0, 600) + "......." : str;

  const allowedInlineTags = /<\/?(b|i|u|br|p|span|strong)>/gi;
  const allowedImageDomains = ["localhost:3000","localhost","127.0.0.1", "images.unsplash.com", "cdn.myapp.com"];

  // ⚠️ Step 1: Remove javascript: from anywhere (case-insensitive) and onFunctions\
  let cleanInput = truncated.replace(/javascript\s*:/gi, "");
  cleanInput = cleanInput.replace(/\s+on\w+\s*=\s*(['"]).*?\1/gi, "");

  // ✅ Step 2: Preserve <img> if from trusted domains or safe local path
  const imgTagRegex = /<img\s+[^>]*src="([^"]+)"[^>]*>/gi;
  const preserveImgTags = (input: string) =>
    input.replace(imgTagRegex, (match, src) => {
      try {
        const isRelative = !/^https?:\/\//i.test(src);

        if (isRelative) {
          if (
            src.startsWith("/") ||
            src.startsWith("./") ||
            /^[a-zA-Z0-9_\-/]+\.(jpg|jpeg|png|gif)$/.test(src)
          ) {
            return `%%${btoa(`<img src="${src}" />`)}%%`;
          }
        } else {
          const url = new URL(src);
          if (
            allowedImageDomains.some((domain) => url.hostname.endsWith(domain))
          ) {
            return `%%${btoa(`<img src="${url.href}" />`)}%%`;
          }
        }
      } catch {}
      return ""; // strip invalid or unsafe <img>
    });

  // ✅ Step 3: Preserve safe inline tags
  const preserveInlineTags = (input: string) =>
    input.replace(allowedInlineTags, (match) => `%%${btoa(match)}%%`);

  // Step 4: Preserve safe tags before escaping
  let preserved = preserveImgTags(cleanInput);
  preserved = preserveInlineTags(preserved);

  // Step 5: Escape the rest
  const escaped = preserved
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  // Step 6: Restore safe tags
  return escaped.replace(/%%(.*?)%%/g, (_, encoded) => {
    try {
      return atob(encoded);
    } catch {
      return "";
    }
  });
}


