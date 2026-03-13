import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  ApiService({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  static const String _baseUrl = 'https://cjjoinery-backend.vercel.app/api';

  Future<Map<String, dynamic>> loginWorker(String username, String password) async {
    final response = await _client.post(
      Uri.parse('$_baseUrl/worker/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'username': username, 'password': password}),
    );

    if (response.statusCode >= 400) {
      throw Exception(_extractError(response.body));
    }
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  Future<List<dynamic>> getWorkerJobs(String workerId) async {
    final response = await _client.get(Uri.parse('$_baseUrl/worker/$workerId/jobs'));
    if (response.statusCode >= 400) {
      throw Exception(_extractError(response.body));
    }
    return jsonDecode(response.body) as List<dynamic>;
  }

  Future<void> updateWorkerStatus(String workerId, String date, String status, String note) async {
    final response = await _client.post(
      Uri.parse('$_baseUrl/worker/$workerId/status'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'date': date, 'status': status, 'note': note}),
    );
    if (response.statusCode >= 400) {
      throw Exception(_extractError(response.body));
    }
  }

  Future<void> scheduleJob(String workerId, String jobId, List<String> dates) async {
    final response = await _client.post(
      Uri.parse('$_baseUrl/worker/$workerId/jobs/$jobId/schedule'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'dates': dates}),
    );
    if (response.statusCode >= 400) {
      throw Exception(_extractError(response.body));
    }
  }

  Future<void> addDailyLog({
    required String workerId,
    required String jobId,
    required String date,
    required String description,
    required String imageUrl,
    required Map<String, dynamic> location,
  }) async {
    final response = await _client.post(
      Uri.parse('$_baseUrl/worker/$workerId/jobs/$jobId/daily-log'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'date': date,
        'description': description,
        'imageUrl': imageUrl,
        'location': location,
      }),
    );
    if (response.statusCode >= 400) {
      throw Exception(_extractError(response.body));
    }
  }

  String _extractError(String body) {
    try {
      final decoded = jsonDecode(body) as Map<String, dynamic>;
      return decoded['message']?.toString() ?? 'Request failed';
    } catch (_) {
      return 'Request failed';
    }
  }
}
