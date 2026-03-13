class WorkerSession {
  static Map<String, dynamic>? worker;
  static String? token;

  static void clear() {
    worker = null;
    token = null;
  }
}
