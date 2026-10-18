import { SelectControl, type SelectFieldProps } from "../SelectField";
export type ReportSelectProps = SelectFieldProps & { applied?: boolean };
export function ReportSelect(props: ReportSelectProps) { return <SelectControl {...props} appearance="report" />; }
