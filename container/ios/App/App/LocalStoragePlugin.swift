import Foundation
import Capacitor

/**
 * LocalStoragePlugin
 *
 * Minimal stub implementation using UserDefaults to keep the app building.
 * Replace with full SQLite-backed implementation as needed.
 */
@objc(LocalStoragePlugin)
public class LocalStoragePlugin: CAPPlugin {

    private let defaults = UserDefaults.standard

    // MARK: - Initialization
    @objc func initialize(_ call: CAPPluginCall) {
        // Stub: Replace with SQLite setup/migrations
        call.resolve()
    }

    // MARK: - Puzzles
    @objc func getPuzzle(_ call: CAPPluginCall) {
        guard let id = call.getString("id") else {
            call.reject("id is required")
            return
        }
        let key = "puzzle_\(id)"
        let data = defaults.object(forKey: key)
        call.resolve(["puzzle": data ?? NSNull()])
    }

    @objc func savePuzzle(_ call: CAPPluginCall) {
        guard let puzzle = call.getObject("puzzle"),
              let id = puzzle["id"] as? String else {
            call.reject("invalid puzzle payload")
            return
        }
        let key = "puzzle_\(id)"
        defaults.set(puzzle, forKey: key)
        call.resolve()
    }

    // MARK: - Player Stats
    @objc func getPlayerStats(_ call: CAPPluginCall) {
        let stats: [String: Any] = [
            "streak": defaults.integer(forKey: "stats_streak"),
            "maxStreak": defaults.integer(forKey: "stats_maxStreak"),
            "histogram": defaults.object(forKey: "stats_histogram") as? [String: Int] ?? [:]
        ]
        call.resolve(stats)
    }

    @objc func updatePlayerStats(_ call: CAPPluginCall) {
        guard let stats = call.getObject("stats") else {
            call.reject("stats is required")
            return
        }

        // Check if this is the new format (with player data blob) or old format
        let hasNewFormat = stats["totalPuzzlesCompleted"] != nil || 
                          stats["totalPuzzlesAttempted"] != nil ||
                          stats["currentStreak"] != nil ||
                          stats["totalPlayTime"] != nil

        if hasNewFormat {
            // New format: Update player data blob
            var playerData: [String: Any] = [:]
            if let data = defaults.data(forKey: "player_data"),
               let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                playerData = json
            }

            // Initialize stats if needed
            if playerData["stats"] == nil {
                playerData["stats"] = [String: Any]()
            }
            var statsDict = playerData["stats"] as? [String: Any] ?? [:]

            // Update stats
            if let value = stats["totalPuzzlesCompleted"] as? Int {
                statsDict["totalPuzzlesCompleted"] = value
            }
            if let value = stats["totalPuzzlesAttempted"] as? Int {
                statsDict["totalPuzzlesAttempted"] = value
            }
            if let value = stats["currentStreak"] as? Int {
                statsDict["currentStreak"] = value
            }
            if let value = stats["maxStreak"] as? Int {
                statsDict["maxStreak"] = value
            }
            if let value = stats["totalPlayTime"] as? Int {
                statsDict["totalPlayTime"] = value
            }
            if let value = stats["lastPlayedAt"] as? String {
                statsDict["lastPlayedAt"] = value
            }
            if let value = stats["firstPlayedAt"] as? String {
                statsDict["firstPlayedAt"] = value
            }

            playerData["stats"] = statsDict

            // Save back
            if let jsonData = try? JSONSerialization.data(withJSONObject: playerData) {
                defaults.set(jsonData, forKey: "player_data")
                call.resolve()
            } else {
                call.reject("failed to save player data")
            }
        } else {
            // Old format: Update legacy UserDefaults keys (for backward compatibility)
            if let streak = stats["streak"] as? Int {
                defaults.set(streak, forKey: "stats_streak")
            }
            if let maxStreak = stats["maxStreak"] as? Int {
                defaults.set(maxStreak, forKey: "stats_maxStreak")
            }
            if let histogram = stats["histogram"] as? [String: Int] {
                defaults.set(histogram, forKey: "stats_histogram")
            }
            call.resolve()
        }
    }

    // MARK: - Settings
    @objc func getSettings(_ call: CAPPluginCall) {
        let settings: [String: Any] = [
            "sound": defaults.object(forKey: "settings_sound") as? Bool ?? true,
            "haptics": defaults.object(forKey: "settings_haptics") as? Bool ?? true,
            "colorblind": defaults.object(forKey: "settings_colorblind") as? Bool ?? false,
            "tutorialCompleted": defaults.object(forKey: "settings_tutorialCompleted") as? Bool ?? false
        ]
        call.resolve(settings)
    }

    @objc func updateSettings(_ call: CAPPluginCall) {
        guard let settings = call.getObject("settings") else {
            call.reject("settings is required")
            return
        }
        if let sound = settings["sound"] as? Bool {
            defaults.set(sound, forKey: "settings_sound")
        }
        if let haptics = settings["haptics"] as? Bool {
            defaults.set(haptics, forKey: "settings_haptics")
        }
        if let colorblind = settings["colorblind"] as? Bool {
            defaults.set(colorblind, forKey: "settings_colorblind")
        }
        if let tutorial = settings["tutorialCompleted"] as? Bool {
            defaults.set(tutorial, forKey: "settings_tutorialCompleted")
        }
        call.resolve()
    }

    // MARK: - Player Data

    @objc func getPlayerData(_ call: CAPPluginCall) {
        guard let data = defaults.data(forKey: "player_data"),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            call.resolve(["data": NSNull()])
            return
        }
        call.resolve(["data": json])
    }

    @objc func savePlayerData(_ call: CAPPluginCall) {
        guard let data = call.getObject("data") else {
            call.reject("data is required")
            return
        }
        guard let jsonData = try? JSONSerialization.data(withJSONObject: data) else {
            call.reject("failed to serialize player data")
            return
        }
        defaults.set(jsonData, forKey: "player_data")
        call.resolve()
    }


    @objc func updatePuzzleProgress(_ call: CAPPluginCall) {
        guard let puzzleId = call.getString("puzzleId"),
              let progress = call.getObject("progress") else {
            call.reject("puzzleId and progress are required")
            return
        }

        // Load existing player data
        var playerData: [String: Any] = [:]
        if let data = defaults.data(forKey: "player_data"),
           let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
            playerData = json
        }

        // Initialize puzzleProgress if needed
        if playerData["puzzleProgress"] == nil {
            playerData["puzzleProgress"] = [String: Any]()
        }
        var progressDict = playerData["puzzleProgress"] as? [String: Any] ?? [:]

        // Get existing puzzle progress or create new
        var puzzleProgress = progressDict[puzzleId] as? [String: Any] ?? [:]

        // Update progress fields
        if let value = progress["completed"] as? Bool {
            puzzleProgress["completed"] = value
        }
        if let value = progress["bestTime"] as? Int {
            puzzleProgress["bestTime"] = value
        }
        if let value = progress["attempts"] as? Int {
            puzzleProgress["attempts"] = value
        }
        if let value = progress["firstCompletedAt"] as? String {
            puzzleProgress["firstCompletedAt"] = value
        }
        if let value = progress["lastAttemptedAt"] as? String {
            puzzleProgress["lastAttemptedAt"] = value
        }
        if let value = progress["perfectCompletions"] as? Int {
            puzzleProgress["perfectCompletions"] = value
        }

        progressDict[puzzleId] = puzzleProgress
        playerData["puzzleProgress"] = progressDict

        // Save back
        if let jsonData = try? JSONSerialization.data(withJSONObject: playerData) {
            defaults.set(jsonData, forKey: "player_data")
            call.resolve()
        } else {
            call.reject("failed to save puzzle progress")
        }
    }

    @objc func recordActivity(_ call: CAPPluginCall) {
        guard let session = call.getObject("session") else {
            call.reject("session is required")
            return
        }

        // Load existing player data
        var playerData: [String: Any] = [:]
        if let data = defaults.data(forKey: "player_data"),
           let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
            playerData = json
        }

        // Initialize activity if needed
        if playerData["activity"] == nil {
            playerData["activity"] = [
                "sessions": [],
                "dailyActivity": [String: Int]()
            ]
        }
        var activity = playerData["activity"] as? [String: Any] ?? [:]
        var sessions = activity["sessions"] as? [[String: Any]] ?? []
        var dailyActivity = activity["dailyActivity"] as? [String: Int] ?? [:]

        // Add session
        sessions.append(session)

        // Update daily activity
        if let startTime = session["startTime"] as? String,
           let date = ISO8601DateFormatter().date(from: startTime) {
            let formatter = DateFormatter()
            formatter.dateFormat = "yyyy-MM-dd"
            let dateKey = formatter.string(from: date)
            let current = dailyActivity[dateKey] ?? 0
            if let completed = session["puzzlesCompleted"] as? Int {
                dailyActivity[dateKey] = current + completed
            }
        }

        activity["sessions"] = sessions
        activity["dailyActivity"] = dailyActivity
        playerData["activity"] = activity

        // Save back
        if let jsonData = try? JSONSerialization.data(withJSONObject: playerData) {
            defaults.set(jsonData, forKey: "player_data")
            call.resolve()
        } else {
            call.reject("failed to save activity")
        }
    }

    // MARK: - Puzzle Cache

    @objc func getPuzzleCache(_ call: CAPPluginCall) {
        guard let data = defaults.data(forKey: "puzzle_cache"),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            call.resolve(["data": NSNull()])
            return
        }
        call.resolve(["data": json])
    }

    @objc func savePuzzleCache(_ call: CAPPluginCall) {
        guard let data = call.getObject("data") else {
            call.reject("data is required")
            return
        }
        guard let jsonData = try? JSONSerialization.data(withJSONObject: data) else {
            call.reject("failed to serialize puzzle cache")
            return
        }
        defaults.set(jsonData, forKey: "puzzle_cache")
        call.resolve()
    }

    @objc func clearPuzzleCache(_ call: CAPPluginCall) {
        defaults.removeObject(forKey: "puzzle_cache")
        call.resolve()
    }
}
