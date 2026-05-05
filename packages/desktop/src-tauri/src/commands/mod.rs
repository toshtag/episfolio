fn parse_json_column<T: serde::de::DeserializeOwned>(
    column_index: usize,
    raw: &str,
) -> rusqlite::Result<T> {
    serde_json::from_str(raw).map_err(|e| {
        rusqlite::Error::FromSqlConversionFailure(
            column_index,
            rusqlite::types::Type::Text,
            Box::new(e),
        )
    })
}

pub mod agent_meeting_emails;
pub mod agent_track_records;
pub mod application_motives;
pub mod backup;
pub mod boss_references;
pub mod business_unit_type_matches;
pub mod company_certifications;
pub mod customer_references;
pub mod documents;
pub mod growth_cycle_notes;
pub mod hidden_gem_notes;
pub mod interview_qas;
pub mod interview_reports;
pub mod job_requirement_mappings;
pub mod job_targets;
pub mod job_wish_sheets;
pub mod life_timeline;
pub mod microchop_skill;
pub mod monster_company_checks;
pub mod recruitment_impressions;
pub mod resignation_motives;
pub mod resignation_plans;
pub mod result_by_type;
pub mod salary_benchmarks;
pub mod strength_arrows;
pub mod strength_from_weakness;
pub mod subordinate_summaries;
pub mod weak_connection;
pub mod work_asset_summaries;

pub use agent_meeting_emails::*;
pub use agent_track_records::*;
pub use application_motives::*;
pub use backup::*;
pub use boss_references::*;
pub use business_unit_type_matches::*;
pub use company_certifications::*;
pub use customer_references::*;
pub use documents::*;
pub use growth_cycle_notes::*;
pub use hidden_gem_notes::*;
pub use interview_qas::*;
pub use interview_reports::*;
pub use job_requirement_mappings::*;
pub use job_targets::*;
pub use job_wish_sheets::*;
pub use life_timeline::*;
pub use microchop_skill::*;
pub use monster_company_checks::*;
pub use recruitment_impressions::*;
pub use resignation_motives::*;
pub use resignation_plans::*;
pub use result_by_type::*;
pub use salary_benchmarks::*;
pub use strength_arrows::*;
pub use strength_from_weakness::*;
pub use subordinate_summaries::*;
pub use weak_connection::*;
pub use work_asset_summaries::*;
