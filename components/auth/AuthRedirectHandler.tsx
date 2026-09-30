// components/auth/AuthRedirectHandler.tsx
//
// Watches the URL for ?auth=login or ?auth=register and opens the modal.
//
// Why this exists:
//   We removed the /login and /register pages. Instead, middleware and
//   the Axios 401 interceptor redirect to:
//       /?auth=login
//       /?auth=register
//   This component picks up that query param, opens the modal, and then
//   cleans the URL (so refreshing doesn't re-open the modal).
//
// It renders nothing — pure side-effect component.

"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useAuthModal } from "@/hooks/useAuthModal";

export function AuthRedirectHandler() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { open } = useAuthModal();

  useEffect(() => {
    const auth = searchParams.get("auth");

    if (auth !== "login" && auth !== "register") {
      return;
    }

    // Open the modal on the requested tab
    open(auth);

    // Clean up the URL: remove the ?auth= and ?from= params so that
    // refreshing doesn't re-trigger the modal.
    const params = new URLSearchParams(searchParams.toString());
    params.delete("auth");
    params.delete("from");

    const query = params.toString();
    const cleanUrl = query ? `${pathname}?${query}` : pathname;

    // `replace` (not `push`) so the user's back button doesn't return
    // to the ?auth= URL.
    router.replace(cleanUrl);
  }, [searchParams, pathname, router, open]);

  return null;
}