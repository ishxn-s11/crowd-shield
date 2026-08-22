package com.crowdshield.mobile.ui.theme

import androidx.compose.ui.graphics.Color

// ─── CrowdShield Brand Colors ─────────────────────────────────
val CsRed = Color(0xFFC50022)
val CsRedLight = Color(0x20C50022)
val CsRedGlow = Color(0x40C50022)
val CsRedDim = Color(0x60C50022)

val CsBg = Color(0xFF0A0A0F)
val CsSurface = Color(0xFF12121A)
val CsSurfaceLight = Color(0xFF1A1A25)

val CsText = Color(0xFFE8E4DD)
val CsTextMuted = Color(0xFF8A8580)
val CsTextDim = Color(0xFF5A5550)

val CsGreen = Color(0xFF5CB85C)
val CsGreenLight = Color(0x205CB85C)
val CsOrange = Color(0xFFF0AD4E)
val CsOrangeLight = Color(0x20F0AD4E)
val CsBeige = Color(0xFFB5AC8A)
val CsBeigeLight = Color(0x20B5AC8A)

val CsGlass = Color(0xD912121A)
val CsGlassBorder = Color(0x1EB5AC8A)

val CsCritical = CsRed

// ─── Risk Level Colors ────────────────────────────────────────
fun riskColor(level: String): Color = when (level) {
    "CRITICAL" -> CsRed
    "HIGH" -> CsOrange
    "MODERATE" -> CsOrange
    "LOW" -> CsGreen
    else -> CsGreen
}

fun riskBgColor(level: String): Color = when (level) {
    "CRITICAL" -> CsRedLight
    "HIGH" -> CsOrangeLight
    "MODERATE" -> CsOrangeLight
    "LOW" -> CsGreenLight
    else -> CsGreenLight
}
