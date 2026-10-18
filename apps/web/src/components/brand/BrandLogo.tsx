import Image from "next/image";
import { getBrandAsset, type BrandComposition, type BrandSize, type BrandSurface } from "@/lib/design-system/brand-assets";
import styles from "./BrandLogo.module.css";

type AccessibleBrand = { decorative: true; label?: never } | { decorative?: false; label?: string };
export type BrandLogoProps = AccessibleBrand & {
  composition?: BrandComposition;
  surface?: BrandSurface;
  size?: BrandSize;
  className?: string;
  loading?: "eager" | "lazy";
};

export function BrandLogo({ composition = "Horizontal", surface = "Dark", size = "minimum", decorative = false, label, className, loading = "lazy" }: BrandLogoProps) {
  const asset = getBrandAsset(composition, surface, size);
  const defaultLabel = composition === "WithSignature" ? "KevoLint, by KevoSilva" : composition === "WithDescriptor" ? "KevoLint, Auditoría estática de workflows para n8n" : "KevoLint";
  return (
    <span className={[styles.logo, className].filter(Boolean).join(" ")} data-composition={composition} data-surface={surface}>
      <Image unoptimized loading={loading} src={asset.src} alt={decorative ? "" : label ?? defaultLabel}
        width={asset.width} height={asset.height} style={{ width: asset.displayWidth, height: "auto" }} className={styles.image} />
    </span>
  );
}
