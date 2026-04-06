import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class WorkerSession {
  static Map<String, dynamic>? worker;
  static String? token;

  static const _workerKey = 'worker_data';
  static const _tokenKey = 'worker_token';

  /// Save session to disk after login.
  static Future<void> save() async {
    final prefs = await SharedPreferences.getInstance();
    if (worker != null) {
      await prefs.setString(_workerKey, jsonEncode(worker));
    }
    if (token != null) {
      await prefs.setString(_tokenKey, token!);
    }
  }

  /// Load persisted session. Returns true if a session was restored.
  static Future<bool> load() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final workerJson = prefs.getString(_workerKey);
      final savedToken = prefs.getString(_tokenKey);
      if (workerJson != null && savedToken != null) {
        worker = Map<String, dynamic>.from(
            jsonDecode(workerJson) as Map<String, dynamic>);
        token = savedToken;
        return true;
      }
    } catch (_) {
      // Corrupted or unavailable storage — treat as logged out
      worker = null;
      token = null;
    }
    return false;
  }

  /// Clear session from memory and disk (called on logout).
  static Future<void> clear() async {
    worker = null;
    token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_workerKey);
    await prefs.remove(_tokenKey);
  }
}
