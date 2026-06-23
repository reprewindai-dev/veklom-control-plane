"use client";
import useSWR, { SWRConfiguration } from "swr";
import { fetcher } from "@/lib/api";

export function useApi<T = unknown>(path: string | null, options?: SWRConfiguration) {
  return useSWR<T>(path, fetcher, {
    revalidateOnFocus: true, // Resume polling when tab is active
    revalidateOnReconnect: true,
    keepPreviousData: true, // Prevent UI jitter during refreshes
    errorRetryCount: 3,
    errorRetryInterval: 5000, // Starts at 5s, exponential backoff handled natively by SWR
    focusThrottleInterval: 5000, // visibility-aware pausing limits rapid re-fetches
    ...options
  });
}
