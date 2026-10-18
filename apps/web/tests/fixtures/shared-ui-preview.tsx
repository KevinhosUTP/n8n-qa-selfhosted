"use client";
import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { SelectField } from "@/components/ui/SelectField";
import { Checkbox } from "@/components/ui/Checkbox";
import { Radio } from "@/components/ui/Radio";
import { Switch } from "@/components/ui/Switch";
import { TextLink } from "@/components/ui/TextLink";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { HistoryFilterField } from "@/components/ui/filters/HistoryFilterField";
import { ReportSelect } from "@/components/ui/filters/ReportSelect";
import { Button } from "@/components/ui/Button";

const options = [{ value: "", label: "Elige una opción" }, { value: "one", label: "Primera opción" }, { value: "two", label: "Segunda opción" }, { value: "blocked", label: "No disponible", disabled: true }];
export default function SharedUiPreview() {
  const [text, setText] = useState("Controlado");
  const [select, setSelect] = useState("one");
  const [checked, setChecked] = useState(false);
  const [radio, setRadio] = useState("a");
  const [submits, setSubmits] = useState(0);
  const [changes, setChanges] = useState(0);
  const [message, setMessage] = useState("Mensaje persistente de ejemplo.");
  return <main className="technical" id="fixture-main" style={{ gridTemplateColumns: "minmax(0, 1fr)" }}>
    <h1>PR05a · Fixture local</h1><p>Solo pruebas. Sin persistencia, autenticación ni operaciones de negocio.</p>
    <section aria-labelledby="fields-title"><h2 id="fields-title">Campos originales</h2>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 24 }}>
        <Input id="default-input" label="Correo electrónico" placeholder="tu@correo.com" hint="Ayuda del campo" />
        <Input id="error-input" label="Correo electrónico" defaultValue="tu@correo.com" error="Revisa este campo para continuar." />
        <Input id="disabled-input" label="Correo electrónico" defaultValue="tu@correo.com" disabled />
        <Input id="success-input" label="Correo electrónico" defaultValue="tu@correo.com" validation="success" />
        <Input id="readonly-input" label="Valor de solo lectura" defaultValue="Lectura" readOnly />
        <Input id="long-input" label="Etiqueta extensa para comprobar lectura completa a 320 px" hint="La descripción también debe conservar toda la información sin desbordar el contenedor." />
        <SelectField id="default-select" label="Selector de opción" options={options} defaultValue="one" />
        <SelectField id="error-select" label="Selector de opción" options={options} error="Revisa la opción." />
        <SelectField id="disabled-select" label="Selector de opción" options={options} disabled />
      </div>
    </section>
    <form id="native-form" onSubmit={(event) => { event.preventDefault(); setSubmits((n) => n + 1); }} onChange={() => setChanges((n) => n + 1)}>
      <h2>Contratos nativos</h2><div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 24 }}>
        <Input id="native-input" label="Campo obligatorio" name="native" defaultValue="Inicial" required hint="Usa un valor no vacío." />
        <SelectField id="native-select" label="Selección obligatoria" name="native-select" options={options} defaultValue="one" required />
        <Checkbox id="native-check" name="accept" label="Sin seleccionar" value="yes" />
        <Switch id="native-switch" name="preference" label="Preferencia de ejemplo" defaultChecked />
        <fieldset style={{ minWidth: 0, margin: 0, border: 0, padding: 0 }}><legend>Opciones de ejemplo</legend><Radio id="native-radio-a" name="native-radio" label="Opción A" value="a" defaultChecked /><Radio id="native-radio-b" name="native-radio" label="Opción B" value="b" /></fieldset>
        <Checkbox id="disabled-check" label="Opción deshabilitada" disabled />
        <Button id="submit" type="submit">Validar formulario local</Button><Button id="reset" type="reset" variant="secondary">Restablecer campos</Button>
      </div>
    </form>
    <form id="controlled-form" onSubmit={(e) => e.preventDefault()} onReset={() => { setText("Controlado"); setSelect("one"); setChecked(false); setRadio("a"); }}>
      <h2>Valores controlados por el consumidor</h2><div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 24 }}>
        <Input id="controlled-input" name="controlled" label="Texto controlado" value={text} onChange={(e) => setText(e.target.value)} />
        <SelectField id="controlled-select" label="Select controlado" options={options} value={select} onChange={(e) => setSelect(e.target.value)} />
        <Checkbox id="controlled-check" label="Checkbox controlado" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
        <Switch id="controlled-switch" label="Switch controlado" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
        <fieldset style={{ minWidth: 0, margin: 0, border: 0, padding: 0 }}><legend>Radio controlado</legend><Radio id="controlled-radio-a" name="controlled-radio" value="a" label="A" checked={radio === "a"} onChange={(e) => setRadio(e.target.value)} /><Radio id="controlled-radio-b" name="controlled-radio" value="b" label="B" checked={radio === "b"} onChange={(e) => setRadio(e.target.value)} /></fieldset>
        <Button id="controlled-reset" type="reset">Restablecer valores controlados</Button>
      </div>
    </form>
    <output id="observations">{JSON.stringify({ text, select, checked, radio, submits, changes })}</output>
    <section id="filters"><h2>Filtros sin datos de negocio</h2><div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 24 }}>
      <HistoryFilterField kind="search" id="history-search" label="Buscar por nombre" placeholder="Nombre del workflow…" />
      <HistoryFilterField kind="search" id="history-applied-search" label="Buscar por nombre" defaultValue="Ejemplo aplicado" applied />
      <HistoryFilterField kind="select" id="history-select" label="Severidad" options={options} />
      <HistoryFilterField kind="select" id="history-applied" label="Severidad" options={options} defaultValue="one" applied />
      <ReportSelect id="report-select" label="Motor del informe" options={[{ value: "all", label: "Todos los motores" }, { value: "one", label: "Ciberseguridad e Integraciones" }]} />
      <ReportSelect id="report-applied" label="Motor del informe" options={[{ value: "one", label: "Ciberseguridad e Integraciones" }]} applied />
    </div></section>
    <section id="feedback"><h2>Feedback original</h2><div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 24, justifyItems: "start" }}>
      {(["critical", "warning", "success", "accent", "muted"] as BadgeTone[]).map((tone) => <Badge key={tone} tone={tone}>{({ critical: "Crítico", warning: "Advertencia", success: "OK", accent: "Demo", muted: "En progreso" })[tone]}</Badge>)}
      <Card><h3>Contenedor estructural</h3><p>Sin métricas ni datos comerciales.</p></Card>
      {(["accent", "warning", "critical", "success"] as const).map((tone) => <Alert key={tone} tone={tone} title="Información importante">Revisa el detalle antes de continuar.</Alert>)}
      <Alert tone="accent" title="Actualización de prueba" announce="polite">{message}</Alert><Button id="announce" onClick={() => setMessage("Mensaje actualizado por el usuario.")}>Actualizar mensaje local</Button>
      <EmptyState title="Tu primera auditoría empieza aquí" action={<Button disabled>Nueva auditoría · pendiente</Button>}>Muestra de composición. Sin operación de auditoría.</EmptyState>
      <div style={{ minWidth: 0, maxWidth: "100%" }} aria-busy="true" aria-label="Cargando contenido de muestra"><Skeleton /><p>Estado de carga de ejemplo.</p></div>
    </div></section>
    <section><h2>Enlaces</h2><TextLink id="text-link" href="#fixture-main">Enlace accesible</TextLink><TextLink disabled>Pendiente</TextLink></section>
  </main>;
}
