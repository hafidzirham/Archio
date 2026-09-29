use std::{
    fs,
    io::{BufRead, BufReader, Write},
    path::{Path, PathBuf},
    process::{Child, ChildStdin, ChildStdout, Command, Stdio},
    sync::Mutex,
};

#[cfg(windows)]
use std::os::windows::process::CommandExt;

use serde::{Deserialize, Serialize};


/* ============================================================
   PATH
   ============================================================ */

const PYTHON_PATH: &str =
    r"C:\Program Files\LibreOffice\program\python.exe";

const RENDERER_PATH: &str =
    r"D:\Archio\src\backend\preview\presentation\renderer.py";


/* ============================================================
   PRESENTATION REQUEST / RESPONSE
   ============================================================ */

#[derive(Debug, Serialize)]
struct PresentationRequest {
    command: String,

    #[serde(rename = "filePath")]
    file_path: String,

    #[serde(rename = "slideIndex")]
    slide_index: usize,
}


#[derive(Debug, Deserialize)]
struct PresentationResponse {
    success: bool,

    data: Option<serde_json::Value>,

    error: Option<String>,
}


/* ============================================================
   PRESENTATION WORKER
   ============================================================ */

struct PresentationWorker {
    child: Child,
    stdin: ChildStdin,
    stdout: BufReader<ChildStdout>,
}


impl PresentationWorker {

    fn start() -> Result<Self, String> {

        if !Path::new(PYTHON_PATH).exists() {
            return Err(format!(
                "Python LibreOffice tidak ditemukan: {}",
                PYTHON_PATH
            ));
        }


        if !Path::new(RENDERER_PATH).exists() {
            return Err(format!(
                "renderer.py tidak ditemukan: {}",
                RENDERER_PATH
            ));
        }


        println!(
            "[PresentationWorker] Starting renderer..."
        );


        let mut child = Command::new(PYTHON_PATH)
            .arg(RENDERER_PATH)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::inherit())
            .creation_flags(0x08000000)
            .spawn()
            .map_err(|error| {
                format!(
                    "Gagal menjalankan presentation renderer: {}",
                    error
                )
            })?;


        let stdin = child
            .stdin
            .take()
            .ok_or_else(|| {
                "Gagal mengambil stdin renderer."
                    .to_string()
            })?;


        let stdout = child
            .stdout
            .take()
            .ok_or_else(|| {
                "Gagal mengambil stdout renderer."
                    .to_string()
            })?;


        let stdout = BufReader::new(stdout);


        println!(
            "[PresentationWorker] Renderer process started."
        );


        Ok(Self {
            child,
            stdin,
            stdout,
        })
    }


    fn render(
        &mut self,
        file_path: String,
        slide_index: usize,
    ) -> Result<serde_json::Value, String> {

        if !Path::new(&file_path).exists() {
            return Err(format!(
                "File tidak ditemukan: {}",
                file_path
            ));
        }


        let request = PresentationRequest {
            command: "render".to_string(),
            file_path,
            slide_index,
        };


        let json = serde_json::to_string(&request)
            .map_err(|error| {
                format!(
                    "Gagal membuat request renderer: {}",
                    error
                )
            })?;


        writeln!(
            self.stdin,
            "{}",
            json
        )
        .map_err(|error| {
            format!(
                "Gagal mengirim request renderer: {}",
                error
            )
        })?;


        self.stdin
            .flush()
            .map_err(|error| {
                format!(
                    "Gagal flush request renderer: {}",
                    error
                )
            })?;


        let mut response_line = String::new();


        self.stdout
            .read_line(&mut response_line)
            .map_err(|error| {
                format!(
                    "Gagal membaca response renderer: {}",
                    error
                )
            })?;


        if response_line.trim().is_empty() {
            return Err(
                "Renderer mengembalikan response kosong."
                    .to_string()
            );
        }


        let response: PresentationResponse =
            serde_json::from_str(
                response_line.trim()
            )
            .map_err(|error| {
                format!(
                    "Response renderer tidak valid: {} | Response: {}",
                    error,
                    response_line.trim()
                )
            })?;


        if !response.success {
            return Err(
                response
                    .error
                    .unwrap_or_else(|| {
                        "Presentation renderer gagal."
                            .to_string()
                    })
            );
        }


        response
            .data
            .ok_or_else(|| {
                "Renderer berhasil tetapi tidak mengembalikan data."
                    .to_string()
            })
    }


    #[allow(dead_code)]
    fn shutdown(&mut self) {

        let shutdown_request =
            serde_json::json!({
                "command": "shutdown"
            });


        let _ = writeln!(
            self.stdin,
            "{}",
            shutdown_request
        );


        let _ = self.stdin.flush();

        let _ = self.child.kill();

        let _ = self.child.wait();


        println!(
            "[PresentationWorker] Renderer stopped."
        );
    }
}


/* ============================================================
   FILE SCANNER
   ============================================================ */

#[derive(Debug, Serialize)]
struct ScannedFile {
    name: String,
    path: String,
    extension: String,
    category: String,
    size: u64,
}


/* ============================================================
   FILE CATEGORY
   ============================================================ */

fn get_file_category(
    extension: &str,
) -> &'static str {

    match extension.to_lowercase().as_str() {
        ".jpg"
        | ".jpeg"
        | ".png"
        | ".gif"
        | ".webp"
        | ".bmp"
        | ".svg"
        | ".ai"
        | ".eps"
        | ".ps"
        | ".psd"
        | ".psb"
        | ".ico"
        | ".tiff"
        | ".tif" => {
            "image"
        }

        ".mp4"
        | ".mkv"
        | ".avi"
        | ".mov"
        | ".wmv"
        | ".webm"
        | ".m4v" => {
            "video"
        }

        ".mp3"
        | ".wav"
        | ".flac"
        | ".aac"
        | ".m4a"
        | ".ogg"
        | ".wma" => {
            "audio"
        }

        ".pdf"
        | ".doc"
        | ".docx"
        | ".odt"
        | ".rtf"
        | ".txt" => {
            "document"
        }

        ".xls"
        | ".xlsx"
        | ".xlsm"
        | ".csv"
        | ".ods" => {
            "spreadsheet"
        }

        ".ppt"
        | ".pptx"
        | ".pptm"
        | ".ppsx"
        | ".ppsm"
        | ".potx"
        | ".potm"
        | ".odp" => {
            "presentation"
        }

        _ => {
            "unsupported"
        }
    }
}


/* ============================================================
   SCAN DIRECTORY
   ============================================================ */

fn scan_directory(
    directory: &Path,
    files: &mut Vec<ScannedFile>,
) -> Result<(), String> {

    let entries = std::fs::read_dir(directory)
        .map_err(|error| {
            format!(
                "Gagal membaca folder {}: {}",
                directory.display(),
                error
            )
        })?;


    for entry in entries {

        let entry = match entry {

            Ok(entry) => entry,

            Err(error) => {

                eprintln!(
                    "[FileScanner] Gagal membaca entry: {}",
                    error
                );

                continue;
            }
        };


        let path = entry.path();


        let metadata = match entry.metadata() {

            Ok(metadata) => metadata,

            Err(error) => {

                eprintln!(
                    "[FileScanner] Gagal membaca metadata {}: {}",
                    path.display(),
                    error
                );

                continue;
            }
        };


        if !metadata.is_file() {
            continue;
        }


        let extension = path
            .extension()
            .and_then(|extension| {
                extension.to_str()
            })
            .map(|extension| {
                format!(
                    ".{}",
                    extension.to_lowercase()
                )
            })
            .unwrap_or_default();


        let name = path
            .file_name()
            .and_then(|name| {
                name.to_str()
            })
            .unwrap_or("")
            .to_string();


        if name.is_empty() {
            continue;
        }


        let category =
            get_file_category(&extension);


        files.push(
            ScannedFile {
                name,
                path: path
                    .to_string_lossy()
                    .to_string(),
                extension,
                category: category.to_string(),
                size: metadata.len(),
            }
        );
    }


    Ok(())
}

/* ============================================================
   IMAGE / VECTOR PREVIEW
   ============================================================ */

#[tauri::command]
fn render_image_preview(
    file_path: String,
) -> Result<String, String> {

    let source = Path::new(&file_path);

    if !source.exists() {
        return Err(format!(
            "File tidak ditemukan: {}",
            file_path
        ));
    }

    if !source.is_file() {
        return Err(format!(
            "Path bukan file: {}",
            file_path
        ));
    }

    let extension = source
        .extension()
        .and_then(|extension| extension.to_str())
        .unwrap_or("")
        .to_lowercase();

    let supported = matches!(
        extension.as_str(),
        "ai" | "eps" | "ps" | "psd" | "psb"
    );

    if !supported {
        return Err(format!(
            "Format {} tidak didukung oleh vector renderer.",
            extension
        ));
    }

    let temp_directory =
        std::env::temp_dir().join("Archio").join("preview");

    fs::create_dir_all(&temp_directory)
        .map_err(|error| {
            format!(
                "Gagal membuat temporary preview directory: {}",
                error
            )
        })?;

    /*
     * Nama output dibuat berdasarkan timestamp + process ID
     * supaya tidak bentrok ketika beberapa file dirender.
     */
    let timestamp = std::time::SystemTime::now()
        .duration_since(
            std::time::UNIX_EPOCH
        )
        .map_err(|error| {
            format!(
                "Gagal mendapatkan timestamp: {}",
                error
            )
        })?
        .as_millis();

    let process_id =
        std::process::id();

    let output_path = temp_directory.join(
        format!(
            "preview_{}_{}.png",
            process_id,
            timestamp
        )
    );

    println!(
        "[ImageRenderer] Rendering: {}",
        source.display()
    );

    /*
     * AI / EPS / PS biasanya membutuhkan density
     * lebih tinggi ketika dirasterisasi.
     */
    let mut command =
        Command::new("magick");

    if matches!(
        extension.as_str(),
        "ai" | "eps" | "ps"
    ) {
        command
            .arg("-density")
            .arg("144");
    }

    let output = command
        .arg(source)
        .arg("-background")
        .arg("none")
        .arg("-alpha")
        .arg("on")
        .arg("-colorspace")
        .arg("sRGB")
        .arg("-resize")
        .arg("2400x2400>")
        .arg(format!(
            "PNG32:{}",
            output_path.display()
        ))
        .output()
        .map_err(|error| {
            format!(
                "ImageMagick tidak dapat dijalankan. Pastikan ImageMagick sudah tersedia: {}",
                error
            )
        })?;

    if !output.status.success() {
        let stderr =
            String::from_utf8_lossy(
                &output.stderr
            );

        let stdout =
            String::from_utf8_lossy(
                &output.stdout
            );

        return Err(format!(
            "ImageMagick gagal merender file. stdout: {} | stderr: {}",
            stdout.trim(),
            stderr.trim()
        ));
    }

    if !output_path.exists() {
        return Err(
            "ImageMagick selesai tetapi file preview tidak ditemukan."
                .to_string()
        );
    }

    println!(
        "[ImageRenderer] Preview created: {}",
        output_path.display()
    );

    Ok(
        output_path
            .to_string_lossy()
            .to_string()
    )
}

/* ============================================================
   RENDER PRESENTATION
   ============================================================ */

#[tauri::command]
fn render_presentation(
    file_path: String,
    slide_index: usize,
    worker: tauri::State<'_, Mutex<PresentationWorker>>,
) -> Result<serde_json::Value, String> {

    let mut worker = worker
        .lock()
        .map_err(|_| {
            "Presentation worker sedang terkunci."
                .to_string()
        })?;


    worker.render(
        file_path,
        slide_index,
    )
}


/* ============================================================
   SCAN FOLDER
   ============================================================ */

#[tauri::command]
fn scan_folder(
    folder_path: String,
) -> Result<Vec<ScannedFile>, String> {

    let folder =
        PathBuf::from(&folder_path);


    if !folder.exists() {
        return Err(format!(
            "Folder tidak ditemukan: {}",
            folder_path
        ));
    }


    if !folder.is_dir() {
        return Err(format!(
            "Path bukan folder: {}",
            folder_path
        ));
    }


    println!(
        "[FileScanner] Scanning: {}",
        folder.display()
    );


    let mut files =
        Vec::new();


    scan_directory(
        &folder,
        &mut files,
    )?;


    files.sort_by_key(|file| {
        file.name.to_lowercase()
    });


    println!(
        "[FileScanner] Found {} file(s).",
        files.len()
    );


    Ok(files)
}


/* ============================================================
   DELETE FILE → WINDOWS RECYCLE BIN
   ============================================================ */

#[tauri::command]
fn delete_file(
    file_path: String,
) -> Result<(), String> {

    let path =
        Path::new(&file_path);


    if !path.exists() {
        return Err(format!(
            "File tidak ditemukan: {}",
            file_path
        ));
    }


    if !path.is_file() {
        return Err(format!(
            "Path bukan file: {}",
            file_path
        ));
    }


    #[cfg(target_os = "windows")]
    {
        /*
         * Microsoft.VisualBasic.FileIO digunakan supaya
         * file masuk ke Windows Recycle Bin, bukan
         * langsung dihapus permanen.
         *
         * Path di-escape untuk PowerShell.
         */

        let escaped_path =
            file_path.replace(
                '\'',
                "''"
            );


        let script = format!(
            r#"
            Add-Type -AssemblyName Microsoft.VisualBasic;
            [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile(
                '{}',
                [Microsoft.VisualBasic.FileIO.UIOption]::OnlyErrorDialogs,
                [Microsoft.VisualBasic.FileIO.RecycleOption]::SendToRecycleBin
            )
            "#,
            escaped_path
        );


        let output = Command::new("powershell.exe")
            .args([
                "-NoProfile",
                "-NonInteractive",
                "-ExecutionPolicy",
                "Bypass",
                "-Command",
                &script,
            ])
            .creation_flags(0x08000000)
            .output()
            .map_err(|error| {
                format!(
                    "Gagal menjalankan Windows Recycle Bin: {}",
                    error
                )
            })?;


        if !output.status.success() {

            let stderr =
                String::from_utf8_lossy(
                    &output.stderr
                );


            return Err(format!(
                "Gagal memindahkan file ke Recycle Bin: {}",
                stderr.trim()
            ));
        }


        println!(
            "[FileAction] Moved to Recycle Bin: {}",
            file_path
        );


        return Ok(());
    }


    #[cfg(not(target_os = "windows"))]
    {
        Err(
            "Fitur Recycle Bin saat ini hanya tersedia di Windows."
                .to_string()
        )
    }
}


/* ============================================================
   MOVE FILE
   ============================================================ */

#[tauri::command]
fn move_file(
    file_path: String,
    destination_folder: String,
) -> Result<String, String> {

    let source =
        PathBuf::from(&file_path);

    let destination =
        PathBuf::from(&destination_folder);


    if !source.exists() {
        return Err(format!(
            "File tidak ditemukan: {}",
            file_path
        ));
    }


    if !source.is_file() {
        return Err(format!(
            "Path bukan file: {}",
            file_path
        ));
    }


    if !destination.exists() {
        return Err(format!(
            "Folder tujuan tidak ditemukan: {}",
            destination_folder
        ));
    }


    if !destination.is_dir() {
        return Err(format!(
            "Path tujuan bukan folder: {}",
            destination_folder
        ));
    }


    let file_name = source
        .file_name()
        .ok_or_else(|| {
            "Nama file tidak valid."
                .to_string()
        })?;


    let target =
        destination.join(file_name);


    if target.exists() {
        return Err(format!(
            "File dengan nama yang sama sudah ada di folder tujuan: {}",
            target.display()
        ));
    }


    match fs::rename(
        &source,
        &target,
    ) {

        Ok(_) => {}

        Err(rename_error) => {

            fs::copy(
                &source,
                &target,
            )
            .map_err(|copy_error| {
                format!(
                    "Gagal memindahkan file. Rename: {} | Copy: {}",
                    rename_error,
                    copy_error
                )
            })?;


            fs::remove_file(
                &source
            )
            .map_err(|remove_error| {

                let _ =
                    fs::remove_file(&target);

                format!(
                    "File berhasil disalin tetapi file asli gagal dihapus: {}",
                    remove_error
                )
            })?;
        }
    }


    println!(
        "[FileAction] Moved: {} -> {}",
        source.display(),
        target.display()
    );


    Ok(
        target
            .to_string_lossy()
            .to_string()
    )
}


/* ============================================================
   OPEN FILE WITH
   ============================================================ */

#[tauri::command]
fn open_file_with(
    file_path: String,
) -> Result<(), String> {

    #[cfg(target_os = "windows")]
    {
        let path =
            Path::new(&file_path);


        if !path.exists() {
            return Err(format!(
                "File tidak ditemukan: {}",
                file_path
            ));
        }


        if !path.is_file() {
            return Err(format!(
                "Path bukan file: {}",
                file_path
            ));
        }


        Command::new("rundll32.exe")
            .arg("shell32.dll,OpenAs_RunDLL")
            .arg(&file_path)
            .spawn()
            .map_err(|error| {
                format!(
                    "Gagal membuka Windows Open With: {}",
                    error
                )
            })?;


        println!(
            "[Archio] Membuka Windows Open With: {}",
            file_path
        );


        Ok(())
    }


    #[cfg(not(target_os = "windows"))]
    {
        Err(
            "Fitur Open With saat ini hanya tersedia di Windows."
                .to_string()
        )
    }
}


/* ============================================================
   TAURI APP
   ============================================================ */

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {

    let worker =
        PresentationWorker::start()
            .expect(
                "Gagal memulai Presentation Renderer."
            );


    tauri::Builder::default()

        .manage(
            Mutex::new(worker)
        )

        .plugin(
            tauri_plugin_dialog::init()
        )

        .invoke_handler(
            tauri::generate_handler![
                render_presentation,
                render_image_preview,
                scan_folder,
                delete_file,
                move_file,
                open_file_with
            ]
        )

        .build(
            tauri::generate_context!()
        )

        .expect(
            "error while building Archio"
        )

        .run(
            |_app_handle, event| {

                if let tauri::RunEvent::Exit = event {

                    // Worker akan ikut berakhir
                    // ketika proses aplikasi selesai.
                }
            }
        );
}