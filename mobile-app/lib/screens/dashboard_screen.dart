import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../core/theme.dart';
import '../services/api_service.dart';
import '../services/session.dart';
import 'job_details_screen.dart';

String _dateKey(DateTime date) => DateFormat('yyyy-MM-dd').format(date);

DateTime _dayOnly(DateTime date) => DateTime(date.year, date.month, date.day);

bool _isPastDate(DateTime date) =>
    _dayOnly(date).isBefore(_dayOnly(DateTime.now()));

DateTime? _parseStatusDate(dynamic value) {
  if (value == null) return null;
  try {
    return DateTime.parse(value.toString());
  } catch (_) {
    return null;
  }
}

List<Map<String, dynamic>> _workerStatusHistory(Map<String, dynamic> worker) {
  final raw = worker['statusHistory'] as List<dynamic>? ?? const [];
  final history = raw
      .whereType<Map>()
      .map((entry) => Map<String, dynamic>.from(entry))
      .toList();

  history.sort((a, b) {
    final left = a['date']?.toString() ?? '';
    final right = b['date']?.toString() ?? '';
    return right.compareTo(left);
  });

  return history;
}

String _effectiveWorkerStatus(Map<String, dynamic> worker, DateTime date) {
  final targetKey = _dateKey(date);
  final history = _workerStatusHistory(worker);
  final todayKey = _dateKey(DateTime.now());

  for (final entry in history) {
    final entryKey = entry['date']?.toString();
    if (entryKey == targetKey) {
      return entry['status']?.toString() ?? 'Available';
    }
  }

  if (targetKey == todayKey) {
    return worker['availability']?.toString() ?? 'Available';
  }

  return 'Available';
}

List<Map<String, dynamic>> _upcomingStatusHistory(Map<String, dynamic> worker) {
  final todayKey = _dateKey(DateTime.now());
  return _workerStatusHistory(worker)
      .where((entry) {
        final entryKey = entry['date']?.toString();
        return entryKey != null && entryKey.compareTo(todayKey) >= 0;
      })
      .toList();
}

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final _api = ApiService();
  int _currentIndex = 0;
  bool _loading = true;
  String _error = '';
  List<dynamic> _jobs = [];

  @override
  void initState() {
    super.initState();
    _fetchJobs();
  }

  Future<void> _fetchJobs() async {
    final worker = WorkerSession.worker;
    if (worker == null) {
      if (mounted) Navigator.pushReplacementNamed(context, '/login');
      return;
    }
    setState(() {
      _loading = true;
      _error = '';
    });
    try {
      final data = await _api.getWorkerJobs(worker['_id']);
      setState(() {
        _jobs = data;
      });
    } catch (error) {
      setState(() => _error = 'Failed to load jobs');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final worker = WorkerSession.worker ?? {};
    final pages = [
      _HomeTab(
          worker: worker,
          jobs: _jobs,
          loading: _loading,
          error: _error,
          onRefresh: _fetchJobs,
          onSeeAll: () => setState(() => _currentIndex = 1)),
      _JobsTab(
          jobs: _jobs,
          loading: _loading,
          error: _error,
          onRefresh: _fetchJobs),
      _StatusTab(workerId: worker['_id'] ?? '', onUpdated: _fetchJobs),
      _ProfileTab(worker: worker),
    ];

    return Scaffold(
      body: SafeArea(
        top: true,
        bottom: false,
        child: IndexedStack(
          index: _currentIndex,
          children: pages,
        ),
      ),
      extendBody: true,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: AppColors.charcoal,
          border: Border(
            top: BorderSide(color: AppColors.divider.withOpacity(0.3), width: 0.5),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.3),
              blurRadius: 20,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildNavItem(Icons.home_rounded, 'Home', 0),
                _buildNavItem(Icons.work_rounded, 'Jobs', 1),
                _buildNavItem(Icons.event_note_rounded, 'Status', 2),
                _buildNavItem(Icons.person_rounded, 'Profile', 3),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(IconData icon, String label, int index) {
    final isSelected = _currentIndex == index;
    return GestureDetector(
      onTap: () => setState(() => _currentIndex = index),
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeInOut,
        padding: EdgeInsets.symmetric(
          horizontal: isSelected ? 18 : 14,
          vertical: 8,
        ),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.amber.withOpacity(0.12) : Colors.transparent,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: isSelected ? 26 : 22,
              color: isSelected ? AppColors.amber : AppColors.textMuted,
            ),
            const SizedBox(height: 4),
            AnimatedDefaultTextStyle(
              duration: const Duration(milliseconds: 250),
              style: TextStyle(
                fontSize: isSelected ? 11 : 10,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                color: isSelected ? AppColors.amber : AppColors.textMuted,
              ),
              child: Text(label),
            ),
          ],
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────────
// HOME TAB
// ──────────────────────────────────────────────────
class _HomeTab extends StatefulWidget {
  const _HomeTab({
    required this.worker,
    required this.jobs,
    required this.loading,
    required this.error,
    required this.onRefresh,
    required this.onSeeAll,
  });

  final Map<String, dynamic> worker;
  final List<dynamic> jobs;
  final bool loading;
  final String error;
  final Future<void> Function() onRefresh;
  final VoidCallback onSeeAll;

  @override
  State<_HomeTab> createState() => _HomeTabState();
}

class _HomeTabState extends State<_HomeTab> {
  final _api = ApiService();
  // jobId -> checked-in state
  final Map<String, bool> _checkedIn = {};
  final Map<String, bool> _checkingIn = {};

  String _todayKey() => DateFormat('yyyy-MM-dd').format(DateTime.now());

  /// Jobs where this worker has a workCalendar entry for today
  List<dynamic> get _todayJobs {
    final workerId = widget.worker['_id']?.toString() ?? '';
    final today = _todayKey();
    return widget.jobs.where((job) {
      final wc = job['workCalendar'] as List<dynamic>? ?? [];
      return wc.any((e) {
        if (e['date']?.toString().startsWith(today) != true) return false;
        final ids = (e['workerIds'] as List<dynamic>? ?? []).map((id) => id.toString());
        return ids.contains(workerId);
      });
    }).toList();
  }

  /// In-progress jobs assigned to this worker (shown when no calendar entry)
  List<dynamic> get _inProgressJobs {
    final workerId = widget.worker['_id']?.toString() ?? '';
    return widget.jobs.where((job) {
      final status = job['status']?.toString() ?? '';
      final workers = (job['assignedWorkers'] as List<dynamic>? ?? []);
      final assigned = workers.any((w) {
        final id = (w is Map) ? w['_id']?.toString() : w.toString();
        return id == workerId;
      });
      return status == 'In Progress' && assigned;
    }).toList();
  }

  Map<String, dynamic>? _todayEntry(Map<String, dynamic> job) {
    final today = _todayKey();
    final wc = job['workCalendar'] as List<dynamic>? ?? [];
    try {
      return wc.firstWhere(
        (e) => e['date']?.toString().startsWith(today) == true,
      ) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  /// Returns the workerSchedule entry for this worker from today's workCalendar entry.
  Map<String, dynamic>? _workerScheduleForToday(Map<String, dynamic> job) {
    final entry = _todayEntry(job);
    if (entry == null) return null;
    final workerId = widget.worker['_id']?.toString() ?? '';
    final schedules = entry['workerSchedules'] as List<dynamic>? ?? [];
    try {
      final match = schedules.firstWhere((s) {
        final sid = (s['workerId'] ?? '').toString();
        return sid == workerId;
      });
      return Map<String, dynamic>.from(match as Map);
    } catch (_) {
      return null;
    }
  }

  double _todayHours(Map<String, dynamic> job) {
    final ws = _workerScheduleForToday(job);
    if (ws != null) {
      final h = ws['hours'];
      if (h is num && h > 0) return h.toDouble();
      // fallback: calculate from start/end
      final start = ws['startTime']?.toString() ?? '';
      final end   = ws['endTime']?.toString()   ?? '';
      final calc  = _calcHours(start, end);
      if (calc > 0) return calc;
    }
    final entry = _todayEntry(job);
    if (entry != null) {
      final h = entry['hours'];
      if (h is num && h > 0) return h.toDouble();
    }
    final wh = widget.worker['workHoursPerDay'];
    if (wh is num) return wh.toDouble();
    return 8.0;
  }

  double _calcHours(String startTime, String endTime) {
    if (startTime.isEmpty || endTime.isEmpty) return 0;
    try {
      final sParts = startTime.split(':').map(int.parse).toList();
      final eParts = endTime.split(':').map(int.parse).toList();
      final startMin = sParts[0] * 60 + sParts[1];
      final endMin   = eParts[0] * 60 + eParts[1];
      if (endMin <= startMin) return 0;
      return (endMin - startMin) / 60.0;
    } catch (_) {
      return 0;
    }
  }

  bool _isCheckedInToday(Map<String, dynamic> job) {
    final jobId = job['_id']?.toString() ?? '';
    // If check-in was done this session, trust the in-memory flag
    if (_checkedIn[jobId] == true) return true;
    // Otherwise check if the server already recorded a checkInTime
    final workerId = widget.worker['_id']?.toString() ?? '';
    final today = _todayKey();
    final wc = job['workCalendar'] as List<dynamic>? ?? [];
    for (final e in wc) {
      if (e['date']?.toString().startsWith(today) != true) continue;
      final schedules = e['workerSchedules'] as List<dynamic>? ?? [];
      for (final s in schedules) {
        if (s['workerId']?.toString() == workerId &&
            s['checkInTime'] != null) {
          return true;
        }
      }
    }
    return false;
  }

  Future<void> _checkIn(Map<String, dynamic> job) async {
    final jobId = job['_id']?.toString() ?? '';
    final workerId = widget.worker['_id']?.toString();
    if (workerId == null || jobId.isEmpty) return;
    setState(() => _checkingIn[jobId] = true);
    try {
      await _api.checkInWorker(workerId, jobId);
      setState(() => _checkedIn[jobId] = true);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Checked in for "${job['title']}"'),
          backgroundColor: AppColors.success,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Check-in failed: ${e.toString().replaceFirst('Exception: ', '')}')),
      );
    } finally {
      if (mounted) setState(() => _checkingIn[jobId] = false);
    }
  }

  Color _statusColor(String status) {
    switch (status.toLowerCase()) {
      case 'available':
        return AppColors.success;
      case 'busy':
        return AppColors.warning;
      case 'on leave':
        return AppColors.error;
      default:
        return AppColors.textMuted;
    }
  }

  @override
  Widget build(BuildContext context) {
    final worker = widget.worker;
    final jobs = widget.jobs;
    final loading = widget.loading;
    final error = widget.error;

    final todayStatus = _effectiveWorkerStatus(worker, DateTime.now());
    final upcomingDays = List<DateTime>.generate(
      7,
      (index) => _dayOnly(DateTime.now()).add(Duration(days: index)),
    );

    // Decide which jobs to show in "Today's Work"
    final todayJobs = _todayJobs;
    final showJobs = todayJobs.isNotEmpty ? todayJobs : _inProgressJobs;

    return RefreshIndicator(
      color: AppColors.amber,
      backgroundColor: AppColors.surface,
      onRefresh: widget.onRefresh,
      child: ListView(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).padding.bottom + 100,
        ),
        children: [
          // Hero header
          Container(
            padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
            decoration: const BoxDecoration(gradient: AppGradients.hero),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 50,
                      height: 50,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: AppGradients.accent,
                        boxShadow: [
                          BoxShadow(color: AppColors.amber.withOpacity(0.3), blurRadius: 12),
                        ],
                      ),
                      child: Center(
                        child: Text(
                          (worker['name']?.toString() ?? 'W')[0].toUpperCase(),
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w700,
                            color: AppColors.darkNavy,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Welcome Back 👋',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.textMuted),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            worker['name']?.toString() ?? 'Worker',
                            style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontSize: 20),
                          ),
                          const SizedBox(height: 4),
                          // Today's work hours summary
                          if (showJobs.isNotEmpty)
                            Text(
                              showJobs.map((j) {
                                final h = _todayHours(j as Map<String, dynamic>);
                                return '${j['title']} · ${h.toStringAsFixed(h.truncateToDouble() == h ? 0 : 1)}h';
                              }).join('  •  '),
                              style: TextStyle(
                                fontSize: 11,
                                color: AppColors.amber.withOpacity(0.85),
                                fontWeight: FontWeight.w600,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: AppDecorations.glass(opacity: 0.08, borderRadius: 12),
                      child: const Icon(Icons.notifications_none_rounded,
                          color: AppColors.textSecondary, size: 22),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),

          // ── Today's Work ──
          if (showJobs.isNotEmpty) ...[
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 12),
              child: Row(
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppColors.success,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text("Today's Work", style: Theme.of(context).textTheme.titleLarge),
                ],
              ),
            ),
            ...showJobs.map((rawJob) {
              final job = rawJob as Map<String, dynamic>;
              final jobId = job['_id']?.toString() ?? '';
              final hours = _todayHours(job);
              final ws = _workerScheduleForToday(job);
              final startTime = ws?['startTime']?.toString() ?? '';
              final endTime   = ws?['endTime']?.toString()   ?? '';
              final hasTime   = startTime.isNotEmpty && endTime.isNotEmpty;
              final checkedIn  = _isCheckedInToday(job);
              final checkingIn = _checkingIn[jobId] ?? false;

              String hoursLabel;
              if (hasTime) {
                hoursLabel = '$startTime – $endTime  (${hours.toStringAsFixed(hours.truncateToDouble() == hours ? 0 : 1)}h)';
              } else {
                hoursLabel = '${hours.toStringAsFixed(hours.truncateToDouble() == hours ? 0 : 1)} hrs scheduled today';
              }

              return Container(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(
                    color: checkedIn
                        ? AppColors.success.withOpacity(0.4)
                        : AppColors.divider.withOpacity(0.3),
                  ),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 8, offset: const Offset(0, 2)),
                  ],
                ),
                child: Row(
                  children: [
                    // Hours badge
                    Container(
                      width: 52,
                      height: 52,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(14),
                        gradient: const LinearGradient(
                          colors: [Color(0xFFF59E0B), Color(0xFFF97316)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            hours.toStringAsFixed(hours.truncateToDouble() == hours ? 0 : 1),
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w800,
                              fontSize: 16,
                              height: 1.1,
                            ),
                          ),
                          const Text(
                            'hrs',
                            style: TextStyle(color: Colors.white70, fontSize: 10, fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            job['title']?.toString() ?? 'Job',
                            style: const TextStyle(
                              color: AppColors.textPrimary,
                              fontWeight: FontWeight.w700,
                              fontSize: 14,
                            ),
                          ),
                          const SizedBox(height: 3),
                          Row(
                            children: [
                              Icon(
                                hasTime ? Icons.schedule_rounded : Icons.access_time_rounded,
                                size: 12,
                                color: AppColors.textMuted,
                              ),
                              const SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  hoursLabel,
                                  style: const TextStyle(
                                    color: AppColors.textMuted,
                                    fontSize: 12,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 10),
                    if (checkedIn)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: AppColors.success.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.success.withOpacity(0.3)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: const [
                            Icon(Icons.check_circle_rounded, color: AppColors.success, size: 16),
                            SizedBox(width: 4),
                            Text(
                              'Checked In',
                              style: TextStyle(
                                color: AppColors.success,
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      )
                    else
                      GestureDetector(
                        onTap: checkingIn ? null : () => _checkIn(job),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFFF59E0B), Color(0xFFF97316)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.amber.withOpacity(0.3),
                                blurRadius: 8,
                                offset: const Offset(0, 3),
                              ),
                            ],
                          ),
                          child: checkingIn
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(
                                    color: Colors.white,
                                    strokeWidth: 2,
                                  ),
                                )
                              : const Text(
                                  'I Am In',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                        ),
                      ),
                  ],
                ),
              );
            }),
          ],

          // ── Stats + Calendar ──
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 20, 24, 0),
            child: Row(
              children: [
                Expanded(
                  child: _StatCard(
                    icon: Icons.work_outline_rounded,
                    label: 'Assigned',
                    value: jobs.length.toString(),
                    color: AppColors.info,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: _StatCard(
                    icon: Icons.circle,
                    label: 'Status',
                    value: todayStatus,
                    color: _statusColor(todayStatus),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 22),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: _HomeStatusCalendar(days: upcomingDays, worker: worker),
          ),

          // Upcoming Jobs section
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 24, 24, 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Upcoming Jobs', style: Theme.of(context).textTheme.titleLarge),
                if (jobs.length > 3)
                  TextButton(
                    onPressed: widget.onSeeAll,
                    child: const Text('See All', style: TextStyle(color: AppColors.amber, fontSize: 13)),
                  ),
              ],
            ),
          ),

          if (loading)
            const Padding(
              padding: EdgeInsets.all(32),
              child: Center(child: CircularProgressIndicator(color: AppColors.amber)),
            ),
          if (!loading && error.isNotEmpty) _ErrorBanner(message: error),
          if (!loading && error.isEmpty && jobs.isEmpty)
            _EmptyState(
              icon: Icons.work_off_rounded,
              title: 'No Jobs Yet',
              subtitle: 'Your assigned jobs will appear here.',
            ),
          if (!loading && jobs.isNotEmpty)
            ...jobs.take(3).map((job) => _JobCard(job: job)),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: AppDecorations.glass(opacity: 0.08, borderRadius: 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 18),
          ),
          const SizedBox(height: 14),
          Text(
            value,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: Theme.of(context)
                .textTheme
                .bodySmall
                ?.copyWith(color: AppColors.textMuted),
          ),
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────────
// JOBS TAB
// ──────────────────────────────────────────────────
class _HomeStatusCalendar extends StatelessWidget {
  const _HomeStatusCalendar({
    required this.days,
    required this.worker,
  });

  final List<DateTime> days;
  final Map<String, dynamic> worker;

  Color _statusColor(String status) {
    switch (status.toLowerCase()) {
      case 'available':
        return AppColors.success;
      case 'busy':
        return AppColors.warning;
      case 'on leave':
        return AppColors.error;
      default:
        return AppColors.textMuted;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: AppDecorations.glass(opacity: 0.08, borderRadius: 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                'Status Calendar',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
              ),
              const Spacer(),
              Text(
                'Next 7 days',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textMuted,
                    ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: days.map((day) {
              final status = _effectiveWorkerStatus(worker, day);
              final isToday = _dateKey(day) == _dateKey(DateTime.now());

              return Expanded(
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 2),
                  padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
                  decoration: BoxDecoration(
                    color: _statusColor(status).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isToday
                          ? AppColors.amber
                          : _statusColor(status).withValues(alpha: 0.2),
                    ),
                  ),
                  child: Column(
                    children: [
                      Text(
                        DateFormat('EEEEE').format(day),
                        style: const TextStyle(
                          color: AppColors.textMuted,
                          fontWeight: FontWeight.w700,
                          fontSize: 11,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${day.day}',
                        style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.w700,
                          fontSize: 15,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: _statusColor(status),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}

class _JobsTab extends StatelessWidget {
  const _JobsTab({
    required this.jobs,
    required this.loading,
    required this.error,
    required this.onRefresh,
  });

  final List<dynamic> jobs;
  final bool loading;
  final String error;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      color: AppColors.amber,
      backgroundColor: AppColors.surface,
      onRefresh: onRefresh,
      child: ListView(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).padding.bottom + 100,
        ),
        children: [
          // Header
          Container(
            padding: const EdgeInsets.fromLTRB(24, 20, 24, 24),
            decoration: const BoxDecoration(
              gradient: AppGradients.hero,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'My Jobs',
                  style: Theme.of(context).textTheme.headlineLarge,
                ),
                const SizedBox(height: 4),
                Text(
                  '${jobs.length} assigned',
                  style: Theme.of(context)
                      .textTheme
                      .bodyMedium
                      ?.copyWith(color: AppColors.textMuted),
                ),
              ],
            ),
          ),

          if (loading)
            const Padding(
              padding: EdgeInsets.all(32),
              child: Center(
                child: CircularProgressIndicator(color: AppColors.amber),
              ),
            ),
          if (!loading && error.isNotEmpty)
            _ErrorBanner(message: error),
          if (!loading && error.isEmpty && jobs.isEmpty)
            _EmptyState(
              icon: Icons.work_off_rounded,
              title: 'No Jobs Assigned',
              subtitle: 'Check back later for new assignments.',
            ),
          if (!loading && jobs.isNotEmpty) ...[
            const SizedBox(height: 8),
            ...jobs.map((job) => _JobCard(job: job)),
          ],
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────────
// STATUS TAB
// ──────────────────────────────────────────────────
class _StatusTab extends StatefulWidget {
  const _StatusTab({required this.workerId, required this.onUpdated});

  final String workerId;
  final Future<void> Function() onUpdated;

  @override
  State<_StatusTab> createState() => _StatusTabState();
}

class _StatusTabState extends State<_StatusTab> {
  final _api = ApiService();
  DateTime _selectedDate = _dayOnly(DateTime.now());
  DateTime _calendarMonth = DateTime(DateTime.now().year, DateTime.now().month);
  String _selectedStatus = 'Available';
  final TextEditingController _noteController = TextEditingController();
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final worker = WorkerSession.worker ?? {};
    _selectedStatus = _effectiveWorkerStatus(worker, _selectedDate);
  }

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final today = _dayOnly(DateTime.now());
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: today,
      lastDate: DateTime(2030),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.dark(
              primary: AppColors.amber,
              onPrimary: AppColors.darkNavy,
              surface: AppColors.surface,
              onSurface: AppColors.textPrimary,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      final worker = WorkerSession.worker ?? {};
      final selectedDay = _dayOnly(picked);
      setState(() {
        _selectedDate = selectedDay;
        _calendarMonth = DateTime(selectedDay.year, selectedDay.month);
        _selectedStatus = _effectiveWorkerStatus(worker, selectedDay);
      });
    }
  }

  Color _statusColor(String status) {
    switch (status.toLowerCase()) {
      case 'available':
        return AppColors.success;
      case 'busy':
        return AppColors.warning;
      case 'on leave':
        return AppColors.error;
      default:
        return AppColors.textMuted;
    }
  }

  List<DateTime> _calendarDays() {
    final firstOfMonth = DateTime(_calendarMonth.year, _calendarMonth.month, 1);
    final lastOfMonth = DateTime(_calendarMonth.year, _calendarMonth.month + 1, 0);
    final start = firstOfMonth.subtract(Duration(days: firstOfMonth.weekday - 1));
    final end = lastOfMonth.add(Duration(days: DateTime.daysPerWeek - lastOfMonth.weekday));

    final days = <DateTime>[];
    for (var day = start; !day.isAfter(end); day = day.add(const Duration(days: 1))) {
      days.add(day);
    }
    return days;
  }

  Future<void> _saveStatus() async {
    if (_isPastDate(_selectedDate)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Past dates cannot be updated.')),
      );
      return;
    }

    setState(() => _saving = true);
    try {
      final response = await _api.updateWorkerStatus(
        widget.workerId,
        _selectedDate.toIso8601String().substring(0, 10),
        _selectedStatus,
        _noteController.text.trim(),
      );
      final updatedWorker = response['worker'];
      if (updatedWorker is Map<String, dynamic>) {
        WorkerSession.worker = Map<String, dynamic>.from(updatedWorker);
      }
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Status updated and admin notified.')),
      );
      await widget.onUpdated();
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to update status.')),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final worker = WorkerSession.worker ?? {};
    final calendarDays = _calendarDays();

    return ListView(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).padding.bottom + 100,
      ),
      children: [
        // Header
        Container(
          padding: const EdgeInsets.fromLTRB(24, 20, 24, 24),
          decoration: const BoxDecoration(gradient: AppGradients.hero),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Update Status',
                style: Theme.of(context).textTheme.headlineLarge,
              ),
              const SizedBox(height: 4),
              Text(
                'Set your availability for scheduling',
                style: Theme.of(context)
                    .textTheme
                    .bodyMedium
                    ?.copyWith(color: AppColors.textMuted),
              ),
            ],
          ),
        ),

        Padding(
          padding: const EdgeInsets.all(24),
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: AppDecorations.glass(opacity: 0.08, borderRadius: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Date picker
                GestureDetector(
                  onTap: _pickDate,
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                          color: AppColors.divider.withOpacity(0.5)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppColors.amber.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.calendar_today_rounded,
                              color: AppColors.amber, size: 20),
                        ),
                        const SizedBox(width: 14),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Select Date',
                              style: Theme.of(context)
                                  .textTheme
                                  .bodySmall
                                  ?.copyWith(color: AppColors.textMuted),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${_selectedDate.toLocal()}'.split(' ')[0],
                              style: const TextStyle(
                                color: AppColors.textPrimary,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                        const Spacer(),
                        const Icon(Icons.chevron_right_rounded,
                            color: AppColors.textMuted),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                // Status dropdown
                Text(
                  'Status',
                  style: Theme.of(context)
                      .textTheme
                      .bodySmall
                      ?.copyWith(color: AppColors.textMuted),
                ),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  initialValue: _selectedStatus,
                  dropdownColor: AppColors.surface,
                  style: const TextStyle(
                      color: AppColors.textPrimary, fontSize: 15),
                  decoration: AppDecorations.inputDecoration(
                    label: '',
                    prefixIcon: Icons.circle,
                  ),
                  items: const [
                    DropdownMenuItem(
                        value: 'Available', child: Text('Available')),
                    DropdownMenuItem(value: 'Busy', child: Text('Busy')),
                    DropdownMenuItem(
                        value: 'On Leave', child: Text('On Leave')),
                  ],
                  onChanged: (value) =>
                      setState(() => _selectedStatus = value ?? 'Available'),
                ),
                const SizedBox(height: 20),

                // Note field
                TextField(
                  controller: _noteController,
                  style: const TextStyle(
                      color: AppColors.textPrimary, fontSize: 15),
                  decoration: AppDecorations.inputDecoration(
                    label: 'Note (optional)',
                    prefixIcon: Icons.notes_rounded,
                  ),
                  maxLines: 3,
                ),
                const SizedBox(height: 24),

                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton(
                    onPressed: _saving ? null : _saveStatus,
                    child: _saving
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.5,
                              color: AppColors.darkNavy,
                            ),
                          )
                        : const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.save_rounded, size: 20),
                              SizedBox(width: 8),
                              Text('Save Status'),
                            ],
                          ),
                  ),
                ),
                const SizedBox(height: 24),
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.surface.withOpacity(0.7),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: AppColors.divider.withOpacity(0.35),
                    ),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.info_outline_rounded,
                        color: AppColors.amber,
                        size: 18,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Only today and future dates can be changed. Each saved update affects only that selected date.',
                          style:
                              Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: AppColors.textMuted,
                                    height: 1.35,
                                  ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                Row(
                  children: [
                    Text(
                      'Status Calendar',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const Spacer(),
                    IconButton(
                      onPressed: () {
                        setState(() {
                          _calendarMonth = DateTime(
                            _calendarMonth.year,
                            _calendarMonth.month - 1,
                          );
                        });
                      },
                      icon: const Icon(Icons.chevron_left_rounded,
                          color: AppColors.textMuted),
                    ),
                    Text(
                      DateFormat('MMMM yyyy').format(_calendarMonth),
                      style: Theme.of(context)
                          .textTheme
                          .bodyMedium
                          ?.copyWith(fontWeight: FontWeight.w700),
                    ),
                    IconButton(
                      onPressed: () {
                        setState(() {
                          _calendarMonth = DateTime(
                            _calendarMonth.year,
                            _calendarMonth.month + 1,
                          );
                        });
                      },
                      icon: const Icon(Icons.chevron_right_rounded,
                          color: AppColors.textMuted),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: const [
                    Expanded(child: _CalendarWeekday(label: 'Mon')),
                    Expanded(child: _CalendarWeekday(label: 'Tue')),
                    Expanded(child: _CalendarWeekday(label: 'Wed')),
                    Expanded(child: _CalendarWeekday(label: 'Thu')),
                    Expanded(child: _CalendarWeekday(label: 'Fri')),
                    Expanded(child: _CalendarWeekday(label: 'Sat')),
                    Expanded(child: _CalendarWeekday(label: 'Sun')),
                  ],
                ),
                const SizedBox(height: 8),
                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: calendarDays.length,
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 7,
                    mainAxisSpacing: 5,
                    crossAxisSpacing: 5,
                    childAspectRatio: 0.68,
                  ),
                  itemBuilder: (context, index) {
                    final day = calendarDays[index];
                    final status = _effectiveWorkerStatus(worker, day);
                    final inMonth = day.month == _calendarMonth.month;
                    final isToday = _dateKey(day) == _dateKey(DateTime.now());
                    final isSelected = _dateKey(day) == _dateKey(_selectedDate);
                    final isPast = _isPastDate(day);

                    String shortStatus(String s) {
                      switch (s.toLowerCase()) {
                        case 'available': return 'Avail.';
                        case 'on leave': return 'Leave';
                        default: return s;
                      }
                    }

                    return GestureDetector(
                      onTap: isPast
                          ? null
                          : () {
                              setState(() {
                                _selectedDate = day;
                                _selectedStatus = status;
                              });
                            },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 3, vertical: 6),
                        decoration: BoxDecoration(
                          color: _statusColor(status).withOpacity(
                            isPast ? 0.04 : (inMonth ? 0.14 : 0.06),
                          ),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: isSelected
                                ? AppColors.amber
                                : isToday
                                ? AppColors.amber
                                : _statusColor(status).withOpacity(0.18),
                            width: isSelected || isToday ? 1.4 : 1,
                          ),
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              '${day.day}',
                              style: TextStyle(
                                fontSize: 12,
                                color: inMonth
                                    ? (isPast
                                        ? AppColors.textMuted
                                        : AppColors.textPrimary)
                                    : AppColors.textMuted,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            if (isPast)
                              const Icon(
                                Icons.lock_outline_rounded,
                                size: 11,
                                color: AppColors.textMuted,
                              )
                            else
                              Text(
                                shortStatus(status),
                                maxLines: 2,
                                textAlign: TextAlign.center,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  fontSize: 9,
                                  height: 1.2,
                                  color: _statusColor(status),
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 16),
                if (_upcomingStatusHistory(worker).isNotEmpty) ...[
                  Text(
                    'Upcoming Changes',
                    style: Theme.of(context)
                        .textTheme
                        .bodySmall
                        ?.copyWith(color: AppColors.textMuted),
                  ),
                  const SizedBox(height: 10),
                  ..._upcomingStatusHistory(worker).take(4).map((entry) {
                    final status = entry['status']?.toString() ?? 'Available';
                    final date = _parseStatusDate(entry['date']) ?? DateTime.now();
                    return Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: AppColors.divider.withOpacity(0.4),
                        ),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 10,
                            height: 10,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: _statusColor(status),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  status,
                                  style: const TextStyle(
                                    color: AppColors.textPrimary,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  DateFormat.yMMMd().format(date),
                                  style: const TextStyle(
                                    color: AppColors.textMuted,
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          if ((entry['note']?.toString() ?? '').isNotEmpty)
                            SizedBox(
                              width: 90,
                              child: Text(
                                entry['note']?.toString() ?? '',
                                textAlign: TextAlign.right,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: AppColors.textMuted,
                                  fontSize: 11,
                                ),
                              ),
                            ),
                        ],
                      ),
                    );
                  }),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }
}

// ──────────────────────────────────────────────────
// PROFILE TAB
// ──────────────────────────────────────────────────
class _CalendarWeekday extends StatelessWidget {
  const _CalendarWeekday({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Text(
        label,
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: AppColors.textMuted,
              fontWeight: FontWeight.w700,
            ),
      ),
    );
  }
}

class _ProfileTab extends StatelessWidget {
  const _ProfileTab({required this.worker});

  final Map<String, dynamic> worker;

  @override
  Widget build(BuildContext context) {
    final todayStatus = _effectiveWorkerStatus(worker, DateTime.now());

    return ListView(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).padding.bottom + 100,
      ),
      children: [
        // Header with avatar
        Container(
          padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
          decoration: const BoxDecoration(gradient: AppGradients.hero),
          child: Column(
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: AppGradients.accent,
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.amber.withOpacity(0.3),
                      blurRadius: 20,
                    ),
                  ],
                ),
                child: Center(
                  child: Text(
                    (worker['name']?.toString() ?? 'W')[0].toUpperCase(),
                    style: const TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.w700,
                      color: AppColors.darkNavy,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              Text(
                worker['name']?.toString() ?? 'Worker',
                style: Theme.of(context)
                    .textTheme
                    .headlineMedium
                    ?.copyWith(fontSize: 22),
              ),
              const SizedBox(height: 4),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
                decoration: BoxDecoration(
                  color: AppColors.amber.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  todayStatus,
                  style: const TextStyle(
                    color: AppColors.amber,
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
        ),

        // Profile info cards
        Padding(
          padding: const EdgeInsets.all(24),
          child: Container(
            decoration: AppDecorations.glass(opacity: 0.08, borderRadius: 20),
            child: Column(
              children: [
                _ProfileRow(
                  icon: Icons.person_outline_rounded,
                  label: 'Name',
                  value: worker['name']?.toString() ?? '-',
                  isFirst: true,
                ),
                _divider(),
                _ProfileRow(
                  icon: Icons.alternate_email_rounded,
                  label: 'Username',
                  value: worker['username']?.toString() ?? '-',
                ),
                _divider(),
                _ProfileRow(
                  icon: Icons.email_outlined,
                  label: 'Email',
                  value: worker['email']?.toString() ?? '-',
                ),
                _divider(),
                _ProfileRow(
                  icon: Icons.phone_outlined,
                  label: 'Phone',
                  value: worker['phone']?.toString() ?? '-',
                ),
                _divider(),
                _ProfileRow(
                  icon: Icons.circle,
                  label: 'Today\'s Status',
                  value: todayStatus,
                  isLast: true,
                ),
              ],
            ),
          ),
        ),

        // Logout button
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: () async {
                await WorkerSession.clear();
                if (context.mounted) {
                  Navigator.pushReplacementNamed(context, '/login');
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.error.withOpacity(0.15),
                foregroundColor: AppColors.error,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                  side: BorderSide(color: AppColors.error.withOpacity(0.3)),
                ),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.logout_rounded, size: 20),
                  SizedBox(width: 8),
                  Text('Sign Out',
                      style: TextStyle(fontWeight: FontWeight.w600)),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _divider() {
    return Divider(
      height: 0.5,
      thickness: 0.5,
      indent: 56,
      color: AppColors.divider.withOpacity(0.4),
    );
  }
}

class _ProfileRow extends StatelessWidget {
  const _ProfileRow({
    required this.icon,
    required this.label,
    required this.value,
    this.isFirst = false,
    this.isLast = false,
  });

  final IconData icon;
  final String label;
  final String value;
  final bool isFirst;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(
        18,
        isFirst ? 18 : 14,
        18,
        isLast ? 18 : 14,
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.amber.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: AppColors.amber, size: 18),
          ),
          const SizedBox(width: 14),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: Theme.of(context)
                    .textTheme
                    .bodySmall
                    ?.copyWith(color: AppColors.textMuted, fontSize: 11),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w600,
                  fontSize: 15,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────────
// SHARED WIDGETS
// ──────────────────────────────────────────────────
class _JobCard extends StatelessWidget {
  const _JobCard({required this.job});

  final dynamic job;

  Color _statusColor(String status) {
    switch (status.toLowerCase()) {
      case 'completed':
        return AppColors.success;
      case 'in progress':
        return AppColors.info;
      case 'pending':
        return AppColors.warning;
      default:
        return AppColors.textMuted;
    }
  }

  @override
  Widget build(BuildContext context) {
    final status = job['status']?.toString() ?? 'Pending';
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 6),
      child: GestureDetector(
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) =>
                JobDetailsScreen(job: Map<String, dynamic>.from(job)),
          ),
        ),
        child: Container(
          padding: const EdgeInsets.all(18),
          decoration: AppDecorations.card(),
          child: Row(
            children: [
              Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(
                  gradient: AppGradients.accent,
                  borderRadius: BorderRadius.circular(13),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.amber.withOpacity(0.2),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: const Icon(Icons.handyman_rounded,
                    color: AppColors.darkNavy, size: 22),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      job['title'] ?? 'Job',
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w600,
                        fontSize: 15,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: _statusColor(status).withValues(alpha: 0.18),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: _statusColor(status).withValues(alpha: 0.4),
                          width: 1,
                        ),
                      ),
                      child: Text(
                        status,
                        style: TextStyle(
                          color: _statusColor(status),
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right_rounded,
                  color: AppColors.textMuted, size: 22),
            ],
          ),
        ),
      ),
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message});
  final String message;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.error.withOpacity(0.1),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.error.withOpacity(0.25)),
        ),
        child: Row(
          children: [
            const Icon(Icons.error_outline_rounded,
                color: AppColors.error, size: 22),
            const SizedBox(width: 12),
            Expanded(
              child: Text(message,
                  style: const TextStyle(color: AppColors.error, fontSize: 14)),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(48),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.surface.withOpacity(0.5),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, size: 44, color: AppColors.textMuted),
          ),
          const SizedBox(height: 18),
          Text(
            title,
            style: Theme.of(context)
                .textTheme
                .titleLarge
                ?.copyWith(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 6),
          Text(
            subtitle,
            style: Theme.of(context).textTheme.bodyMedium,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
