import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'core/theme.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'services/session.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
    ),
  );

  // Restore saved session — fall back to login if anything goes wrong
  bool hasSession = false;
  try {
    hasSession = await WorkerSession.load();
  } catch (_) {
    hasSession = false;
  }

  runApp(MyApp(initialRoute: hasSession ? '/dashboard' : '/login'));
}

class MyApp extends StatelessWidget {
  const MyApp({super.key, required this.initialRoute});

  final String initialRoute;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CJ Joinery',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      initialRoute: initialRoute,
      routes: {
        '/login': (context) => const LoginScreen(),
        '/dashboard': (context) => const DashboardScreen(),
      },
    );
  }
}
