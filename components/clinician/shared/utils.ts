export function download(name: string, text: string, type: string) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([text], { type }));
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function slotStyle(slot: "taken" | "open" | undefined) {
  if (slot === "taken") return { background: "var(--color-accent-2-600)", border: "0" };
  return { background: "transparent", border: "1.5px dashed var(--color-neutral-500)" };
}
