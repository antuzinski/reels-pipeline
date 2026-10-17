import { loadFont as loadCaveat } from "@remotion/google-fonts/Caveat";
import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";
import { loadFont as loadPlayfair } from "@remotion/google-fonts/PlayfairDisplay";

// Handwritten labels on stickers
export const { fontFamily: handFont } = loadCaveat("normal", {
  weights: ["700"],
  subsets: ["cyrillic", "latin"],
});

// Stamps
export const { fontFamily: stampFont } = loadMontserrat("normal", {
  weights: ["800"],
  subsets: ["cyrillic", "latin"],
});

// Big historical numbers
export const { fontFamily: serifFont } = loadPlayfair("normal", {
  weights: ["900"],
  subsets: ["latin"],
});

export const ink = "#2b2118";
export const paper = "#f3ead7";
export const stampRed = "#d62828";
