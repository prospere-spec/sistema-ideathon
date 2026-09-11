"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function EvaluatorSubmissionNotice() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (searchParams.get("submitted") !== "complete") return;
    setMessage("Avaliação enviada com sucesso.");
    router.replace(pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  return message ? <p className="rounded-md bg-lime/30 px-4 py-3 text-sm font-semibold text-lime-deep" role="status">{message}</p> : null;
}
