import React, { useState } from 'react';
import { 
  Code2, 
  Copy, 
  Check, 
  Terminal, 
  FileCode, 
  Sparkles,
  HeartHandshake
} from 'lucide-react';
import { Language } from '../types';

interface FlutterExportViewProps {
  language: Language;
}

export const FlutterExportView: React.FC<FlutterExportViewProps> = ({ language }) => {
  const isKm = language === 'km';
  const [activeFile, setActiveFile] = useState<'main.dart' | 'pubspec.yaml' | 'carrier_model.dart' | 'tracking_screen.dart' | 'banking_account_screen.dart' | 'driver_chat.dart'>('main.dart');
  const [copied, setCopied] = useState(false);

  const filesCode = {
    'main.dart': `// =================================================================
// CamDelivery Free - Flutter 3 Cross-Platform Application
// 100% Free & Independent Cambodia Delivery & Logistics Platform
// ឥតគិតថ្លៃ ១០០% សម្រាប់ប្រជាជនកម្ពុជា - គ្មានកាត់កម្រៃជើងសារ 0%
// =================================================================

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

void main() {
  runApp(const CamDeliveryFreeApp());
}

class CamDeliveryFreeApp extends StatelessWidget {
  const CamDeliveryFreeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CamDelivery Free',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF059669), // Emerald 600
          primary: const Color(0xFF059669),
          surface: Colors.white,
        ),
        // Cambodia Khmer & English Typography
        textTheme: GoogleFonts.kantumruyProTextTheme(
          Theme.of(context).textTheme,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF0F172A), // Slate 900
          foregroundColor: Colors.white,
          elevation: 0,
        ),
      ),
      home: const DeliveryHomeNavigation(),
    );
  }
}

class DeliveryHomeNavigation extends StatefulWidget {
  const DeliveryHomeNavigation({super.key});

  @override
  State<DeliveryHomeNavigation> createState() => _DeliveryHomeNavigationState();
}

class _DeliveryHomeNavigationState extends State<DeliveryHomeNavigation> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const CourierCompareScreen(),
    const CommunityFoodScreen(),
    const CommunityRideScreen(),
    const UniversalTrackingScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFF059669),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text('FREE', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
            ),
            const SizedBox(width: 8),
            const Text('CamDelivery', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ],
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 12),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Text('១០០% ឥតគិតថ្លៃ', style: TextStyle(fontSize: 11, color: Colors.amber)),
          ),
        ],
      ),
      body: _screens[_currentIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) => setState(() => _currentIndex = index),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.local_shipping_outlined),
            selectedIcon: Icon(Icons.local_shipping),
            label: 'បញ្ញើខេត្ត',
          ),
          NavigationDestination(
            icon: Icon(Icons.restaurant_outlined),
            selectedIcon: Icon(Icons.restaurant),
            label: 'ម្ហូប & ផ្សារ',
          ),
          NavigationDestination(
            icon: Icon(Icons.directions_car_outlined),
            selectedIcon: Icon(Icons.directions_car),
            label: 'កង់បី/ម៉ូតូ',
          ),
          NavigationDestination(
            icon: Icon(Icons.track_changes_outlined),
            selectedIcon: Icon(Icons.track_changes),
            label: 'តាមដាន',
          ),
        ],
      ),
    );
  }
}

// Module 1: Independent Inter-Provincial Van & Parcel Comparison
class CourierCompareScreen extends StatelessWidget {
  const CourierCompareScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildServiceCard('CamExpress Van', 'ឡានវ៉ែនអន្តរខេត្ត ២៥ ខេត្ត-ក្រុង', '6,000 KHR', const Color(0xFF2563EB)),
        _buildServiceCard('CamDirect Door', 'សេវាដឹកដល់មាត់ទ្វារផ្ទះ', '6,500 KHR', const Color(0xFF059669)),
        _buildServiceCard('CamPriority Air/Road', 'សេវាអាទិភាពព្រឹកស្អែក', '7,000 KHR', const Color(0xFFD97706)),
        _buildServiceCard('CamCold Fresh', 'ទូត្រជាក់ម្ហូប & បន្លែស្រស់', '8,000 KHR', const Color(0xFF0284C7)),
        _buildServiceCard('CamPostal Post', 'បញ្ញើសន្សំសំចៃតាមស្រុក', '5,000 KHR', const Color(0xFF4F46E5)),
      ],
    );
  }

  Widget _buildServiceCard(String name, String desc, String price, Color color) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: CircleAvatar(
          backgroundColor: color,
          child: Text(name.substring(0, 2), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        ),
        title: Text(name, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text(desc),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(price, style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF059669), fontSize: 16)),
            const Text('0% Fee', style: TextStyle(fontSize: 11, color: Colors.grey)),
          ],
        ),
      ),
    );
  }
}

// Module 2: Community Food & Farm Mart (Zero Vendor Surcharge)
class CommunityFoodScreen extends StatelessWidget {
  const CommunityFoodScreen({super.key});
  @override
  Widget build(BuildContext context) => const Center(
    child: Text('បណ្តាញម្ហូប & កសិផលក្នុងស្រុក - ឥតគិតកម្រៃជើងសារ 0%'),
  );
}

// Module 3: Community TukTuk & Moto (Direct Fare to Driver)
class CommunityRideScreen extends StatelessWidget {
  const CommunityRideScreen({super.key});
  @override
  Widget build(BuildContext context) => const Center(
    child: Text('កង់បី & ម៉ូតូឌុបសហគមន៍ - ចំណូល ១០០% ទៅអ្នកបើកបរផ្ទាល់'),
  );
}

// Module 4: Universal GPS Tracking
class UniversalTrackingScreen extends StatelessWidget {
  const UniversalTrackingScreen({super.key});
  @override
  Widget build(BuildContext context) => const Center(
    child: Text('ប្រព័ន្ធតាមដានកញ្ចប់ឥវ៉ាន់ និងកាលវិភាគមកដល់ទូទាំង ២៥ ខេត្ត-ក្រុង'),
  );
}`,

    'pubspec.yaml': `name: cam_delivery_free
description: 100% Free & Independent Cambodia Logistics Platform (0% Fee, 25 Provinces, Bakong KHQR)
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  flutter_bloc: ^8.1.3
  google_fonts: ^6.1.0
  google_maps_flutter: ^2.5.3
  http: ^1.2.0
  cached_network_image: ^3.3.1
  intl: ^0.19.0
  url_launcher: ^6.2.5
  qr_flutter: ^4.1.0 # National Bank of Cambodia Bakong KHQR

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true
  assets:
    - assets/images/
    - assets/icons/`,

    'carrier_model.dart': `// lib/models/carrier_model.dart
// Independent Logistics Data Model for Cambodia

class CarrierQuote {
  final String carrierId;
  final String name;
  final String nameKm;
  final int priceKHR;
  final double priceUSD;
  final String transitTime;
  final bool supportsCOD;
  final String contactPhone;
  final bool isCommunityFree;

  CarrierQuote({
    required this.carrierId,
    required this.name,
    required this.nameKm,
    required this.priceKHR,
    required this.priceUSD,
    required this.transitTime,
    required this.supportsCOD,
    required this.contactPhone,
    this.isCommunityFree = true,
  });

  factory CarrierQuote.fromJson(Map<String, dynamic> json) {
    return CarrierQuote(
      carrierId: json['carrierId'] ?? '',
      name: json['name'] ?? '',
      nameKm: json['nameKm'] ?? '',
      priceKHR: json['priceKHR'] ?? 0,
      priceUSD: (json['priceUSD'] as num?)?.toDouble() ?? 0.0,
      transitTime: json['transitTime'] ?? '',
      supportsCOD: json['supportsCOD'] ?? true,
      contactPhone: json['contactPhone'] ?? '',
      isCommunityFree: json['isCommunityFree'] ?? true,
    );
  }
}`,

    'tracking_screen.dart': `// lib/screens/tracking_screen.dart
import 'package:flutter/material.dart';

class EstimatedSchedule {
  final String date;
  final String dateKm;
  final String timeWindow;
  final String timeWindowKm;
  final double transitHours;
  final String courierSpeedTier;

  EstimatedSchedule({
    required this.date,
    required this.dateKm,
    required this.timeWindow,
    required this.timeWindowKm,
    required this.transitHours,
    required this.courierSpeedTier,
  });

  // Calculate delivery date & time based on independent Cambodian courier type
  static EstimatedSchedule calculate(String carrierId, DateTime dispatchTime) {
    double hours;
    String tier;
    switch (carrierId) {
      case 'cam-van-express':
        hours = 6.5;
        tier = 'CamExpress Interprovincial Van (Same-Day Afternoon)';
        break;
      case 'cam-door-express':
        hours = 24.0;
        tier = 'CamDirect Door-to-Door Standard Dispatch';
        break;
      case 'cam-priority-express':
        hours = 20.0;
        tier = 'CamPriority Next-Morning Dispatch';
        break;
      case 'cam-cold-chain':
        hours = 8.0;
        tier = 'CamCold Chain Fresh Food Dispatch';
        break;
      case 'cam-postal-express':
        hours = 36.0;
        tier = 'CamPostal Regional Community Dispatch';
        break;
      default:
        hours = 28.0;
        tier = 'CamFreight Heavy Freight Logistics';
    }

    final arrival = dispatchTime.add(Duration(minutes: (hours * 60).round()));
    return EstimatedSchedule(
      date: '\${arrival.year}-\${arrival.month}-\${arrival.day}',
      dateKm: 'ថ្ងៃទី\${arrival.day} ខែ\${arrival.month} ឆ្នាំ\${arrival.year}',
      timeWindow: '\${arrival.hour}:00 - \${arrival.hour + 2}:00',
      timeWindowKm: 'ម៉ោង \${arrival.hour}:00 ដល់ \${arrival.hour + 2}:00',
      transitHours: hours,
      courierSpeedTier: tier,
    );
  }
}

class TrackingScreen extends StatefulWidget {
  final String trackingCode;
  final String carrierId;
  const TrackingScreen({
    super.key, 
    required this.trackingCode,
    this.carrierId = 'cam-van-express',
  });

  @override
  State<TrackingScreen> createState() => _TrackingScreenState();
}

class _TrackingScreenState extends State<TrackingScreen> {
  late EstimatedSchedule schedule;

  @override
  void initState() {
    super.initState();
    schedule = EstimatedSchedule.calculate(widget.carrierId, DateTime.now());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('កញ្ចប់លេខ #\${widget.trackingCode}')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Prominent Estimated Delivery Date & Time Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A), // Slate 900
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.timer, color: Color(0xFF059669), size: 18),
                      SizedBox(width: 8),
                      Text(
                        'កាលបរិច្ឆេទ & ពេលវេលាមកដល់ប៉ាន់ស្មាន',
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.08),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('កាលបរិច្ឆេទមកដល់', style: TextStyle(color: Colors.grey, fontSize: 11)),
                              const SizedBox(height: 4),
                              Text(schedule.dateKm, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.08),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('ចន្លោះម៉ោងដឹក', style: TextStyle(color: Colors.grey, fontSize: 11)),
                              const SizedBox(height: 4),
                              Text(schedule.timeWindowKm, style: const TextStyle(color: Colors.amber, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'ល្បឿនសេវា៖ \${schedule.courierSpeedTier} (~\${schedule.transitHours} ម៉ោង)',
                    style: const TextStyle(color: Colors.white70, fontSize: 11),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: const Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('ស្ថានភាព៖ កំពុងធ្វើដំណើរ', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.green)),
                      Text('ផ្លូវជាតិលេខ ៦', style: TextStyle(color: Colors.grey)),
                    ],
                  ),
                  Divider(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('ភ្នំពេញ ➔ សៀមរាប', style: TextStyle(fontWeight: FontWeight.bold)),
                      Text('CamExpress Van', style: TextStyle(color: Colors.blue, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}`,

    'banking_account_screen.dart': `// lib/screens/banking_account_screen.dart
// Customer & Provider Bank Accounts & Settlement Management (0% Fee)
import 'package:flutter/material.dart';

class BankAccountItem {
  final String id;
  final String bankName;
  final String accountNumber;
  final String accountHolder;
  final String currency;
  final bool isPrimary;
  final String bakongId;
  final Color bankColor;

  BankAccountItem({
    required this.id,
    required this.bankName,
    required this.accountNumber,
    required this.accountHolder,
    required this.currency,
    required this.isPrimary,
    required this.bakongId,
    required this.bankColor,
  });
}

class BankingAccountScreen extends StatefulWidget {
  final bool isProvider;
  const BankingAccountScreen({super.key, this.isProvider = false});

  @override
  State<BankingAccountScreen> createState() => _BankingAccountScreenState();
}

class _BankingAccountScreenState extends State<BankingAccountScreen> {
  final List<BankAccountItem> _accounts = [
    BankAccountItem(
      id: 'b1',
      bankName: 'ABA Bank',
      accountNumber: '001 234 567',
      accountHolder: 'SOK CHANRA',
      currency: 'KHR',
      isPrimary: true,
      bakongId: 'chanra.sok@abab',
      bankColor: const Color(0xFF004F98),
    ),
    BankAccountItem(
      id: 'b2',
      bankName: 'ACLEDA Bank Plc.',
      accountNumber: '010-888-999-1',
      accountHolder: 'SOK CHANRA',
      currency: 'USD',
      isPrimary: false,
      bakongId: '012345678@aclb',
      bankColor: const Color(0xFF0A2540),
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.isProvider 
          ? 'គណនីធនាគារទទួលប្រាក់ចំណូល (0% Fee)' 
          : 'គណនីធនាគារសម្រាប់ទូទាត់ (Customer Payment)'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Balance & 0% Fee Banner
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF0F172A),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Text('សមតុល្យដែលអាចប្រើបាន', style: TextStyle(color: Colors.white70, fontSize: 12)),
                    SizedBox(height: 4),
                    Text('520,000 ៛', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                    Text('គ្មានកាត់កម្រៃជើងសារ 0%', style: TextStyle(color: Color(0xFF34D399), fontSize: 11)),
                  ],
                ),
                ElevatedButton.icon(
                  onPressed: () {},
                  icon: const Icon(Icons.add_card, size: 16),
                  label: const Text('ភ្ជាប់ធនាគារ'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF059669),
                    foregroundColor: Colors.white,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          const Text('គណនីធនាគារដែលបានភ្ជាប់', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
          const SizedBox(height: 8),
          ..._accounts.map((acc) => Card(
            margin: const EdgeInsets.only(bottom: 12),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: BorderSide(color: acc.isPrimary ? const Color(0xFF059669) : Colors.grey.shade200, width: acc.isPrimary ? 2 : 1),
            ),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          CircleAvatar(
                            backgroundColor: acc.bankColor,
                            radius: 14,
                            child: Text(acc.bankName.substring(0, 1), style: const TextStyle(color: Colors.white, fontSize: 11)),
                          ),
                          const SizedBox(width: 8),
                          Text(acc.bankName, style: const TextStyle(fontWeight: FontWeight.bold)),
                        ],
                      ),
                      if (acc.isPrimary)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFF059669).withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Text('ចម្បង (Primary)', style: TextStyle(color: Color(0xFF059669), fontSize: 10, fontWeight: FontWeight.bold)),
                        ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(acc.accountNumber, style: const TextStyle(fontFamily: 'monospace', fontSize: 16, fontWeight: FontWeight.bold)),
                  Text(acc.accountHolder, style: const TextStyle(color: Colors.grey, fontSize: 12)),
                  const Divider(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Bakong ID: \${acc.bakongId}', style: const TextStyle(color: Colors.grey, fontSize: 11)),
                      Text(acc.currency, style: const TextStyle(fontWeight: FontWeight.bold)),
                    ],
                  ),
                ],
              ),
            ),
          )),
        ],
      ),
    );
  }
}`,
    'driver_chat.dart': `// =================================================================
// Driver & User Live Chat Interface - Flutter 3 Cross-Platform
// Real-time direct communication between receiver/sender & courier
// =================================================================

import 'package:flutter/material.dart';

class ChatMessageModel {
  final String id;
  final String sender; // 'user' | 'driver'
  final String text;
  final String timestamp;
  final bool isLocation;

  ChatMessageModel({
    required this.id,
    required this.sender,
    required this.text,
    required this.timestamp,
    this.isLocation = false,
  });
}

class DriverChatScreen extends StatefulWidget {
  final String trackingNumber;
  final String driverName;
  final String driverPhone;
  final String driverPlate;

  const DriverChatScreen({
    super.key,
    required this.trackingNumber,
    required this.driverName,
    required this.driverPhone,
    required this.driverPlate,
  });

  @override
  State<DriverChatScreen> createState() => _DriverChatScreenState();
}

class _DriverChatScreenState extends State<DriverChatScreen> {
  final TextEditingController _textController = TextEditingController();
  final List<ChatMessageModel> _messages = [
    ChatMessageModel(
      id: '1',
      sender: 'driver',
      text: 'ជម្រាបសួរអតិថិជន! ខ្ញុំកំពុងធ្វើដំណើរទៅកាន់ទីតាំងរបស់អ្នក។ ប្រសិនបើមានព័ត៌មានលម្អិត ឬទីតាំងជាក់លាក់ សូមផ្ញើមកទីនេះបានបាទ!',
      timestamp: '10:30 AM',
    ),
  ];

  final List<String> _quickPills = [
    '📍 ខ្ញុំនៅមុខផ្ទះហើយបង',
    '📞 មកដល់ជិតសូមខល',
    '💵 ត្រៀមលុយរួចរាល់',
    '⏳ នៅសល់ប៉ុន្មាននាទី?',
  ];

  void _sendMessage([String? presetText]) {
    final text = (presetText ?? _textController.text).trim();
    if (text.isEmpty) return;

    setState(() {
      _messages.add(ChatMessageModel(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        sender: 'user',
        text: text,
        timestamp: TimeOfDay.now().format(context),
      ));
    });
    _textController.clear();

    // Simulated driver response
    Future.delayed(const Duration(milliseconds: 1800), () {
      if (!mounted) return;
      setState(() {
        _messages.add(ChatMessageModel(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          sender: 'driver',
          text: 'បាទអរគុណបង! ខ្ញុំបានទទួលសារហើយ ខ្ញុំកំពុងជិះទៅកាន់ទីតាំងបង។',
          timestamp: TimeOfDay.now().format(context),
        ));
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.driverName, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            Text('\${widget.driverPlate} • #\${widget.trackingNumber}', style: const TextStyle(fontSize: 11, color: Colors.grey)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.phone, color: Color(0xFF059669)),
            onPressed: () {},
          ),
        ],
      ),
      body: Column(
        children: [
          // Quick pills
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(
              children: _quickPills.map((pill) => Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ActionChip(
                  label: Text(pill, style: const TextStyle(fontSize: 11)),
                  onPressed: () => _sendMessage(pill),
                ),
              )).toList(),
            ),
          ),
          // Chat messages list
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final msg = _messages[index];
                final isUser = msg.sender == 'user';
                return Align(
                  alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: isUser ? const Color(0xFF0F172A) : Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: isUser ? null : Border.all(color: Colors.grey.shade300),
                    ),
                    child: Text(
                      msg.text,
                      style: TextStyle(color: isUser ? Colors.white : Colors.black87, fontSize: 13),
                    ),
                  ),
                );
              },
            ),
          ),
          // Input bar
          Container(
            padding: const EdgeInsets.all(12),
            color: Colors.white,
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _textController,
                    decoration: const InputDecoration(
                      hintText: 'ផ្ញើសារទៅកាន់អ្នកដឹក...',
                      border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(24))),
                      contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.send, color: Color(0xFF059669)),
                  onPressed: () => _sendMessage(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(filesCode[activeFile]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Flutter Overview Card */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>{isKm ? 'រចនាសម្ព័ន្ធកូដ Flutter ឯករាជ្យ (Dart Source Code)' : 'Independent Flutter 3 (Dart) Code Architecture'}</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full">
                  100% Free
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                {isKm 
                  ? 'កូដពេញលេញសម្រាប់បង្កើតជាកម្មវិធីទូរស័ព្ទឯករាជ្យ iOS & Android ដោយគ្មានកាត់ថ្លៃសេវា'
                  : 'Ready-to-use Dart & Flutter source code for independent iOS and Android deployment'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? (isKm ? 'បានចម្លងកូដ!' : 'Copied!') : (isKm ? 'ចម្លងកូដ Dart' : 'Copy Code')}</span>
          </button>
        </div>

        {/* Free Platform Highlight Banner */}
        <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-900 font-medium">
          <HeartHandshake className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            {isKm 
              ? 'គំរូកូដនេះត្រូវបានបង្កើតឡើងសម្រាប់កម្មវិធីឯករាជ្យសុទ្ធសាធក្នុងប្រទេសកម្ពុជា ដោយមិនពឹងផ្អែកលើប្រព័ន្ធពាណិជ្ជកម្មខាងក្រៅណាមួយឡើយ។'
              : 'This template is tailored for an independent community delivery system in Cambodia with zero commercial affiliations.'}
          </span>
        </div>

        {/* Instructions */}
        <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
          <p className="font-semibold text-slate-800 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isKm ? 'របៀបដំណើរការក្នុង Flutter CLI' : 'How to run in your Flutter environment'}:</span>
          </p>
          <div className="font-mono text-[11px] bg-slate-900 text-slate-200 p-2.5 rounded-lg overflow-x-auto select-all">
            flutter create cam_delivery_free && cd cam_delivery_free && flutter pub get && flutter run
          </div>
        </div>

        {/* File Tabs */}
        <div className="flex items-center gap-1.5 mt-4 border-b border-slate-200 overflow-x-auto pb-2 scrollbar-none">
          {(Object.keys(filesCode) as Array<keyof typeof filesCode>).map((file) => (
            <button
              key={file}
              type="button"
              onClick={() => setActiveFile(file)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shrink-0 ${
                activeFile === file
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>{file}</span>
            </button>
          ))}
        </div>

        {/* Code Preview Viewer */}
        <div className="mt-3 rounded-xl bg-slate-950 text-slate-200 p-4 font-mono text-xs overflow-x-auto max-h-[500px] border border-slate-800 leading-relaxed">
          <pre>{filesCode[activeFile]}</pre>
        </div>
      </div>
    </div>
  );
};
