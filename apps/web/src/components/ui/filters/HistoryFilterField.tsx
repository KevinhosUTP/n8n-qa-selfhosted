import { InputControl, type InputProps } from "../Input";
import { SelectControl, type SelectFieldProps } from "../SelectField";
export type HistoryFilterFieldProps = ({ kind: "search"; applied?: boolean } & InputProps) | ({ kind: "select"; applied?: boolean } & SelectFieldProps);
export function HistoryFilterField(props: HistoryFilterFieldProps) {
  if (props.kind === "search") { const { kind: _kind, ...field } = props; void _kind; return <InputControl {...field} type="search" appearance="history" />; }
  const { kind: _kind, ...field } = props; void _kind;
  return <SelectControl {...field} appearance="history" />;
}
