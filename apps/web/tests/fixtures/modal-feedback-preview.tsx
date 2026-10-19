"use client";

import { useRef, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Drawer } from "@/components/ui/Drawer";
import { ModalCloseButton } from "@/components/ui/ModalCloseButton";
import type { ModalCloseRequest } from "@/components/ui/internal/ModalCore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Radio } from "@/components/ui/Radio";
import { Checkbox } from "@/components/ui/Checkbox";
import { Switch } from "@/components/ui/Switch";
import { HistoryFilterField } from "@/components/ui/filters/HistoryFilterField";
import { Toast, type ToastTone } from "@/components/ui/Toast";
import { ToastRegion, type ToastMessage } from "@/components/ui/ToastRegion";
import { Alert } from "@/components/ui/Alert";

type Kind = "dialog" | "drawer" | "form" | "empty" | "denied" | "long" | "concurrent";
const options = [{ value: "all", label: "Todas" }, { value: "one", label: "Primera opción" }];
const tones: ToastTone[] = ["neutral", "success", "warning", "error"];

export default function ModalFeedbackPreview() {
  const [kind, setKind] = useState<Kind | null>(null);
  const [mounted, setMounted] = useState(true);
  const [second, setSecond] = useState(false);
  const [allowClose, setAllowClose] = useState(false);
  const [preventSubmit, setPreventSubmit] = useState(false);
  const [requests, setRequests] = useState<ModalCloseRequest[]>([]);
  const [submitted, setSubmitted] = useState("");
  const [message, setMessage] = useState<ToastMessage | null>(null);
  const [choiceChanges, setChoiceChanges] = useState(0);
  const [referenceChanges, setReferenceChanges] = useState(0);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const name = useRef<HTMLInputElement>(null);
  const count = useRef(0);
  function requestClose(request: ModalCloseRequest) {
    setRequests((previous) => [...previous, request]);
    if (kind !== "denied" || allowClose) setKind(null);
  }
  const props = { id: "shared-modal", open: kind !== null, onCloseRequest: requestClose,
    title: "Diálogo de demostración", description: "Fixture de componentes. No ejecuta operaciones de negocio.",
    returnFocus: () => trigger.current?.isConnected ? trigger.current : document.getElementById("main-content") };
  const actions = <>
    <Button variant="destructive" disabled>Acción de muestra no disponible</Button>
    <ModalCloseButton id="modal-close" variant="tertiary">Cerrar</ModalCloseButton>
  </>;
  return <main id="main-content" tabIndex={-1} style={{ maxWidth: 1200, margin: "0 auto", padding: 20, display: "grid", gridTemplateColumns: "minmax(0, 1fr)", overflowWrap: "anywhere", gap: 24, minHeight: 1800 }}>
    <h1>PR05b · Fixture local</h1>
    <p>Solo verificación de componentes. No se publica esta ruta ni se simulan operaciones.</p>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignContent: "start" }}>
      {(["dialog", "drawer", "form", "empty", "denied", "long", "concurrent"] as const).map((value) => <Button key={value} id={`open-${value}`} aria-haspopup="dialog" aria-controls="shared-modal" aria-expanded={kind === value} onClick={(event) => {
        trigger.current = event.currentTarget; setMounted(true); setRequests([]); setKind(value);
      }}>Abrir {value}</Button>)}
      <Button id="unmount-modal" onClick={() => { setMounted(false); setKind(null); }}>Desmontar fixture</Button>
    </div>
    <output id="close-requests">{JSON.stringify(requests)}</output>
    <output id="form-result">{submitted}</output>
    {mounted && kind !== "drawer" ? <Dialog {...props} actions={kind === "empty" || kind === "form" ? undefined : actions}
      initialFocus={kind === "form" ? () => name.current : undefined}>
      {kind === "concurrent" ? <Button id="open-second" variant="secondary" onClick={() => setSecond(true)}>Probar apertura simultánea</Button> : null}
      {kind === "denied" ? <Checkbox id="allow-close" label="Permitir cerrar esta fixture" checked={allowClose} onChange={(event) => setAllowClose(event.currentTarget.checked)} /> : null}
      {kind === "long" ? Array.from({ length: 16 }, (_, index) => <p key={index}>Contenido extenso de prueba {index + 1}. {"Texto largo sin recortar ni desbordar. ".repeat(5)}</p>) : null}
      {kind === "form" ? <form id="native-modal-form" method="dialog" onSubmit={(event) => {
        if (preventSubmit) event.preventDefault();
        setSubmitted(String(new FormData(event.currentTarget).get("name")));
      }} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 12, minWidth: 0 }}>
        <Input ref={name} id="modal-name" name="name" label="Nombre de muestra" required />
        <Input id="modal-readonly" label="Solo lectura" defaultValue="Texto conservado" readOnly />
        <fieldset disabled style={{ minWidth: 0, margin: 0, padding: 0, border: 0 }}><Input id="modal-disabled" label="Campo deshabilitado" /></fieldset>
        <HistoryFilterField kind="select" id="modal-select" label="Opción" name="option" options={options} defaultValue="all" />
        <Radio id="modal-radio-a" name="radio" label="Primera opción" value="a" defaultChecked />
        <Radio id="modal-radio-b" name="radio" label="Segunda opción" value="b" />
        <Checkbox id="modal-checkbox" label="Control booleano" />
        <Switch id="modal-switch" label="Interruptor de muestra" />
        <Checkbox id="prevent-submit" label="Cancelar submit en el consumidor" checked={preventSubmit} onChange={(event) => setPreventSubmit(event.currentTarget.checked)} />
        <Button id="modal-submit" type="submit" value="reviewed">Enviar fixture</Button>
        <Button id="modal-submit-override" type="submit" formMethod="dialog" value="overridden">Enviar con método explícito</Button>
        <Button id="modal-reset" type="reset" variant="secondary">Restablecer</Button>
        <ModalCloseButton id="modal-close" variant="tertiary">Cerrar</ModalCloseButton>
      </form> : null}
    </Dialog> : mounted ? <Drawer {...props} title="Filtros del historial" description="Muestra de composición. No filtra datos reales." actions={<>
      <Button disabled>Aplicar filtros</Button><Button disabled variant="secondary">Restablecer filtros</Button>
      <ModalCloseButton id="modal-close" variant="tertiary">Cerrar filtros</ModalCloseButton>
    </>}>
      {(["Severidad", "Fecha", "Versión n8n"] as const).map((label, index) => <HistoryFilterField key={label} kind="select" id={`drawer-select-${index}`} label={label} options={options} defaultValue="all" />)}
    </Drawer> : null}
    <Drawer id="second-modal" open={second} title="Segunda apertura de prueba" onCloseRequest={(request) => {
      setRequests((previous) => [...previous, request]); setSecond(false);
    }} />
    <section id="toast-samples" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 16, minWidth: 0 }}>
      <h2>Composiciones Toast · muestras</h2>
      {tones.map((tone) => <Toast key={tone} tone={tone} label={`Muestra ${tone} · mensaje de demostración`} />)}
      <Toast tone="warning" label={"Contenido largo de demostración sin operación asociada. ".repeat(8)} />
      <Button id="toast-update" onClick={() => { count.current += 1; setMessage({ id: String(count.current), tone: "success", label: "Mensaje de prueba accesible" }); }}>Actualizar región de prueba</Button>
      <Button id="toast-rerender" variant="secondary" onClick={() => setMessage((previous) => previous ? { ...previous } : null)}>Repetir mismo evento</Button>
      <Button id="toast-clear" variant="tertiary" onClick={() => setMessage(null)}>Retirar muestra</Button>
      <ToastRegion message={message} />
    </section>
    <section id="boolean-review" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 16, minWidth: 0 }}>
      <h2>Revisión Off/On · marca y posición</h2>
      <p>Adaptaciones A11Y aprobadas. Los inputs nativos determinan el estado; las señales añadidas son decorativas.</p>
      <form id="choice-review-form" onSubmit={(event) => event.preventDefault()} onChange={() => setChoiceChanges((value) => value + 1)}>
        <h3>Off</h3><Checkbox id="review-checkbox-off" name="checkbox-off" value="yes" label="Checkbox de muestra" /><Switch id="review-switch-off" name="switch-off" value="yes" label="Switch de muestra" />
        <h3>On</h3><Checkbox id="review-checkbox-on" name="checkbox-on" value="yes" label="Checkbox de muestra" defaultChecked /><Switch id="review-switch-on" name="switch-on" value="yes" label="Switch de muestra" defaultChecked />
        <Button id="choice-review-reset" type="reset" variant="secondary">Restablecer muestras</Button>
        <output id="choice-review-changes">{choiceChanges}</output>
      </form>
      <Alert tone="warning" title="Gate pendiente">Axe no instalado. Esta fixture no certifica conformidad WCAG integral.</Alert>
    </section>
    <section id="choice-state-review" style={{ display: "grid", gap: 16, minWidth: 0 }}>
      <h2>Señales sobre superficies · muestras A11Y</h2>
      {(["background", "surface", "raised"] as const).map((surface) => <section key={surface} data-choice-surface={surface} style={{ background: `var(--kl-color-${surface})`, padding: 8, minWidth: 0 }}>
        <h3>{surface}</h3>
        <Checkbox id={`choice-${surface}-checkbox-error`} label="Checkbox con descripción y error de muestra" hint="Descripción asociada" error="Error de muestra" defaultChecked />
        <Switch id={`choice-${surface}-switch-error`} label="Switch con descripción y error de muestra" hint="Descripción asociada" error="Error de muestra" defaultChecked />
        <fieldset disabled style={{ minWidth: 0, margin: 0, padding: 0, border: 0 }}>
          <legend>Deshabilitados por fieldset</legend>
          <Checkbox id={`choice-${surface}-checkbox-disabled-off`} label="Checkbox deshabilitado Off" />
          <Checkbox id={`choice-${surface}-checkbox-disabled-on`} label="Checkbox deshabilitado On" defaultChecked />
          <Switch id={`choice-${surface}-switch-disabled-off`} label="Switch deshabilitado Off" />
          <Switch id={`choice-${surface}-switch-disabled-on`} label="Switch deshabilitado On" defaultChecked />
        </fieldset>
      </section>)}
    </section>
    <form id="native-choice-reference" onSubmit={(event) => event.preventDefault()} onChange={() => setReferenceChanges((value) => value + 1)}>
      <h2>Referencia React nativa · sin decoración</h2>
      <label htmlFor="reference-checkbox">Checkbox de referencia <input id="reference-checkbox" name="reference-checkbox" type="checkbox" /></label>
      <label htmlFor="reference-switch">Switch de referencia <input id="reference-switch" name="reference-switch" type="checkbox" role="switch" /></label>
      <Button id="reference-reset" type="reset">Restablecer referencia</Button>
      <output id="reference-changes">{referenceChanges}</output>
    </form>
  </main>;
}
