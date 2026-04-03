import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:image_picker/image_picker.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../core/theme.dart';
import '../services/api_service.dart';
import '../services/session.dart';

class JobDetailsScreen extends StatefulWidget {
  const JobDetailsScreen({super.key, required this.job});

  final Map<String, dynamic> job;

  @override
  State<JobDetailsScreen> createState() => _JobDetailsScreenState();
}

class _JobDetailsScreenState extends State<JobDetailsScreen> {
  final _api = ApiService();
  late Map<String, dynamic> _job;
  bool _savingLog = false;
  bool _gettingLocation = false;

  DateTime _selectedDate = DateTime.now();
  late DateTime _calendarMonth;

  final TextEditingController _logDescription = TextEditingController();
  
  // New state variables for image and location
  XFile? _selectedImage;
  String _currentAddress = 'No location detected';
  double? _currentLat;
  double? _currentLng;

  @override
  void initState() {
    super.initState();
    _job = Map<String, dynamic>.from(widget.job);
    _selectedDate = _findFirstActiveDate();
    _calendarMonth = DateTime(_selectedDate.year, _selectedDate.month, 1);
  }

  DateTime _findFirstActiveDate() {
    // Try workCalendar dates first (sorted)
    final workCal = _job['workCalendar'] as List<dynamic>? ?? [];
    final activeDates = <String>[];
    for (final entry in workCal) {
      final dateStr = entry['date']?.toString() ?? '';
      final hours = (entry['hours'] is num) ? (entry['hours'] as num).toDouble() : double.tryParse(entry['hours']?.toString() ?? '') ?? 0;
      final workers = entry['workerIds'] as List<dynamic>? ?? [];
      if (dateStr.isNotEmpty && (hours > 0 || workers.isNotEmpty)) {
        activeDates.add(dateStr);
      }
    }
    activeDates.sort();
    if (activeDates.isNotEmpty) {
      final parsed = DateTime.tryParse(activeDates.first);
      if (parsed != null) return parsed;
    }

    // Fallback to project startDate
    final startStr = _job['startDate']?.toString();
    if (startStr != null && startStr.isNotEmpty) {
      final parsed = DateTime.tryParse(startStr);
      if (parsed != null) return parsed;
    }

    // Final fallback to today
    return DateTime.now();
  }

  @override
  void dispose() {
    _logDescription.dispose();
    super.dispose();
  }

  List<dynamic> get _dailyLogs => (_job['dailyLogs'] as List<dynamic>? ?? []);
  List<dynamic> get _schedules => (_job['schedules'] as List<dynamic>? ?? []);

  String _toIsoDateStr(DateTime date) {
    return "${date.year.toString().padLeft(4, '0')}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}";
  }

  bool _isDayActive(DateTime day) {
    final isoDate = _toIsoDateStr(day);
    final workerId = WorkerSession.worker?['_id']?.toString() ?? '';

    // Check workCalendar: day is active only if this worker is assigned
    final workCal = _job['workCalendar'] as List<dynamic>? ?? [];
    final workerInCal = workCal.any((e) {
      if (e['date'] == null || !e['date'].toString().startsWith(isoDate)) return false;
      final ids = (e['workerIds'] as List<dynamic>? ?? []).map((id) => id.toString());
      return ids.contains(workerId);
    });
    if (workerInCal) return true;

    // Check schedules: this worker's scheduled dates
    final schedules = _job['schedules'] as List<dynamic>? ?? [];
    final workerInSchedule = schedules.any((s) {
      final sid = (s['workerId'] ?? '').toString();
      if (sid != workerId) return false;
      final dates = s['dates'] as List<dynamic>? ?? [];
      return dates.any((d) => d.toString().startsWith(isoDate));
    });
    if (workerInSchedule) return true;

    // If neither workCalendar entries nor schedules exist for this worker at all,
    // fall back to checking daily logs (backwards compat for older jobs)
    final hasWorkerData = workCal.any((e) {
          final ids = (e['workerIds'] as List<dynamic>? ?? []).map((id) => id.toString());
          return ids.contains(workerId);
        }) ||
        schedules.any((s) => (s['workerId'] ?? '').toString() == workerId);

    if (!hasWorkerData) {
      return _dailyLogs.any((log) {
        final logDateStr = log['date']?.toString() ?? '';
        return logDateStr.startsWith(isoDate);
      });
    }

    return false;
  }

  List<dynamic> get _selectedDateLogs {
    final selectedIso = _toIsoDateStr(_selectedDate);
    return _dailyLogs.where((log) {
      final logDateStr = log['date']?.toString() ?? '';
      return logDateStr.startsWith(selectedIso);
    }).toList();
  }

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

  String _formatDate(String? isoString) {
    if (isoString == null || isoString.isEmpty) return '-';
    try {
      final date = DateTime.parse(isoString).toLocal();
      return DateFormat.yMMMd().add_jm().format(date);
    } catch (_) {
      return isoString;
    }
  }

  double? _toDouble(dynamic value) {
    if (value == null) return null;
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString());
  }

  String _resolveImageUrl(String? imageUrl) {
    if (imageUrl == null || imageUrl.isEmpty || imageUrl == 'No image') {
      return '';
    }
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    if (imageUrl.startsWith('/')) {
      return '${ApiService.baseHost}$imageUrl';
    }
    return '${ApiService.baseHost}/uploads/$imageUrl';
  }

  Widget _buildInteractiveMap(double lat, double lng) {
    final point = LatLng(lat, lng);
    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: FlutterMap(
        options: MapOptions(
          initialCenter: point,
          initialZoom: 15,
          interactionOptions: const InteractionOptions(
            flags: InteractiveFlag.all,
          ),
        ),
        children: [
          TileLayer(
            urlTemplate: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            subdomains: const ['a', 'b', 'c'],
            userAgentPackageName: 'cj_joinery_mobile',
          ),
          MarkerLayer(
            markers: [
              Marker(
                point: point,
                width: 40,
                height: 40,
                child: const Icon(
                  Icons.location_on,
                  color: AppColors.amber,
                  size: 40,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }



  Future<void> _pickImage(ImageSource source) async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: source, imageQuality: 70);
    if (pickedFile != null) {
      setState(() {
        _selectedImage = pickedFile;
      });
      _detectLocation(); // Automatically get location when an image is selected
    }
  }

  Future<void> _detectLocation() async {
    setState(() {
      _gettingLocation = true;
      _currentAddress = 'Detecting location...';
    });

    try {
      // 1. Check permissions
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        throw Exception('Location services are disabled.');
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          throw Exception('Location permissions are denied');
        }
      }

      if (permission == LocationPermission.deniedForever) {
        throw Exception('Location permissions are permanently denied.');
      }

      // 2. Get coordinates
      Position position = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high);
          
      _currentLat = position.latitude;
      _currentLng = position.longitude;

      // 3. Reverse Geocode for address
      List<Placemark> placemarks = await placemarkFromCoordinates(
          position.latitude, position.longitude);
      
      if (placemarks.isNotEmpty) {
        Placemark place = placemarks[0];
        setState(() {
          _currentAddress = 
              '${place.street}, ${place.locality}, ${place.administrativeArea}';
        });
      } else {
        setState(() {
          _currentAddress = '${position.latitude}, ${position.longitude}';
        });
      }
    } catch (e) {
      setState(() {
        _currentAddress = 'Could not detect location';
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _gettingLocation = false;
        });
      }
    }
  }

  Future<void> _saveDailyLog() async {
    final workerId = WorkerSession.worker?['_id']?.toString();
    if (workerId == null) return;
    
    setState(() => _savingLog = true);
    try {
      // In a real app we'd upload _selectedImage bytes to cloud storage
      // For this demo, we use the filename
      final imageName = _selectedImage?.name ?? 'No image';

      final savedLog = await _api.addDailyLog(
        workerId: workerId,
        jobId: _job['_id'].toString(),
        date: _selectedDate.toIso8601String(),
        description: _logDescription.text.trim(),
        imageUrl: imageName,
        location: {
          'lat': _currentLat,
          'lng': _currentLng,
          'address': (_currentAddress == 'Could not detect location' ||
                  _currentAddress == 'No location detected' ||
                  _currentAddress == 'Detecting location...')
              ? null
              : _currentAddress,
        },
        imageFile: _selectedImage,
      );
      
      final newLog = {
        ...savedLog,
        'workerName': savedLog['workerName'] ?? WorkerSession.worker?['name'] ?? 'Worker',
        'date': savedLog['date'] ?? _selectedDate.toIso8601String(),
        'description': savedLog['description'] ?? _logDescription.text.trim(),
        'imageUrl': savedLog['imageUrl'] ?? imageName,
        'location': savedLog['location'] ?? {
          'lat': _currentLat,
          'lng': _currentLng,
          'address': _currentAddress,
        },
      };
      
      setState(() {
        _job['dailyLogs'] = [newLog, ..._dailyLogs];
        // Reset form
        _logDescription.clear();
        _selectedImage = null;
        _currentLat = null;
        _currentLng = null;
        _currentAddress = 'No location detected';
      });
      
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Daily log submitted.')),
      );
    } catch (e) {
      if (!mounted) return;
      final errorMessage = e.toString().replaceFirst('Exception: ', '');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to submit daily log: $errorMessage')),
      );
    } finally {
      if (mounted) setState(() => _savingLog = false);
    }
  }

  void _showImageSourceActionSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.photo_library_rounded, color: AppColors.amber),
              title: const Text('Choose from Gallery', style: TextStyle(color: AppColors.textPrimary)),
              onTap: () {
                Navigator.of(context).pop();
                _pickImage(ImageSource.gallery);
              },
            ),
            ListTile(
              leading: const Icon(Icons.camera_alt_rounded, color: AppColors.amber),
              title: const Text('Take a Photo', style: TextStyle(color: AppColors.textPrimary)),
              onTap: () {
                Navigator.of(context).pop();
                _pickImage(ImageSource.camera);
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final materials = (_job['materials'] as List<dynamic>? ?? []).join(', ');
    final status = _job['status']?.toString() ?? 'Pending';

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // Gradient App Bar
          SliverAppBar(
            expandedHeight: 180,
            pinned: true,
            backgroundColor: AppColors.navy,
            leading: GestureDetector(
              onTap: () => Navigator.pop(context),
              child: Container(
                margin: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.arrow_back_rounded,
                    color: AppColors.textPrimary),
              ),
            ),
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(gradient: AppGradients.hero),
                padding: const EdgeInsets.fromLTRB(24, 90, 24, 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Text(
                      _job['title'] ?? 'Job Details',
                      style: Theme.of(context)
                          .textTheme
                          .headlineMedium
                          ?.copyWith(fontSize: 22),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 4),
                      decoration: BoxDecoration(
                        color: _statusColor(status).withOpacity(0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        status,
                        style: TextStyle(
                          color: _statusColor(status),
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Content
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Description
                  if (_job['description'] != null &&
                      _job['description'].toString().isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 20),
                      child: Text(
                        _job['description'].toString(),
                        style: Theme.of(context)
                            .textTheme
                            .bodyLarge
                            ?.copyWith(
                                color: AppColors.textSecondary, height: 1.5),
                      ),
                    ),

                  // Info card
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration:
                        AppDecorations.glass(opacity: 0.08, borderRadius: 18),
                    child: Column(
                      children: [
                        _InfoRow(
                          icon: Icons.calendar_today_rounded,
                          label: 'Start Date',
                          value: _formatDate(_job['startDate']?.toString()),
                        ),
                        _infoDivider(),
                        _InfoRow(
                          icon: Icons.flag_rounded,
                          label: 'Deadline',
                          value: _formatDate(_job['deadline']?.toString() ??
                              _job['dueDate']?.toString()),
                        ),
                        _infoDivider(),
                        _InfoRow(
                          icon: Icons.schedule_rounded,
                          label: 'Expected Hours',
                          value: _job['expectedHours']?.toString() ?? '-',
                        ),
                        if (materials.isNotEmpty) ...[
                          _infoDivider(),
                          _InfoRow(
                            icon: Icons.inventory_2_outlined,
                            label: 'Materials',
                            value: materials,
                          ),
                        ],
                      ],
                    ),
                  ),

                  const SizedBox(height: 28),

                  // ── Interactive Calendar ──
                  _SectionHeader(
                    icon: Icons.calendar_month_rounded,
                    title: 'Work Calendar',
                  ),
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration:
                        AppDecorations.glass(opacity: 0.08, borderRadius: 18),
                    child: Column(
                      children: [
                        // Month navigation
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            GestureDetector(
                              onTap: () => setState(() {
                                _calendarMonth = DateTime(
                                    _calendarMonth.year,
                                    _calendarMonth.month - 1,
                                    1);
                              }),
                              child: Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: AppColors.surface,
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(
                                      color:
                                          AppColors.divider.withOpacity(0.4)),
                                ),
                                child: const Icon(Icons.chevron_left_rounded,
                                    color: AppColors.textPrimary, size: 20),
                              ),
                            ),
                            Text(
                              DateFormat.yMMMM().format(_calendarMonth),
                              style: const TextStyle(
                                color: AppColors.textPrimary,
                                fontWeight: FontWeight.w700,
                                fontSize: 16,
                              ),
                            ),
                            GestureDetector(
                              onTap: () => setState(() {
                                _calendarMonth = DateTime(
                                    _calendarMonth.year,
                                    _calendarMonth.month + 1,
                                    1);
                              }),
                              child: Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: AppColors.surface,
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(
                                      color:
                                          AppColors.divider.withOpacity(0.4)),
                                ),
                                child: const Icon(Icons.chevron_right_rounded,
                                    color: AppColors.textPrimary, size: 20),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),

                        // Day-of-week headers
                        Row(
                          children: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                              .map((d) => Expanded(
                                    child: Center(
                                      child: Text(
                                        d,
                                        style: const TextStyle(
                                          color: AppColors.textMuted,
                                          fontSize: 11,
                                          fontWeight: FontWeight.w700,
                                          letterSpacing: 0.5,
                                        ),
                                      ),
                                    ),
                                  ))
                              .toList(),
                        ),
                        const SizedBox(height: 8),

                        // Calendar grid
                        Builder(builder: (context) {
                          final firstOfMonth = DateTime(
                              _calendarMonth.year, _calendarMonth.month, 1);
                          // Monday = 1, Sunday = 7
                          final startWeekday = firstOfMonth.weekday; // 1-7
                          final daysInMonth = DateTime(
                                  _calendarMonth.year,
                                  _calendarMonth.month + 1,
                                  0)
                              .day;
                          final leadingBlanks = startWeekday - 1;
                          final totalCells = leadingBlanks + daysInMonth;
                          final rows = (totalCells / 7).ceil();

                          return Column(
                            children: List.generate(rows, (rowIndex) {
                              return Padding(
                                padding:
                                    const EdgeInsets.symmetric(vertical: 2),
                                child: Row(
                                  children:
                                      List.generate(7, (colIndex) {
                                    final cellIndex = rowIndex * 7 + colIndex;
                                    final dayNumber =
                                        cellIndex - leadingBlanks + 1;

                                    if (dayNumber < 1 ||
                                        dayNumber > daysInMonth) {
                                      return const Expanded(
                                          child: SizedBox(height: 46));
                                    }

                                    final day = DateTime(
                                        _calendarMonth.year,
                                        _calendarMonth.month,
                                        dayNumber);
                                    final isSelected =
                                        _toIsoDateStr(day) ==
                                            _toIsoDateStr(_selectedDate);
                                    final isToday =
                                        _toIsoDateStr(day) ==
                                            _toIsoDateStr(DateTime.now());
                                    final isActive = _isDayActive(day);

                                    return Expanded(
                                      child: GestureDetector(
                                        onTap: isActive
                                            ? () => setState(() {
                                                  _selectedDate = day;
                                                })
                                            : null,
                                        child: AnimatedContainer(
                                          duration: const Duration(
                                              milliseconds: 200),
                                          height: 46,
                                          margin: const EdgeInsets.all(2),
                                          decoration: BoxDecoration(
                                            color: isSelected
                                                ? AppColors.amber
                                                : isToday
                                                    ? AppColors.amber
                                                        .withOpacity(0.12)
                                                    : Colors.transparent,
                                            borderRadius:
                                                BorderRadius.circular(12),
                                            border: isToday && !isSelected
                                                ? Border.all(
                                                    color: AppColors.amber
                                                        .withOpacity(0.5),
                                                    width: 1.5)
                                                : null,
                                          ),
                                          child: Opacity(
                                            opacity: isActive ? 1.0 : 0.3,
                                            child: Column(
                                            mainAxisAlignment:
                                                MainAxisAlignment.center,
                                            children: [
                                              Text(
                                                '$dayNumber',
                                                style: TextStyle(
                                                  color: isSelected
                                                      ? AppColors.darkNavy
                                                      : AppColors.textPrimary,
                                                  fontWeight: isSelected ||
                                                          isToday
                                                      ? FontWeight.w700
                                                      : FontWeight.w500,
                                                  fontSize: 14,
                                                ),
                                              ),
                                              if (isActive && !isSelected)
                                                Container(
                                                  margin:
                                                      const EdgeInsets.only(
                                                          top: 3),
                                                  width: 5,
                                                  height: 5,
                                                  decoration: BoxDecoration(
                                                    color: AppColors.amber,
                                                    shape: BoxShape.circle,
                                                  ),
                                                ),
                                              if (isActive && isSelected)
                                                Container(
                                                  margin:
                                                      const EdgeInsets.only(
                                                          top: 3),
                                                  width: 5,
                                                  height: 5,
                                                  decoration: BoxDecoration(
                                                    color: AppColors.darkNavy,
                                                    shape: BoxShape.circle,
                                                  ),
                                                ),
                                            ],
                                          ),
                                          ),
                                        ),
                                      ),
                                    );
                                  }),
                                ),
                              );
                            }),
                          );
                        }),
                      ],
                    ),
                  ),

                  const SizedBox(height: 28),

                  // ── Daily Log for Selected Date ──
                  _SectionHeader(
                    icon: Icons.edit_note_rounded,
                    title: 'Log for ${DateFormat.yMMMd().format(_selectedDate)}',
                  ),
                  const SizedBox(height: 14),

                  // Only allow submission for today
                  if (_toIsoDateStr(_selectedDate) != _toIsoDateStr(DateTime.now()))
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration:
                          AppDecorations.glass(opacity: 0.08, borderRadius: 18),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: AppColors.warning.withOpacity(0.12),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(Icons.lock_clock_rounded,
                                color: AppColors.warning, size: 22),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Log Submission Locked',
                                  style: TextStyle(
                                    color: AppColors.textPrimary,
                                    fontWeight: FontWeight.w700,
                                    fontSize: 14,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'You can only submit daily logs for today (${DateFormat.yMMMd().format(DateTime.now())})',
                                  style: const TextStyle(
                                    color: AppColors.textMuted,
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                  if (_toIsoDateStr(_selectedDate) == _toIsoDateStr(DateTime.now()))
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration:
                        AppDecorations.glass(opacity: 0.08, borderRadius: 18),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        TextField(
                          controller: _logDescription,
                          style: const TextStyle(
                              color: AppColors.textPrimary, fontSize: 15),
                          decoration: AppDecorations.inputDecoration(
                            label: 'What was completed on this day?',
                            prefixIcon: Icons.description_outlined,
                          ),
                          maxLines: 3,
                        ),
                        const SizedBox(height: 16),
                        
                        // Image Picker Row
                        Text(
                          'Attach Image',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary),
                        ),
                        const SizedBox(height: 8),
                        GestureDetector(
                          onTap: _showImageSourceActionSheet,
                          child: Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: AppColors.surface,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: AppColors.divider.withOpacity(0.5)),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: _selectedImage != null 
                                        ? AppColors.success.withOpacity(0.1) 
                                        : AppColors.amber.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Icon(
                                    _selectedImage != null ? Icons.check_circle_outline_rounded : Icons.add_a_photo_outlined, 
                                    color: _selectedImage != null ? AppColors.success : AppColors.amber, 
                                    size: 20
                                  ),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Text(
                                    _selectedImage != null ? _selectedImage!.name : 'Tap to upload or take a photo',
                                    style: TextStyle(
                                      color: _selectedImage != null ? AppColors.textPrimary : AppColors.textMuted,
                                      fontSize: 14,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        
                        const SizedBox(height: 16),
                        
                        // Location Detection Row
                        Row(
                          children: [
                            Text(
                              'Location',
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary),
                            ),
                            const Spacer(),
                            if (_gettingLocation)
                              const SizedBox(
                                width: 12, height: 12,
                                child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.amber),
                              ),
                            if (!_gettingLocation && _currentLat != null)
                              GestureDetector(
                                onTap: _detectLocation,
                                child: const Icon(Icons.refresh_rounded, size: 16, color: AppColors.amber),
                              ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: AppColors.divider.withOpacity(0.5)),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                Icons.location_on_outlined, 
                                color: _currentLat != null ? AppColors.info : AppColors.textMuted, 
                                size: 20
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  _currentAddress,
                                  style: TextStyle(
                                    color: _currentLat != null ? AppColors.textPrimary : AppColors.textMuted,
                                    fontSize: 14,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),
                        SizedBox(
                          width: double.infinity,
                          height: 50,
                          child: ElevatedButton(
                            onPressed: _savingLog ? null : _saveDailyLog,
                            child: _savingLog
                                ? const SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2.5,
                                      color: AppColors.darkNavy,
                                    ),
                                  )
                                : const Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(Icons.upload_rounded, size: 18),
                                      SizedBox(width: 8),
                                      Text('Submit Daily Log'),
                                    ],
                                  ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 28),

                  // ── Logs for selected date ──
                  _SectionHeader(
                    icon: Icons.history_rounded,
                    title: 'Logs on ${DateFormat.yMMMd().format(_selectedDate)}',
                  ),
                  const SizedBox(height: 14),

                  if (_selectedDateLogs.isEmpty)
                    Container(
                      padding: const EdgeInsets.all(32),
                      decoration: AppDecorations.glass(
                          opacity: 0.05, borderRadius: 18),
                      child: Center(
                        child: Column(
                          children: [
                            Icon(Icons.description_outlined,
                                size: 36,
                                color: AppColors.textMuted.withOpacity(0.5)),
                            const SizedBox(height: 10),
                            Text(
                              'No logs for this date',
                              style: Theme.of(context)
                                  .textTheme
                                  .bodyMedium
                                  ?.copyWith(color: AppColors.textMuted),
                            ),
                          ],
                        ),
                      ),
                    ),

                  if (_selectedDateLogs.isNotEmpty)
                    ..._selectedDateLogs.map((log) {
                      final loc = log['location'];
                      final imageUrl = _resolveImageUrl(log['imageUrl']?.toString());
                      final lat = _toDouble(loc?['lat']);
                      final lng = _toDouble(loc?['lng']);
                      final hasCoords = lat != null && lng != null && (lat != 0.0 || lng != 0.0);
                      final address = loc?['address']?.toString() ?? '';
                      final hasAddress = address.isNotEmpty &&
                          address != 'Could not detect location' &&
                          address != 'No location detected';
                      String locString = 'No location detected';
                      if (hasAddress) {
                        locString = address;
                      } else if (hasCoords) {
                        locString = '${lat.toStringAsFixed(6)}, ${lng.toStringAsFixed(6)}';
                      }
                      return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(18),
                          decoration: AppDecorations.card(),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: AppColors.amber.withOpacity(0.12),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      log['workerName']?.toString() ?? 'Worker',
                                      style: const TextStyle(
                                        color: AppColors.amber,
                                        fontSize: 11,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                    ),
                                    const Spacer(),
                                    if (imageUrl.isNotEmpty)
                                      Row(
                                        children: [
                                          Icon(Icons.image_rounded, size: 14, color: AppColors.textSecondary),
                                          const SizedBox(width: 4),
                                          Text(
                                            'Image attached',
                                            style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
                                          )
                                        ],
                                      ),
                                  ],
                                ),
                                const SizedBox(height: 10),
                                Text(
                                  log['description']?.toString() ?? '',
                                  style: const TextStyle(
                                    color: AppColors.textPrimary,
                                    fontSize: 14,
                                    height: 1.4,
                                  ),
                                ),
                                if (imageUrl.isNotEmpty) ...[
                                  const SizedBox(height: 12),
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(12),
                                    child: Image.network(
                                      imageUrl,
                                      height: 160,
                                      width: double.infinity,
                                      fit: BoxFit.cover,
                                      errorBuilder: (context, error, stackTrace) {
                                        return Container(
                                          height: 160,
                                          color: AppColors.surface,
                                          alignment: Alignment.center,
                                          child: Text(
                                            'Image unavailable',
                                            style: TextStyle(
                                              color: AppColors.textMuted,
                                              fontSize: 12,
                                            ),
                                          ),
                                        );
                                      },
                                    ),
                                  ),
                                ],
                                const SizedBox(height: 12),
                                Row(
                                  children: [
                                    Icon(Icons.location_on, size: 14, color: AppColors.info),
                                  const SizedBox(width: 6),
                                  Expanded(
                                    child: Text(
                                      locString,
                                      style: TextStyle(
                                        color: AppColors.info,
                                        fontSize: 12,
                                        fontWeight: FontWeight.w500,
                                      ),
                                      ),
                                    ),
                                  ],
                                ),
                                if (hasCoords) ...[
                                  const SizedBox(height: 10),
                                  SizedBox(
                                    height: 160,
                                    width: double.infinity,
                                    child: _buildInteractiveMap(lat!, lng!),
                                  ),
                                ],
                              ],
                            ),
                          );
                    }),

                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _infoDivider() {
    return Divider(
      height: 24,
      thickness: 0.5,
      indent: 44,
      color: AppColors.divider.withOpacity(0.4),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppColors.amber.withOpacity(0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: AppColors.amber, size: 16),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
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
                  fontWeight: FontWeight.w500,
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.icon, required this.title});

  final IconData icon;
  final String title;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            gradient: AppGradients.accent,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: AppColors.darkNavy, size: 18),
        ),
        const SizedBox(width: 12),
        Text(
          title,
          style: Theme.of(context).textTheme.titleLarge,
        ),
      ],
    );
  }
}
