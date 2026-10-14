/** Baixa bytes como arquivo .xlsx (ou outro tipo) pelo navegador. */
export function downloadBytes(bytes: Uint8Array, name: string, type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"): void {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

type SaveFileHandle = {
  readonly name: string;
  createWritable(): Promise<{
    write(data: Blob): Promise<void>;
    close(): Promise<void>;
    abort?: () => Promise<void>;
  }>;
  queryPermission?: (descriptor: { mode: "readwrite" }) => Promise<"granted" | "denied" | "prompt">;
  requestPermission?: (descriptor: { mode: "readwrite" }) => Promise<"granted" | "denied" | "prompt">;
}

type SavePickerOptions = {
  suggestedName: string;
  types: { description: string; accept: Record<string, string[]> }[];
  excludeAcceptAllOption: boolean;
};

type WindowWithSavePicker = Window & {
  showSaveFilePicker?: (options: SavePickerOptions) => Promise<SaveFileHandle>;
};

/** Abre um handle novo a cada salvamento para evitar estado de arquivo obsoleto e downloads duplicados. */
export async function saveBytesReplacing(
  bytes: Uint8Array,
  name: string,
  type: string,
): Promise<string> {
  const browser = window as WindowWithSavePicker;
  if (!browser.showSaveFilePicker) {
    throw new Error("Este navegador não permite substituir arquivos diretamente. Use Chrome ou Edge para salvar o CSV sem duplicatas.");
  }

  const handle = await browser.showSaveFilePicker({
    suggestedName: name,
    excludeAcceptAllOption: true,
    types: [{ description: "Arquivo CSV", accept: { "text/csv": [".csv"] } }],
  });

  const writable = await handle.createWritable();
  try {
    await writable.write(new Blob([bytes as BlobPart], { type }));
    await writable.close();
  } catch (error) {
    await writable.abort?.();
    throw error;
  }
  return handle.name;
}
