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
            commands::evidence::create_skill_evidence_manual,
            commands::evidence::list_skill_evidence,
            commands::evidence::update_skill_evidence_status,
            commands::documents::list_documents,
            commands::documents::get_document,
            commands::documents::create_document_manual,
            commands::documents::create_document_revision_manual,
            commands::life_timeline::create_life_timeline_entry,
            commands::life_timeline::list_life_timeline_entries,
            commands::life_timeline::get_life_timeline_entry,
            commands::life_timeline::update_life_timeline_entry,
            commands::life_timeline::delete_life_timeline_entry,
            commands::job_targets::create_job_target,
            commands::job_targets::list_job_targets,
            commands::job_targets::get_job_target,
            commands::job_targets::update_job_target,
            commands::job_targets::delete_job_target,
            commands::job_requirement_mappings::save_job_requirement_mapping,
            commands::job_requirement_mappings::list_job_requirement_mappings_by_job_target,
            commands::job_requirement_mappings::get_job_requirement_mapping,
            commands::job_requirement_mappings::update_job_requirement_mapping,
            commands::job_requirement_mappings::delete_job_requirement_mapping,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
