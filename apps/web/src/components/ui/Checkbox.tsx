import { Choice, type ChoiceProps } from "./Choice";
export type CheckboxProps = ChoiceProps;
export function Checkbox(props: ChoiceProps) { return <Choice {...props} kind="checkbox" />; }
