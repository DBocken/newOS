// Only inline images are rendered. Loading a remote URL would send the device's
// IP address to whoever wrote it, and a shared character could trick the model
// into putting private details in such a URL.
const INLINE_IMAGE = /data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+=*/g;

export function splitInlineImages(content: string) {
  return {
    images: content.match(INLINE_IMAGE) ?? [],
    text: content.replace(INLINE_IMAGE, "").trim(),
  };
}
