use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PrinterInfo {
    name: String,
    is_default: bool,
}

// ═══════════════════════════════════════════════════════════
// Windows USB Printer — via Win32 Print Spooler API
// ═══════════════════════════════════════════════════════════

#[cfg(windows)]
mod win_printer {
    use windows::core::{PCWSTR, PWSTR, HSTRING};
    use windows::Win32::Graphics::Printing::{
        EnumPrintersW, OpenPrinterW, StartDocPrinterW, StartPagePrinter,
        WritePrinter, EndPagePrinter, EndDocPrinter, ClosePrinter,
        DOC_INFO_1W, PRINTER_ENUM_LOCAL, PRINTER_ENUM_CONNECTIONS,
        PRINTER_INFO_2W,
    };
    use windows::Win32::Foundation::HANDLE;

    use super::PrinterInfo;

    /// List semua printer yang terinstall di Windows (lokal + network)
    pub fn list_printers() -> Result<Vec<PrinterInfo>, String> {
        unsafe {
            // Alokasi buffer
            let mut bytes_needed = 0;
            let mut num_printers = 0;
            let _ = EnumPrintersW(
                PRINTER_ENUM_LOCAL | PRINTER_ENUM_CONNECTIONS,
                PCWSTR::null(),
                2,
                None,
                &mut bytes_needed,
                &mut num_printers,
            );

            if bytes_needed == 0 {
                return Ok(Vec::new());
            }

            let mut buffer = vec![0u8; bytes_needed as usize];

            let success = EnumPrintersW(
                PRINTER_ENUM_LOCAL | PRINTER_ENUM_CONNECTIONS,
                PCWSTR::null(),
                2,
                Some(buffer.as_mut_slice()),
                &mut bytes_needed,
                &mut num_printers,
            );

            if success.is_err() {
                return Err(format!("EnumPrintersW gagal: {:?}", success));
            }

            // Parse hasil
            let printers_ptr = buffer.as_ptr() as *const PRINTER_INFO_2W;
            let mut result = Vec::new();

            // Cari default printer
            let default_printer = get_default_printer_name();

            for i in 0..num_printers as usize {
                let printer = &*printers_ptr.add(i);
                let name = printer.pPrinterName.to_string()
                    .unwrap_or_default();

                if name.is_empty() {
                    continue;
                }

                let is_default = default_printer.as_ref()
                    .map(|d| d == &name)
                    .unwrap_or(false);

                result.push(PrinterInfo {
                    name,
                    is_default,
                });
            }

            Ok(result)
        }
    }

    /// Dapatkan nama default printer
    fn get_default_printer_name() -> Option<String> {
        unsafe {
            use windows::Win32::Graphics::Printing::GetDefaultPrinterW;

            let mut size: u32 = 0;
            // Panggilan pertama untuk mendapatkan ukuran buffer
            let _ = GetDefaultPrinterW(PWSTR::null(), &mut size);

            if size == 0 {
                return None;
            }

            let mut buffer = vec![0u16; size as usize];
            let result = GetDefaultPrinterW(
                PWSTR(buffer.as_mut_ptr()),
                &mut size,
            );

            if result.as_bool() {
                // Trim null terminator
                let len = buffer.iter().position(|&c| c == 0).unwrap_or(buffer.len());
                Some(String::from_utf16_lossy(&buffer[..len]))
            } else {
                None
            }
        }
    }

    /// Kirim raw bytes (ESC/POS) ke printer USB melalui Windows Print Spooler
    pub fn print_raw(printer_name: &str, data: &[u8]) -> Result<(), String> {
        unsafe {
            let printer_hstring = HSTRING::from(printer_name);
            let mut handle = HANDLE::default();

            // 1. Buka printer
            OpenPrinterW(
                PCWSTR(printer_hstring.as_ptr()),
                &mut handle,
                None,
            ).map_err(|e| format!("Gagal membuka printer '{}': {}", printer_name, e))?;

            // Pastikan handle ditutup di akhir
            let _guard = PrinterGuard(handle);

            // 2. Mulai dokumen dengan datatype RAW
            let doc_name = HSTRING::from("KANTONG-MAS Receipt");
            let raw_type = HSTRING::from("RAW");

            let mut doc_info = DOC_INFO_1W {
                pDocName: PWSTR(doc_name.as_ptr() as *mut _),
                pOutputFile: PWSTR::null(),
                pDatatype: PWSTR(raw_type.as_ptr() as *mut _),
            };

            let job_id = StartDocPrinterW(handle, 1, &mut doc_info as *mut _ as *const _);
            if job_id == 0 {
                return Err(format!("StartDocPrinter gagal untuk '{}'", printer_name));
            }

            // 3. Mulai halaman
            if StartPagePrinter(handle) == false {
                return Err("StartPagePrinter gagal".into());
            }

            // 4. Kirim data ESC/POS
            let mut bytes_written = 0;
            if WritePrinter(
                handle,
                data.as_ptr() as *const _,
                data.len() as u32,
                &mut bytes_written,
            ) == false {
                return Err("WritePrinter gagal".into());
            }

            if bytes_written as usize != data.len() {
                return Err(format!(
                    "Gagal menulis semua data: {} dari {}",
                    bytes_written,
                    data.len()
                ));
            }

            // 5. Akhiri halaman & dokumen
            if EndPagePrinter(handle) == false {
                return Err("EndPagePrinter gagal".into());
            }
            if EndDocPrinter(handle) == false {
                return Err("EndDocPrinter gagal".into());
            }

            Ok(())
        }
    }

    /// RAII guard untuk menutup handle printer
    struct PrinterGuard(HANDLE);
    impl Drop for PrinterGuard {
        fn drop(&mut self) {
            unsafe {
                let _ = ClosePrinter(self.0);
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════
// Tauri Commands
// ═══════════════════════════════════════════════════════════

/// Daftar semua printer USB/Windows yang tersedia
#[tauri::command]
async fn list_usb_printers() -> Result<Vec<PrinterInfo>, String> {
    log::info!("Mendaftar printer Windows...");

    #[cfg(windows)]
    {
        let result = tauri::async_runtime::spawn_blocking(|| {
            win_printer::list_printers()
        })
        .await
        .map_err(|e| format!("Thread error: {}", e))?;

        match &result {
            Ok(printers) => log::info!("Ditemukan {} printer", printers.len()),
            Err(e) => log::error!("Gagal mendaftar printer: {}", e),
        }
        result
    }

    #[cfg(not(windows))]
    {
        Err("Fitur USB printer hanya tersedia di Windows.".to_string())
    }
}

/// Kirim raw ESC/POS data ke printer USB
#[tauri::command]
async fn print_usb_raw(printer_name: String, data: Vec<u8>) -> Result<(), String> {
    log::info!("Mencetak ke printer USB: '{}' ({} bytes)", printer_name, data.len());

    #[cfg(windows)]
    {
        let result = tauri::async_runtime::spawn_blocking(move || {
            win_printer::print_raw(&printer_name, &data)
        })
        .await
        .map_err(|e| format!("Thread error: {}", e))?;

        match &result {
            Ok(_) => log::info!("Cetak berhasil!"),
            Err(e) => log::error!("Gagal mencetak: {}", e),
        }
        result
    }

    #[cfg(not(windows))]
    {
        Err("Fitur USB printer hanya tersedia di Windows.".to_string())
    }
}

// ── Backward-compatible Bluetooth stubs ──
// Agar frontend lama tidak crash jika masih memanggil command Bluetooth

#[derive(Serialize, Deserialize, Debug)]
pub struct BluetoothDevice {
    name: String,
    address: String,
}

#[tauri::command]
async fn list_bluetooth_devices() -> Result<Vec<BluetoothDevice>, String> {
    log::warn!("list_bluetooth_devices dipanggil — Bluetooth sudah dinonaktifkan, gunakan USB printer.");
    Ok(Vec::new())
}

#[tauri::command]
async fn print_bluetooth_data(_address: String, _data: Vec<u8>) -> Result<(), String> {
    Err("Bluetooth printer sudah dinonaktifkan. Silakan gunakan USB printer di menu Pengaturan.".to_string())
}

// ═══════════════════════════════════════════════════════════
// Tauri App Entry Point
// ═══════════════════════════════════════════════════════════

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_process::init())
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
        list_bluetooth_devices,
        print_bluetooth_data,
        list_usb_printers,
        print_usb_raw
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
