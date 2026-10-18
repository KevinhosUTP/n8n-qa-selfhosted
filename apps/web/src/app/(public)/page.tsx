import { BrandLogo } from "@/components/brand/BrandLogo";
import { Button } from "@/components/ui/Button";
import { PublicContainer } from "@/components/public/PublicContainer";

export default function DevelopmentPage() {
  return (
    <main id="main-content" tabIndex={-1}>
    <PublicContainer className="public-technical">
      <BrandLogo />
      <div className="technical-copy">
        <h1>Base técnica de desarrollo</h1>
        <p>Sistema visual y estructura pública de KevoLint · PR03</p>
        <p className="technical-secondary">La interfaz del producto se incorporará en las siguientes entregas.</p>
      </div>
      <div className="technical-actions"><Button disabled>Disponible en próximas entregas</Button></div>
    </PublicContainer></main>
  );
}
