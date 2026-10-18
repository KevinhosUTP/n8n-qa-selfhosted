import { Choice, type ChoiceProps } from "./Choice";
export type SwitchProps = ChoiceProps;
export function Switch(props: ChoiceProps) { return <Choice {...props} kind="switch" />; }
