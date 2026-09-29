use std::{
    fs,
    io::{BufRead, BufReader, Write},
    path::{Path, PathBuf},
    process::{Child, ChildStdin, ChildStdout, Command, Stdio},
    sync::{Arc, Mutex},
};

#[cfg(windows)]
use std::os::windows::process::CommandExt;

use serde::{Deserialize, Serialize};
use tauri::Manager;


/* ============================================================
   PATH
   ============================================================ */

const SYSTEM_PYTHON_PATH: &str =
    r"C:\Program Files\LibreOffice\program\python.exe";

const SYSTEM_RENDERER_PATH: &str =
    r"D:\Archio\src\backend\preview\presentation\renderer.py";


/* ============================================================
   BUNDLED RESOURCE PATH
   ============================================================ */

fn get_resource_path(
    app: &tauri::AppHandle,
    relative_path: &str,
) -> Result<PathBuf, String> {

    /* ========================================================
       PRODUCTION

       Resource hasil bundle Tauri.
       ======================================================== */

    if let Ok(resource_dir) = app.path().resource_dir() {

        let bundled_path =
            resource_dir.join(relative_path);

        if bundled_path.exists() {
            return Ok(bundled_path);
        }
    }


    /* ========================================================
       DEVELOPMENT

       Saat npm run tauri dev:

       D:\Archio
       └── resources
           └── renderer
               └── ...
       ======================================================== */

    let project_root =
        PathBuf::from(
            env!("CARGO_MANIFEST_DIR")
        )
        .parent()
        .map(Path::to_path_buf)
        .unwrap_or_else(|| {
            PathBuf::from(".")
        });


    let development_path =
        project_root
            .join("resources")
            .join(relative_path);


    if development_path.exists() {
        return Ok(development_path);
    }


    Err(format!(
        "Bundled resource tidak ditemukan.\n\
         Resource: {}\n\
         Development path: {}",
        relative_path,
        development_path.display()
    ))
}


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

    fn start(
        app: &tauri::AppHandle,
    ) -> Result<Self, String> {

        /* ====================================================
           FIND BUNDLED PYTHON
           ==================================================== */

        let bundled_python =
            get_resource_path(
                app,
                "renderer/libreoffice/program/python.exe",
            )
            .ok();


        /* ====================================================
           FIND BUNDLED RENDERER
           ==================================================== */

        let bundled_renderer =
            get_resource_path(
                app,
                "renderer/presentation/renderer.py",
            )
            .ok();


        /* ====================================================
           SELECT PYTHON

           Prioritas:

           1. Bundled LibreOffice Python
           2. System LibreOffice Python
           ==================================================== */

        let python_path =
            bundled_python
                .filter(|path| path.exists())
                .unwrap_or_else(|| {
                    PathBuf::from(
                        SYSTEM_PYTHON_PATH
                    )
                });


        /* ====================================================
           SELECT RENDERER

           Prioritas:

           1. Bundled renderer
           2. Development renderer
           ==================================================== */

        let renderer_path =
            bundled_renderer
                .filter(|path| path.exists())
                .unwrap_or_else(|| {
                    PathBuf::from(
                        SYSTEM_RENDERER_PATH
                    )
                });


        /* ====================================================
           VALIDATE PYTHON
           ==================================================== */

        if !python_path.exists() {

            return Err(format!(
                "Python LibreOffice tidak ditemukan. Dicoba: {}",
                python_path.display()
            ));
        }


        /* ====================================================
           VALIDATE RENDERER
           ==================================================== */

        if !renderer_path.exists() {

            return Err(format!(
                "renderer.py tidak ditemukan: {}",
                renderer_path.display()
            ));
        }


        println!(
            "[PresentationWorker] Starting renderer..."
        );


        println!(
            "[PresentationWorker] Python: {}",
            python_path.display()
        );


        println!(
            "[PresentationWorker] Renderer: {}",
            renderer_path.display()
        );


        /* ====================================================
           START PROCESS
           ==================================================== */

        let mut child =
            Command::new(
                &python_path
            )
            .arg(
                &renderer_path
            )
            .stdin(
                Stdio::piped()
            )
            .stdout(
                Stdio::piped()
            )
            .stderr(
                Stdio::inherit()
            )
            .creation_flags(
                0x08000000
            )
            .spawn()
            .map_err(|error| {
                format!(
                    "Gagal menjalankan presentation renderer: {}",
                    error
                )
            })?;


        /* ====================================================
           STDIN
           ==================================================== */

        let stdin =
            child
                .stdin
                .take()
                .ok_or_else(|| {
                    "Gagal mengambil stdin renderer."
                        .to_string()
                })?;


        /* ====================================================
           STDOUT
           ==================================================== */

        let stdout =
            child
                .stdout
                .take()
                .ok_or_else(|| {
                    "Gagal mengambil stdout renderer."
                        .to_string()
                })?;


        let stdout =
            BufReader::new(
                stdout
            );


        println!(
            "[PresentationWorker] Renderer process started."
        );


        Ok(Self {
            child,
            stdin,
            stdout,
        })
    }


    /* ========================================================
       RENDER REQUEST
       ======================================================== */

    fn render(
        &mut self,
        file_path: String,
        slide_index: usize,
    ) -> Result<serde_json::Value, String> {

        if !Path::new(
            &file_path
        ).exists() {

            return Err(format!(
                "File tidak ditemukan: {}",
                file_path
            ));
        }


        let request =
            PresentationRequest {
                command:
                    "render".to_string(),

                file_path,

                slide_index,
            };


        let json =
            serde_json::to_string(
                &request
            )
            .map_err(|error| {
                format!(
                    "Gagal membuat request renderer: {}",
                    error
                )
            })?;


        /* ====================================================
           SEND REQUEST
           ==================================================== */

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


        /* ====================================================
           READ RESPONSE
           ==================================================== */

        let mut response_line =
            String::new();


        self.stdout
            .read_line(
                &mut response_line
            )
            .map_err(|error| {
                format!(
                    "Gagal membaca response renderer: {}",
                    error
                )
            })?;


        if response_line
            .trim()
            .is_empty()
        {

            return Err(
                "Renderer mengembalikan response kosong."
                    .to_string()
            );
        }


        /* ====================================================
           PARSE RESPONSE
           ==================================================== */

        let response:
            PresentationResponse =
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


        /* ====================================================
           CHECK SUCCESS
           ==================================================== */

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


    /* ========================================================
       SHUTDOWN
       ======================================================== */

    #[allow(dead_code)]
    fn shutdown(
        &mut self,
    ) {

        let shutdown_request =
            serde_json::json!({
                "command": "shutdown"
            });


        let _ =
            writeln!(
                self.stdin,
                "{}",
                shutdown_request
            );


        let _ =
            self.stdin.flush();


        let _ =
            self.child.kill();


        let _ =
            self.child.wait();


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

        /* ====================================================
           IMAGE
           ==================================================== */

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


        /* ====================================================
           VIDEO
           ==================================================== */

        ".mp4"
        | ".mkv"
        | ".avi"
        | ".mov"
        | ".wmv"
        | ".webm"
        | ".m4v" => {
            "video"
        }


        /* ====================================================
           AUDIO
           ==================================================== */

        ".mp3"
        | ".wav"
        | ".flac"
        | ".aac"
        | ".m4a"
        | ".ogg"
        | ".wma" => {
            "audio"
        }


        /* ====================================================
           DOCUMENT
           ==================================================== */

        ".pdf"
        | ".doc"
        | ".docx"
        | ".odt"
        | ".rtf"
        | ".txt" => {
            "document"
        }


        /* ====================================================
           SPREADSHEET
           ==================================================== */

        ".xls"
        | ".xlsx"
        | ".xlsm"
        | ".csv"
        | ".ods" => {
            "spreadsheet"
        }


        /* ====================================================
           PRESENTATION
           ==================================================== */

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

    let entries =
        std::fs::read_dir(
            directory
        )
        .map_err(|error| {
            format!(
                "Gagal membaca folder {}: {}",
                directory.display(),
                error
            )
        })?;


    for entry in entries {

        let entry =
            match entry {

                Ok(entry) =>
                    entry,

                Err(error) => {

                    eprintln!(
                        "[FileScanner] Gagal membaca entry: {}",
                        error
                    );

                    continue;
                }
            };


        let path =
            entry.path();


        let metadata =
            match entry.metadata() {

                Ok(metadata) =>
                    metadata,

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


        let extension =
            path
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


        let name =
            path
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
            get_file_category(
                &extension
            );


        files.push(
            ScannedFile {
                name,

                path:
                    path
                        .to_string_lossy()
                        .to_string(),

                extension,

                category:
                    category.to_string(),

                size:
                    metadata.len(),
            }
        );
    }


    Ok(())
}


/* ============================================================
   IMAGE / VECTOR PREVIEW
   ============================================================ */

#[tauri::command]
async fn render_image_preview(
    app: tauri::AppHandle,
    file_path: String,
) -> Result<String, String> {

    tauri::async_runtime::spawn_blocking(
        move || {
            render_image_preview_blocking(
                app,
                file_path,
            )
        }
    )
    .await
    .map_err(|error| {
        format!(
            "Image renderer task gagal: {}",
            error
        )
    })?
}


fn render_image_preview_blocking(
    app: tauri::AppHandle,
    file_path: String,
) -> Result<String, String> {

    /* ========================================================
       VALIDATE SOURCE
       ======================================================== */

    let source =
        Path::new(
            &file_path
        );


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


    /* ========================================================
       GET EXTENSION
       ======================================================== */

    let extension =
        source
            .extension()
            .and_then(|extension| {
                extension.to_str()
            })
            .unwrap_or("")
            .to_lowercase();


    /* ========================================================
       SUPPORTED VECTOR FORMATS
       ======================================================== */

    if !matches!(
        extension.as_str(),

        "ai"
        | "eps"
        | "ps"
        | "psd"
        | "psb"
    ) {

        return Err(format!(
            "Format .{} tidak didukung oleh vector renderer.",
            extension
        ));
    }


    /* ========================================================
       CACHE KEY
       ======================================================== */

    use std::collections::hash_map::DefaultHasher;

    use std::hash::{
        Hash,
        Hasher,
    };


    let metadata =
        fs::metadata(
            source
        )
        .map_err(|error| {
            format!(
                "Gagal membaca metadata source: {}",
                error
            )
        })?;


    let modified =
        metadata
            .modified()
            .ok()
            .and_then(|value| {
                value.duration_since(
                    std::time::UNIX_EPOCH
                )
                .ok()
            })
            .map(|value| {
                value.as_nanos()
            })
            .unwrap_or(0);


    let mut hasher =
        DefaultHasher::new();


    file_path.hash(
        &mut hasher
    );


    extension.hash(
        &mut hasher
    );


    metadata.len().hash(
        &mut hasher
    );


    modified.hash(
        &mut hasher
    );


    let cache_hash =
        hasher.finish();


    /* ========================================================
       TEMP DIRECTORY
       ======================================================== */

    let temp_directory =
        std::env::temp_dir()
            .join("Archio")
            .join("preview");


    fs::create_dir_all(
        &temp_directory
    )
    .map_err(|error| {
        format!(
            "Gagal membuat temporary preview directory: {}",
            error
        )
    })?;


    let output_path =
        temp_directory.join(
            format!(
                "vector_{:016x}.png",
                cache_hash
            )
        );


    /* ========================================================
       CACHE HIT
       ======================================================== */

    if output_path.exists() {

        if let Ok(metadata) =
            fs::metadata(
                &output_path
            )
        {

            if metadata.len() > 0 {

                println!(
                    "[ImageRenderer] Cache hit: {}",
                    output_path.display()
                );


                return Ok(
                    output_path
                        .to_string_lossy()
                        .to_string()
                );
            }
        }
    }


    println!(
        "[ImageRenderer] Rendering: {}",
        source.display()
    );


    /* ========================================================
       FIND BUNDLED IMAGEMAGICK
       ======================================================== */

    let magick_path =
        get_resource_path(
            &app,
            "renderer/imagemagick/magick.exe",
        )?;


    if !magick_path.exists() {

        return Err(format!(
            "ImageMagick bundled tidak ditemukan: {}",
            magick_path.display()
        ));
    }


    if !magick_path.is_file() {

        return Err(format!(
            "Path ImageMagick bukan file: {}",
            magick_path.display()
        ));
    }


    println!(
        "[ImageRenderer] Using ImageMagick: {}",
        magick_path.display()
    );


    /* ========================================================
       FIND BUNDLED GHOSTSCRIPT
       ======================================================== */

    let ghostscript_bin =
        get_resource_path(
            &app,
            "renderer/ghostscript/bin",
        )?;


    if !ghostscript_bin.exists() {

        return Err(format!(
            "Ghostscript bundled tidak ditemukan: {}",
            ghostscript_bin.display()
        ));
    }


    /* ========================================================
       CREATE IMAGEMAGICK COMMAND
       ======================================================== */

    let mut command =
        Command::new(
            &magick_path
        );


    /* ========================================================
       GHOSTSCRIPT PATH
       ======================================================== */

    let current_path =
        std::env::var_os(
            "PATH"
        )
        .unwrap_or_default();


    let mut paths =
        Vec::new();


    paths.push(
        ghostscript_bin.clone()
    );


    paths.extend(
        std::env::split_paths(
            &current_path
        )
    );


    if let Ok(new_path) =
        std::env::join_paths(
            paths
        )
    {

        command.env(
            "PATH",
            new_path
        );
    }


    /* ========================================================
       AI / EPS / PS
       ======================================================== */

    if matches!(
        extension.as_str(),

        "ai"
        | "eps"
        | "ps"
    ) {

        command
            .arg("-density")
            .arg("96");


        let input =
            format!(
                "{}[0]",
                source.display()
            );


        command.arg(
            input
        );
    }


    /* ========================================================
       PSD / PSB
       ======================================================== */

    else {

        command.arg(
            source
        );
    }


    /* ========================================================
       COMMON PROCESSING
       ======================================================== */

    command
        .arg("-background")
        .arg("none")

        .arg("-alpha")
        .arg("on")

        .arg("-colorspace")
        .arg("sRGB");


    /* ========================================================
       PSD / PSB FLATTEN
       ======================================================== */

    if matches!(
        extension.as_str(),

        "psd"
        | "psb"
    ) {

        command
            .arg("-layers")
            .arg("flatten");
    }


    /* ========================================================
       RESIZE
       ======================================================== */

    command
        .arg("-resize")
        .arg("1400x1400>");


    /* ========================================================
       OUTPUT
       ======================================================== */

    command
        .arg(
            format!(
                "PNG32:{}",
                output_path.display()
            )
        );


    println!(
        "[ImageRenderer] Command: {:?}",
        command
    );


    /* ========================================================
       RUN IMAGEMAGICK
       ======================================================== */

    let output =
        command
            .output()
            .map_err(|error| {
                format!(
                    "ImageMagick bundled tidak dapat dijalankan: {}",
                    error
                )
            })?;


    /* ========================================================
       READ PROCESS OUTPUT
       ======================================================== */

    let stdout =
        String::from_utf8_lossy(
            &output.stdout
        );


    let stderr =
        String::from_utf8_lossy(
            &output.stderr
        );


    println!(
        "[ImageRenderer] Exit status: {}",
        output.status
    );


    if !stdout.trim().is_empty() {

        println!(
            "[ImageRenderer] stdout: {}",
            stdout.trim()
        );
    }


    if !stderr.trim().is_empty() {

        println!(
            "[ImageRenderer] stderr: {}",
            stderr.trim()
        );
    }


    /* ========================================================
       PROCESS FAILED
       ======================================================== */

    if !output.status.success() {

        return Err(format!(
            "ImageMagick gagal merender .{}.\n\
             stdout: {}\n\
             stderr: {}",
            extension,
            stdout.trim(),
            stderr.trim()
        ));
    }


    /* ========================================================
       CHECK EXPECTED OUTPUT
       ======================================================== */

    if output_path.exists() {

        let metadata =
            fs::metadata(
                &output_path
            )
            .map_err(|error| {
                format!(
                    "Preview berhasil dibuat tetapi metadata gagal dibaca: {}",
                    error
                )
            })?;


        if metadata.len() == 0 {

            let _ =
                fs::remove_file(
                    &output_path
                );


            return Err(
                "ImageMagick menghasilkan file preview kosong."
                    .to_string()
            );
        }


        println!(
            "[ImageRenderer] Preview created: {} ({} bytes)",
            output_path.display(),
            metadata.len()
        );


        return Ok(
            output_path
                .to_string_lossy()
                .to_string()
        );
    }


    /* ========================================================
       FALLBACK OUTPUT
       ======================================================== */

    let prefix =
        format!(
            "vector_{:016x}",
            cache_hash
        );


    if let Ok(entries) =
        fs::read_dir(
            &temp_directory
        )
    {

        for entry in entries.flatten() {

            let candidate =
                entry.path();


            if !candidate.is_file() {
                continue;
            }


            let extension_matches =
                candidate
                    .extension()
                    .and_then(|value| {
                        value.to_str()
                    })
                    .map(|value| {
                        value.eq_ignore_ascii_case(
                            "png"
                        )
                    })
                    .unwrap_or(false);


            if !extension_matches {
                continue;
            }


            let name_matches =
                candidate
                    .file_stem()
                    .and_then(|value| {
                        value.to_str()
                    })
                    .map(|value| {
                        value.starts_with(
                            &prefix
                        )
                    })
                    .unwrap_or(false);


            if !name_matches {
                continue;
            }


            let metadata =
                match fs::metadata(
                    &candidate
                ) {

                    Ok(metadata) =>
                        metadata,

                    Err(_) =>
                        continue,
                };


            if metadata.len() == 0 {
                continue;
            }


            println!(
                "[ImageRenderer] Preview created using fallback output: {} ({} bytes)",
                candidate.display(),
                metadata.len()
            );


            return Ok(
                candidate
                    .to_string_lossy()
                    .to_string()
            );
        }
    }


    /* ========================================================
       NO OUTPUT
       ======================================================== */

    Err(format!(
        "ImageMagick selesai tetapi file preview tidak ditemukan.\n\
         Format: .{}\n\
         Output yang diharapkan: {}\n\
         stdout: {}\n\
         stderr: {}",
        extension,
        output_path.display(),
        stdout.trim(),
        stderr.trim()
    ))
}


/* ============================================================
   RENDER PRESENTATION
   ============================================================ */

#[tauri::command]
async fn render_presentation(
    file_path: String,
    slide_index: usize,
    worker:
        tauri::State<
            '_,
            Arc<
                Mutex<
                    PresentationWorker
                >
            >
        >,
) -> Result<serde_json::Value, String> {

    let worker =
        Arc::clone(
            &*worker
        );


    tauri::async_runtime::spawn_blocking(
        move || {

            let mut worker =
                worker
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
    )
    .await
    .map_err(|error| {
        format!(
            "Presentation renderer task gagal: {}",
            error
        )
    })?
}


/* ============================================================
   SCAN FOLDER
   ============================================================ */

#[tauri::command]
fn scan_folder(
    folder_path: String,
) -> Result<Vec<ScannedFile>, String> {

    let folder =
        PathBuf::from(
            &folder_path
        );


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


    files.sort_by_key(
        |file| {
            file.name.to_lowercase()
        }
    );


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
        Path::new(
            &file_path
        );


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

        let escaped_path =
            file_path.replace(
                '\'',
                "''"
            );


        let script =
            format!(
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


        let output =
            Command::new(
                "powershell.exe"
            )
            .args([
                "-NoProfile",
                "-NonInteractive",
                "-ExecutionPolicy",
                "Bypass",
                "-Command",
                &script,
            ])
            .creation_flags(
                0x08000000
            )
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
        PathBuf::from(
            &file_path
        );


    let destination =
        PathBuf::from(
            &destination_folder
        );


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


    let file_name =
        source
            .file_name()
            .ok_or_else(|| {
                "Nama file tidak valid."
                    .to_string()
            })?;


    let target =
        destination.join(
            file_name
        );


    if target.exists() {

        return Err(format!(
            "File dengan nama yang sama sudah ada di folder tujuan: {}",
            target.display()
        ));
    }


    /* ========================================================
       TRY RENAME FIRST
       ======================================================== */

    match fs::rename(
        &source,
        &target,
    ) {

        Ok(_) => {}


        Err(rename_error) => {

            /* =================================================
               FALLBACK COPY + DELETE
               ================================================= */

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
                    fs::remove_file(
                        &target
                    );


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
            Path::new(
                &file_path
            );


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


        Command::new(
            "rundll32.exe"
        )
        .arg(
            "shell32.dll,OpenAs_RunDLL"
        )
        .arg(
            &file_path
        )
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

#[cfg_attr(
    mobile,
    tauri::mobile_entry_point
)]
pub fn run() {

    tauri::Builder::default()

        /* ====================================================
           PRESENTATION WORKER
           ==================================================== */

        .setup(
            |app| {

                let worker =
                    PresentationWorker::start(
                        app.handle()
                    )
                    .expect(
                        "Gagal memulai Presentation Renderer."
                    );


                app.manage(
                    Arc::new(
                        Mutex::new(
                            worker
                        )
                    )
                );


                Ok(())
            }
        )

        /* ====================================================
           DIALOG
           ==================================================== */

        .plugin(
            tauri_plugin_dialog::init()
        )

        /* ====================================================
           COMMANDS
           ==================================================== */

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

        /* ====================================================
           BUILD
           ==================================================== */

        .build(
            tauri::generate_context!()
        )

        .expect(
            "error while building Archio"
        )

        /* ====================================================
           RUN
           ==================================================== */

        .run(
            |_app_handle, event| {

                if let tauri::RunEvent::Exit =
                    event
                {

                    /*
                     * Worker akan ikut berakhir
                     * ketika proses aplikasi selesai.
                     */
                }
            }
        );
}