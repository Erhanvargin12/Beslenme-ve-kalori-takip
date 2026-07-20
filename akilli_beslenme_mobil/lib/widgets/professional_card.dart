import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

class ProfessionalCard extends StatelessWidget {
  final Widget child;
  final String? title;
  final EdgeInsets? padding;
  final List<Widget>? actions;
  final bool animated;

  const ProfessionalCard({
    super.key,
    required this.child,
    this.title,
    this.padding,
    this.actions,
    this.animated = true,
  });

  @override
  Widget build(BuildContext context) {
    var content = Container(
      padding: padding ?? const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF6366F1).withValues(alpha: 0.04),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 5,
            offset: const Offset(0, 2),
          ),
        ],
        border: Border.all(color: const Color(0xFFE2E8F0), width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          if (title != null) ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    title!,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF1E293B),
                    ),
                  ),
                ),
                if (actions != null) Row(children: actions!),
              ],
            ),
            const SizedBox(height: 16),
          ],
          child,
        ],
      ),
    );

    if (animated) {
      return content.animate().fadeIn(duration: 400.ms).slideY(begin: 0.1, end: 0, curve: Curves.easeOut);
    }
    return content;
  }
}
