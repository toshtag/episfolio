mod adapters;
mod commands;

use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
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
            // backup
            commands::backup_if_needed,
            commands::list_backups,
            commands::restore_backup,
            // episodes
            commands::create_episode,
            commands::list_episodes,
            commands::get_episode,
            commands::update_episode,
            commands::delete_episode,
            // evidence
            commands::create_skill_evidence_manual,
            commands::list_skill_evidence,
            commands::update_skill_evidence_status,
            // documents
            commands::list_documents,
            commands::get_document,
            commands::create_document_manual,
            commands::create_document_revision_manual,
            // life timeline
            commands::create_life_timeline_entry,
            commands::list_life_timeline_entries,
            commands::get_life_timeline_entry,
            commands::update_life_timeline_entry,
            commands::delete_life_timeline_entry,
            // job targets
            commands::create_job_target,
            commands::list_job_targets,
            commands::get_job_target,
            commands::update_job_target,
            commands::delete_job_target,
            // interview Q&A
            commands::create_interview_qa,
            commands::list_interview_qas_by_job_target,
            commands::get_interview_qa,
            commands::update_interview_qa,
            commands::delete_interview_qa,
            commands::reorder_interview_qas,
            // interview reports
            commands::create_interview_report,
            commands::list_interview_reports_by_job_target,
            commands::get_interview_report,
            commands::update_interview_report,
            commands::delete_interview_report,
            // job requirement mappings
            commands::save_job_requirement_mapping,
            commands::list_job_requirement_mappings_by_job_target,
            commands::get_job_requirement_mapping,
            commands::update_job_requirement_mapping,
            commands::delete_job_requirement_mapping,
            // agent track records
            commands::create_agent_track_record,
            commands::list_agent_track_records,
            commands::get_agent_track_record,
            commands::update_agent_track_record,
            commands::delete_agent_track_record,
            // agent meeting emails
            commands::create_agent_meeting_email,
            commands::list_agent_meeting_emails,
            commands::list_agent_meeting_emails_by_agent,
            commands::get_agent_meeting_email,
            commands::update_agent_meeting_email,
            commands::delete_agent_meeting_email,
            // job wish sheets
            commands::create_job_wish_sheet,
            commands::list_job_wish_sheets,
            commands::get_job_wish_sheet,
            commands::update_job_wish_sheet,
            commands::delete_job_wish_sheet,
            // resignation motives
            commands::create_resignation_motive,
            commands::list_resignation_motives,
            commands::get_resignation_motive,
            commands::update_resignation_motive,
            commands::delete_resignation_motive,
            // resignation plans
            commands::create_resignation_plan,
            commands::list_resignation_plans_by_job_target,
            commands::get_resignation_plan,
            commands::update_resignation_plan,
            commands::delete_resignation_plan,
            // application motives
            commands::create_application_motive,
            commands::list_application_motives,
            commands::list_application_motives_by_job_target,
            commands::get_application_motive,
            commands::update_application_motive,
            commands::delete_application_motive,
            // boss references
            commands::create_boss_reference,
            commands::list_boss_references,
            commands::get_boss_reference,
            commands::update_boss_reference,
            commands::delete_boss_reference,
            // customer references
            commands::create_customer_reference,
            commands::list_customer_references,
            commands::get_customer_reference,
            commands::update_customer_reference,
            commands::delete_customer_reference,
            // work asset summaries
            commands::create_work_asset_summary,
            commands::list_work_asset_summaries,
            commands::get_work_asset_summary,
            commands::update_work_asset_summary,
            commands::delete_work_asset_summary,
            // subordinate summaries
            commands::create_subordinate_summary,
            commands::list_subordinate_summaries,
            commands::get_subordinate_summary,
            commands::update_subordinate_summary,
            commands::delete_subordinate_summary,
            // microchop skill
            commands::create_microchop_skill,
            commands::list_microchop_skill,
            commands::get_microchop_skill,
            commands::update_microchop_skill,
            commands::delete_microchop_skill,
            // result by type
            commands::create_result_by_type,
            commands::list_result_by_type,
            commands::get_result_by_type,
            commands::update_result_by_type,
            commands::delete_result_by_type,
            // strength from weakness
            commands::create_strength_from_weakness,
            commands::list_strength_from_weakness,
            commands::get_strength_from_weakness,
            commands::update_strength_from_weakness,
            commands::delete_strength_from_weakness,
            // weak connection
            commands::create_weak_connection,
            commands::list_weak_connection,
            commands::get_weak_connection,
            commands::update_weak_connection,
            commands::delete_weak_connection,
            // strength arrows
            commands::create_strength_arrow,
            commands::list_strength_arrows,
            commands::list_strength_arrows_by_type,
            commands::get_strength_arrow,
            commands::update_strength_arrow,
            commands::delete_strength_arrow,
            // monster company checks
            commands::create_monster_company_check,
            commands::list_monster_company_checks_by_job_target,
            commands::get_monster_company_check,
            commands::update_monster_company_check,
            commands::delete_monster_company_check,
            // recruitment impressions
            commands::create_recruitment_impression,
            commands::list_recruitment_impressions_by_job_target,
            commands::get_recruitment_impression,
            commands::update_recruitment_impression,
            commands::delete_recruitment_impression,
            // salary benchmarks
            commands::create_salary_benchmark,
            commands::list_salary_benchmarks_by_job_target,
            commands::get_salary_benchmark,
            commands::update_salary_benchmark,
            commands::delete_salary_benchmark,
            // growth cycle notes
            commands::create_growth_cycle_note,
            commands::list_growth_cycle_notes_by_job_target,
            commands::get_growth_cycle_note,
            commands::update_growth_cycle_note,
            commands::delete_growth_cycle_note,
            // company certifications
            commands::create_company_certification,
            commands::list_company_certifications_by_job_target,
            commands::get_company_certification,
            commands::update_company_certification,
            commands::delete_company_certification,
            // hidden gem notes
            commands::create_hidden_gem_note,
            commands::list_hidden_gem_notes_by_job_target,
            commands::get_hidden_gem_note,
            commands::update_hidden_gem_note,
            commands::delete_hidden_gem_note,
            // business unit type matches
            commands::create_business_unit_type_match,
            commands::list_business_unit_type_matches_by_job_target,
            commands::get_business_unit_type_match,
            commands::update_business_unit_type_match,
            commands::delete_business_unit_type_match,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
