package com.crowdshield.mobile.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary = CsRed,
    onPrimary = CsText,
    primaryContainer = CsRedLight,
    secondary = CsBeige,
    onSecondary = CsText,
    secondaryContainer = CsBeigeLight,
    tertiary = CsGreen,
    background = CsBg,
    onBackground = CsText,
    surface = CsSurface,
    onSurface = CsText,
    surfaceVariant = CsSurfaceLight,
    onSurfaceVariant = CsTextMuted,
    outline = CsGlassBorder,
    error = CsCritical,
)

@Composable
fun CrowdShieldTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        typography = CsTypography,
        content = content,
    )
}
