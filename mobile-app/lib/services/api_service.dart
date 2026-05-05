import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';

class ApiService {
  ApiService({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  // static const String baseUrl = 'https://cjjoinery-backend.vercel.app/api';
  static const String baseUrl = 'https://cjjoinery.kyleinfotech.co.in/api';
  static String get baseHost =>
      baseUrl.replaceFirst(RegExp(r'/api/?$'), '');

  Future<Map<String, dynamic>> loginWorker(String username, String password) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/worker/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'username': username, 'password': password}),
    );

    if (response.statusCode >= 400) {
      throw Exception(_extractError(response.body));
    }
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  Future<List<dynamic>> getWorkerJobs(String workerId) async {
    final response = await _client.get(Uri.parse('$baseUrl/worker/$workerId/jobs'));
    if (response.statusCode >= 400) {
      throw Exception(_extractError(response.body));
    }
    return jsonDecode(response.body) as List<dynamic>;
  }

  Future<Map<String, dynamic>> updateWorkerStatus(
    String workerId,
    String date,
    String status,
    String note,
  ) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/worker/$workerId/status'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'date': date, 'status': status, 'note': note}),
    );
    if (response.statusCode >= 400) {
      throw Exception(_extractError(response.body));
    }
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> checkInWorker(String workerId, String jobId) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/worker/$workerId/check-in'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'jobId': jobId}),
    );
    if (response.statusCode >= 400) {
      throw Exception(_extractError(response.body));
    }
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> checkOutWorker(String workerId, String jobId) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/worker/$workerId/check-out'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'jobId': jobId}),
    );
    if (response.statusCode >= 400) {
      throw Exception(_extractError(response.body));
    }
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  Future<void> scheduleJob(String workerId, String jobId, List<String> dates) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/worker/$workerId/jobs/$jobId/schedule'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'dates': dates}),
    );
    if (response.statusCode >= 400) {
      throw Exception(_extractError(response.body));
    }
  }

  Future<Map<String, dynamic>> addDailyLog({
    required String workerId,
    required String jobId,
    required String date,
    required String description,
    String? imageUrl,
    required Map<String, dynamic> location,
    XFile? imageFile,
  }) async {
    final uri = Uri.parse('$baseUrl/worker/$workerId/jobs/$jobId/daily-log');

    if (imageFile != null) {
      final request = http.MultipartRequest('POST', uri);
      request.fields['date'] = date;
      request.fields['description'] = description;
      request.fields['location'] = jsonEncode(location);
      request.files.add(
        await http.MultipartFile.fromPath(
          'image',
          imageFile.path,
          filename: imageFile.name,
        ),
      );
      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);
      if (response.statusCode >= 400) {
        throw Exception(_extractError(response.body));
      }
      return jsonDecode(response.body) as Map<String, dynamic>;
    }

    final response = await _client.post(
      uri,
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
    return jsonDecode(response.body) as Map<String, dynamic>;
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
