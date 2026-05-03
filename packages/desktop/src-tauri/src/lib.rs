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
            commands::interview_qas::create_interview_qa,
            commands::interview_qas::list_interview_qas_by_job_target,
            commands::interview_qas::get_interview_qa,
            commands::interview_qas::update_interview_qa,
            commands::interview_qas::delete_interview_qa,
            commands::interview_qas::reorder_interview_qas,
            commands::interview_reports::create_interview_report,
            commands::interview_reports::list_interview_reports_by_job_target,
            commands::interview_reports::get_interview_report,
            commands::interview_reports::update_interview_report,
            commands::interview_reports::delete_interview_report,
            commands::job_requirement_mappings::save_job_requirement_mapping,
            commands::job_requirement_mappings::list_job_requirement_mappings_by_job_target,
            commands::job_requirement_mappings::get_job_requirement_mapping,
            commands::job_requirement_mappings::update_job_requirement_mapping,
            commands::job_requirement_mappings::delete_job_requirement_mapping,
            commands::agent_track_records::create_agent_track_record,
            commands::agent_track_records::list_agent_track_records,
            commands::agent_track_records::get_agent_track_record,
            commands::agent_track_records::update_agent_track_record,
            commands::agent_track_records::delete_agent_track_record,
            commands::agent_meeting_emails::create_agent_meeting_email,
            commands::agent_meeting_emails::list_agent_meeting_emails,
            commands::agent_meeting_emails::list_agent_meeting_emails_by_agent,
            commands::agent_meeting_emails::get_agent_meeting_email,
            commands::agent_meeting_emails::update_agent_meeting_email,
            commands::agent_meeting_emails::delete_agent_meeting_email,
            commands::job_wish_sheets::create_job_wish_sheet,
            commands::job_wish_sheets::list_job_wish_sheets,
            commands::job_wish_sheets::get_job_wish_sheet,
            commands::job_wish_sheets::update_job_wish_sheet,
            commands::job_wish_sheets::delete_job_wish_sheet,
            commands::resignation_motives::create_resignation_motive,
            commands::resignation_motives::list_resignation_motives,
            commands::resignation_motives::get_resignation_motive,
            commands::resignation_motives::update_resignation_motive,
            commands::resignation_motives::delete_resignation_motive,
            commands::application_motives::create_application_motive,
            commands::application_motives::list_application_motives,
            commands::application_motives::list_application_motives_by_job_target,
            commands::application_motives::get_application_motive,
            commands::application_motives::update_application_motive,
            commands::application_motives::delete_application_motive,
            commands::boss_references::create_boss_reference,
            commands::boss_references::list_boss_references,
            commands::boss_references::get_boss_reference,
            commands::boss_references::update_boss_reference,
            commands::boss_references::delete_boss_reference,
            commands::customer_references::create_customer_reference,
            commands::customer_references::list_customer_references,
            commands::customer_references::get_customer_reference,
            commands::customer_references::update_customer_reference,
            commands::customer_references::delete_customer_reference,
            commands::work_asset_summaries::create_work_asset_summary,
            commands::work_asset_summaries::list_work_asset_summaries,
            commands::work_asset_summaries::get_work_asset_summary,
            commands::work_asset_summaries::update_work_asset_summary,
            commands::work_asset_summaries::delete_work_asset_summary,
            commands::subordinate_summaries::create_subordinate_summary,
            commands::subordinate_summaries::list_subordinate_summaries,
            commands::subordinate_summaries::get_subordinate_summary,
            commands::subordinate_summaries::update_subordinate_summary,
            commands::subordinate_summaries::delete_subordinate_summary,
            commands::result_by_type::create_result_by_type,
            commands::result_by_type::list_result_by_type,
            commands::result_by_type::get_result_by_type,
            commands::result_by_type::update_result_by_type,
            commands::result_by_type::delete_result_by_type,
            commands::strength_arrows::create_strength_arrow,
            commands::strength_arrows::list_strength_arrows,
            commands::strength_arrows::list_strength_arrows_by_type,
            commands::strength_arrows::get_strength_arrow,
            commands::strength_arrows::update_strength_arrow,
            commands::strength_arrows::delete_strength_arrow,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
