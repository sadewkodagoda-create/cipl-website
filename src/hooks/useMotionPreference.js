import { useSyncExternalStore } from "react";

const getMedia = () => window.matchMedia("(prefers-reduced-motion: reduce)");
const getSnapshot = () => getMedia().matches;
const getServerSnapshot = () => true;
const subscribe = (onChange) => {
  const media = getMedia();
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
};

// Preferences can change while the page is open. Keep JS and CSS in agreement.
export default function useMotionPreference() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
