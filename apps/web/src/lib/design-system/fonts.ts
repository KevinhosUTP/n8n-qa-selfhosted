import localFont from "next/font/local";

// Official, unmodified Inter 4.1 binary; hashes and OFL in design-system/inter.json.
export const inter = localFont({
  src: "../../assets/fonts/inter/InterVariable.woff2",
  variable: "--kl-font-inter",
  weight: "100 900",
  style: "normal",
  display: "swap",
  preload: true,
});
