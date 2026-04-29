mod adapters;
mod commands;

use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let db_path = app.path().app_data_dir()?.join("episfolio.db");
            if let Some(parent) = db_path.parent() {
                std::fs::create_dir_all(parent)?;
            }
            let conn = adapters::sqlite::open(db_path)
                .map_err(|e| Box::new(e) as Box<dyn std::error::Error>)?;
            app.manage(Mutex::new(conn));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::episodes::create_episode,
            commands::episodes::list_episodes,
            commands::episodes::get_episode,
            commands::episodes::update_episode,
            commands::episodes::delete_episode,
            commands::settings::save_api_key,
            commands::settings::load_api_key,
            commands::settings::delete_api_key,
            commands::settings::test_openai_connection,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
