import { BrandLogo } from "@/components/brand/BrandLogo";
import { Button } from "@/components/ui/Button";

export default function DevelopmentPage() {
  return (
    <main className="technical">
      <BrandLogo />
      <div className="technical-copy">
        <h1>Base técnica de desarrollo</h1>
        <p>Sistema visual inicial de KevoLint · PR02</p>
        <p className="technical-secondary">La interfaz del producto se incorporará en las siguientes entregas.</p>
      </div>
      <div className="technical-actions"><Button disabled>Disponible en próximas entregas</Button></div>
    </main>
  );
}
