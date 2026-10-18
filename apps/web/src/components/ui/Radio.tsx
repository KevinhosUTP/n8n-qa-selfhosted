import { Choice, type ChoiceProps } from "./Choice";
export type RadioProps = ChoiceProps;
export function Radio(props: ChoiceProps) { return <Choice {...props} kind="radio" />; }
