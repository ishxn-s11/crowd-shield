package com.crowdshield.mobile.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.crowdshield.mobile.ui.theme.*

// ─── Glass Card ───────────────────────────────────────────────
@Composable
fun GlassCard(
    modifier: Modifier = Modifier,
    padding: Dp = 16.dp,
    content: @Composable ColumnScope.() -> Unit,
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(CsGlass)
            .border(1.dp, CsGlassBorder, RoundedCornerShape(16.dp))
            .padding(padding),
        content = content,
    )
}

// ─── Risk Badge ───────────────────────────────────────────────
@Composable
fun RiskBadge(
    level: String,
    modifier: Modifier = Modifier,
    score: Double? = null,
    fontSize: Int = 10,
) {
    val color = riskColor(level)
    val bg = riskBgColor(level)
    Row(
        modifier = modifier
            .clip(RoundedCornerShape(999.dp))
            .background(bg)
            .border(1.dp, color.copy(alpha = 0.3f), RoundedCornerShape(999.dp))
            .padding(horizontal = 8.dp, vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        Box(
            modifier = Modifier
                .size(6.dp)
                .clip(CircleShape)
                .background(color)
        )
        Text(
            text = level,
            color = color,
            fontSize = fontSize.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 0.5.sp,
        )
        if (score != null) {
            Text(
                text = "${(score * 100).toInt()}%",
                color = color.copy(alpha = 0.7f),
                fontSize = (fontSize - 1).sp,
            )
        }
    }
}

// ─── Section Header ───────────────────────────────────────────
@Composable
fun SectionHeader(
    icon: ImageVector,
    title: String,
    modifier: Modifier = Modifier,
    action: @Composable (() -> Unit)? = null,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(bottom = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Row(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier
                    .size(28.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(CsRedLight),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = CsRed,
                    modifier = Modifier.size(14.dp),
                )
            }
            Text(
                text = title,
                color = CsText,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 0.3.sp,
            )
        }
        action?.invoke()
    }
}

// ─── Neon Button ──────────────────────────────────────────────
@Composable
fun CsButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    icon: ImageVector? = null,
    variant: ButtonVariant = ButtonVariant.Primary,
    enabled: Boolean = true,
) {
    val (bg, border, textColor) = when (variant) {
        ButtonVariant.Primary -> Triple(CsRed, CsRed, Color.White)
        ButtonVariant.Secondary -> Triple(Color.Transparent, CsGlassBorder, CsText)
        ButtonVariant.Danger -> Triple(Color(0xFF8B0000), Color(0x608B0000), Color.White)
    }

    Button(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier.height(40.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = bg,
            contentColor = textColor,
            disabledContainerColor = bg.copy(alpha = 0.4f),
        ),
        shape = RoundedCornerShape(12.dp),
        border = ButtonDefaults.outlinedButtonBorder(enabled).copy(
            brush = androidx.compose.ui.graphics.SolidColor(border),
            width = 1.dp,
        ),
        contentPadding = PaddingValues(horizontal = 16.dp),
    ) {
        if (icon != null) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                modifier = Modifier.size(16.dp),
                tint = textColor,
            )
            Spacer(modifier = Modifier.width(6.dp))
        }
        Text(
            text = text,
            fontWeight = FontWeight.Bold,
            fontSize = 12.sp,
            letterSpacing = 0.5.sp,
        )
    }
}

enum class ButtonVariant { Primary, Secondary, Danger }

// ─── Stat Card ────────────────────────────────────────────────
@Composable
fun StatCard(
    label: String,
    value: Any,
    icon: ImageVector? = null,
    color: Color = CsRed,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .background(CsGlass)
            .border(1.dp, CsGlassBorder, RoundedCornerShape(16.dp))
            .padding(12.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        if (icon != null) {
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(color.copy(alpha = 0.12f)),
                contentAlignment = Alignment.Center,
            ) {
                Icon(icon, contentDescription = null, tint = color, modifier = Modifier.size(16.dp))
            }
            Spacer(modifier = Modifier.height(4.dp))
        }
        Text(
            text = value.toString(),
            color = color,
            fontSize = 22.sp,
            fontWeight = FontWeight.ExtraBold,
        )
        Text(
            text = label,
            color = CsTextMuted,
            fontSize = 10.sp,
            letterSpacing = 0.5.sp,
        )
    }
}

// ─── Card Title ───────────────────────────────────────────────
@Composable
fun CardTitle(text: String, modifier: Modifier = Modifier) {
    Text(
        text = text,
        color = CsTextMuted,
        fontSize = 11.sp,
        fontWeight = FontWeight.Bold,
        letterSpacing = 1.sp,
        modifier = modifier.padding(bottom = 12.dp),
    )
}
