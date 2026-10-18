/** Native tab order candidates. Only boundary wrapping is handled here. */
export function canFocus(element: HTMLElement | null): element is HTMLElement {
  return Boolean(element?.isConnected && !element.closest('[inert], [hidden]') &&
    !element.matches(':disabled') && element.getClientRects().length &&
    getComputedStyle(element).visibility === 'visible');
}

export function tabStops(container: HTMLElement): HTMLElement[] {
  const candidates = [...container.querySelectorAll<HTMLElement>(
    'a[href],area[href],button,input,select,textarea,summary,[tabindex],[contenteditable]',
  )].filter((element) => canFocus(element) && element.tabIndex >= 0);
  return candidates.filter((element) => {
    if (!(element instanceof HTMLInputElement) || element.type !== 'radio' || !element.name) return true;
    const group = candidates.filter((item): item is HTMLInputElement => item instanceof HTMLInputElement &&
      item.type === 'radio' && item.name === element.name && item.form === element.form);
    return element === (group.find((item) => item.checked) ?? group[0]);
  }).sort((a, b) => (a.tabIndex || Infinity) - (b.tabIndex || Infinity));
}
