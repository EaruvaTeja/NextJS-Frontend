// lib/image.ts
//
// Helper for turning backend image paths into URLs that Next.js <Image>
// can safely load.
//
// The Django backend returns image values in one of three shapes:
//   - Absolute URL   "http://127.0.0.1:8000/media/..."   (already good)
//   - Relative URL   "/media/..."                        (needs origin)
//   - null / missing                                     (no image)
//
// This helper normalizes all three cases into a single string-or-null.

export function resolveImageUrl(
  image: string | null | undefined
): string | null {
  if (!image) return null;

  // Already absolute
  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  // Relative — prepend the backend origin.
  // NEXT_PUBLIC_API_BASE_URL is like "http://127.0.0.1:8000/api".
  // The backend origin is that value minus "/api".
  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api";
  const backendOrigin = apiBase.replace(/\/api\/?$/, "");

  const path = image.startsWith("/") ? image : `/${image}`;
  return `${backendOrigin}${path}`;
}