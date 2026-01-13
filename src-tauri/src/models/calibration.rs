use serde::{Deserialize, Serialize};

/// Daily calibration data for bandwidth calculation.
/// Maps to TypeScript CalibrationData interface.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CalibrationData {
    /// Date in YYYY-MM-DD format (workday-adjusted at 5am boundary)
    pub date: String,
    /// Calculated bandwidth score (0-100)
    pub calibration_score: f64,
    /// Hours of sleep (0-12)
    pub sleep_hours: f64,
    /// Sleep quality rating (1-10)
    pub sleep_quality: i32,
    /// Emotional residue level (1-10, lower is better)
    pub emotional_residue: i32,
    /// Current emotional state
    pub emotional_state: String,
    /// Array of identified distractions
    pub distractions: Vec<String>,
    /// Unix timestamp in milliseconds
    pub timestamp: i64,
}

impl CalibrationData {
    /// Calculate the calibration score based on biological core math.
    ///
    /// Total Score = Sleep Score (0-40) + Emotional Score (0-40) + Distraction Score (0-20)
    pub fn calculate_score(&self) -> f64 {
        let sleep_score = self.calculate_sleep_score();
        let emotional_score = self.calculate_emotional_score();
        let distraction_score = self.calculate_distraction_score();

        (sleep_score + emotional_score + distraction_score) as f64
    }

    /// Calculate sleep score (0-40 points)
    /// - Hours component: 0-25 points
    /// - Quality component: 0-15 points
    fn calculate_sleep_score(&self) -> i32 {
        let hours_score = self.calculate_hours_score();
        let quality_score = self.calculate_quality_score();
        hours_score + quality_score
    }

    /// Calculate hours score (0-25 points)
    /// - 7-9 hours: 25 points (optimal)
    /// - 6 or 10 hours: 20 points
    /// - 5 or 11 hours: 12 points
    /// - <5 or >11 hours: 5 points
    fn calculate_hours_score(&self) -> i32 {
        let hours = self.sleep_hours.round() as i32;
        match hours {
            7..=9 => 25,
            6 | 10 => 20,
            5 | 11 => 12,
            _ => 5,
        }
    }

    /// Calculate quality score (0-15 points)
    /// - 8-10: 15 points (deep, restorative)
    /// - 6-7: 10 points (decent, some interruptions)
    /// - 4-5: 5 points (restless, fragmented)
    /// - 1-3: 2 points (poor, non-restorative)
    fn calculate_quality_score(&self) -> i32 {
        match self.sleep_quality {
            8..=10 => 15,
            6..=7 => 10,
            4..=5 => 5,
            _ => 2,
        }
    }

    /// Calculate emotional score (0-40 points)
    /// - Residue component: 0-20 points
    /// - State component: 0-20 points
    fn calculate_emotional_score(&self) -> i32 {
        let residue_score = self.calculate_residue_score();
        let state_score = self.calculate_state_score();
        residue_score + state_score
    }

    /// Calculate emotional residue score (0-20 points)
    /// Lower residue = higher score
    /// - 1-3: 20 points (clear)
    /// - 4-5: 15 points (mild stress)
    /// - 6-7: 8 points (moderate tension)
    /// - 8-10: 3 points (heavy burden)
    fn calculate_residue_score(&self) -> i32 {
        match self.emotional_residue {
            1..=3 => 20,
            4..=5 => 15,
            6..=7 => 8,
            _ => 3,
        }
    }

    /// Calculate emotional state score (0-20 points)
    fn calculate_state_score(&self) -> i32 {
        match self.emotional_state.as_str() {
            "Energized" => 20,
            "Focused" => 18,
            "Calm" => 15,
            "Tired" => 8,
            "Anxious" => 5,
            "Scattered" => 3,
            _ => 10, // Default fallback
        }
    }

    /// Calculate distraction awareness score (0-20 points)
    /// Fewer identified distractions = higher score
    /// - 0: 20 points (clear awareness)
    /// - 1: 16 points
    /// - 2: 12 points
    /// - 3: 8 points
    /// - 4: 5 points
    /// - 5+: 2 points (overwhelmed)
    fn calculate_distraction_score(&self) -> i32 {
        match self.distractions.len() {
            0 => 20,
            1 => 16,
            2 => 12,
            3 => 8,
            4 => 5,
            _ => 2,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_calibration() -> CalibrationData {
        CalibrationData {
            date: "2026-01-13".to_string(),
            calibration_score: 0.0,
            sleep_hours: 8.0,
            sleep_quality: 8,
            emotional_residue: 2,
            emotional_state: "Focused".to_string(),
            distractions: vec![],
            timestamp: 1736784000000,
        }
    }

    #[test]
    fn test_optimal_calibration_score() {
        let cal = create_test_calibration();
        // 8 hours sleep = 25 points
        // Quality 8 = 15 points
        // Residue 2 = 20 points
        // Focused = 18 points
        // 0 distractions = 20 points
        // Total = 25 + 15 + 20 + 18 + 20 = 98
        assert_eq!(cal.calculate_score(), 98.0);
    }

    #[test]
    fn test_suboptimal_sleep() {
        let mut cal = create_test_calibration();
        cal.sleep_hours = 5.0;
        cal.sleep_quality = 4;
        // 5 hours = 12 points
        // Quality 4 = 5 points
        // Rest same = 20 + 18 + 20 = 58
        // Total = 12 + 5 + 58 = 75
        assert_eq!(cal.calculate_score(), 75.0);
    }

    #[test]
    fn test_high_distraction_penalty() {
        let mut cal = create_test_calibration();
        cal.distractions = vec![
            "Email".to_string(),
            "Slack".to_string(),
            "Phone".to_string(),
            "Social Media".to_string(),
            "Errands".to_string(),
        ];
        // 5 distractions = 2 points
        // Rest same = 25 + 15 + 20 + 18 = 78
        // Total = 78 + 2 = 80
        assert_eq!(cal.calculate_score(), 80.0);
    }

    #[test]
    fn test_worst_case_scenario() {
        let cal = CalibrationData {
            date: "2026-01-13".to_string(),
            calibration_score: 0.0,
            sleep_hours: 3.0,          // <5 hours = 5 points
            sleep_quality: 2,          // 1-3 = 2 points
            emotional_residue: 9,      // 8-10 = 3 points
            emotional_state: "Scattered".to_string(), // 3 points
            distractions: vec!["a".to_string(); 6],   // 5+ = 2 points
            timestamp: 1736784000000,
        };
        // Total = 5 + 2 + 3 + 3 + 2 = 15
        assert_eq!(cal.calculate_score(), 15.0);
    }
}
