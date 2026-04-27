import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';

class ShimmerLoader extends StatelessWidget {
  final double width;
  final double height;
  final double borderRadius;

  const ShimmerLoader({
    super.key,
    required this.width,
    required this.height,
    this.borderRadius = 8.0,
  });

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: Colors.grey[300]!,
      highlightColor: Colors.grey[100]!,
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(borderRadius),
        ),
      ),
    );
  }
}

class DashboardShimmer extends StatelessWidget {
  const DashboardShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const ShimmerLoader(width: 150, height: 24, borderRadius: 4),
          const SizedBox(height: 20),
          Row(
            children: [
                Expanded(child: const ShimmerLoader(width: double.infinity, height: 100)),
                const SizedBox(width: 10),
                Expanded(child: const ShimmerLoader(width: double.infinity, height: 100)),
            ],
          ),
          const SizedBox(height: 20),
          const ShimmerLoader(width: 100, height: 24, borderRadius: 4),
          const SizedBox(height: 10),
          ListView.builder(
            shrinkWrap: true,
            itemCount: 3,
            itemBuilder: (context, index) {
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 8.0),
                child: const ShimmerLoader(width: double.infinity, height: 70),
              );
            },
          ),
        ],
      ),
    );
  }
}
