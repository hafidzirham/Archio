import { open } from "@tauri-apps/plugin-dialog";


export async function pickFolder(): Promise<string | null> {

  const selected = await open({
    directory: true,
    multiple: false,
    title: "Pilih Folder",
  });


  if (typeof selected !== "string") {
    return null;
  }


  return selected;
}