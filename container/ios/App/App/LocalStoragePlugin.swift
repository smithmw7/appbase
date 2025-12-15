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
}
