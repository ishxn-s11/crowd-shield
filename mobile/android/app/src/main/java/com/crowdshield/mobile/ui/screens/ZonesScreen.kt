package com.crowdshield.mobile.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.crowdshield.mobile.ui.theme.*
import kotlinx.coroutines.delay

// Zone data with positions (relative 0-1 coords for canvas)
data class ZoneData(
    val id: String, val name: String,
    val x: Float, val y: Float, val w: Float, val h: Float,
    val gates: List<String> = emptyList(),
    var riskScore: Int = 0, var riskLevel: String = "LOW",
    var personCount: Int = 0, var density: Float = 0f,
)

private val ZONES = listOf(
    ZoneData("Z1", "Main Entrance", 0.35f, 0.02f, 0.30f, 0.12f, listOf("G1", "G2")),
    ZoneData("Z2", "North Corridor", 0.25f, 0.16f, 0.50f, 0.10f, listOf("G3")),
    ZoneData("Z3", "Food Court", 0.05f, 0.28f, 0.25f, 0.15f),
    ZoneData("Z4", "East Wing", 0.70f, 0.28f, 0.25f, 0.15f, listOf("G4")),
    ZoneData("Z5", "Central Plaza", 0.25f, 0.45f, 0.50f, 0.18f, listOf("G5")),
    ZoneData("Z6", "Stadium", 0.20f, 0.68f, 0.60f, 0.20f, listOf("G6", "G7")),
    ZoneData("Z7", "Parking Area", 0.02f, 0.90f, 0.30f, 0.10f, listOf("G8")),
)

private fun riskColor(level: String): Color = when(level) {
    "CRITICAL" -> CsRed
    "HIGH" -> CsOrange
    "MODERATE" -> CsBeige
    else -> CsGreen
}

@Composable
fun ZonesScreen() {
    val zones = remember { mutableStateListOf<ZoneData>().apply { addAll(ZONES) } }
    var selectedZone by remember { mutableStateOf<String?>(null) }

    // Simulate live data
    LaunchedEffect(Unit) {
        while (true) {
            delay(5000)
            zones.forEachIndexed { i, z ->
                val base = when(z.id) {
                    "Z5" -> 65; "Z6" -> 40; "Z4" -> 50; "Z2" -> 35
                    else -> 20
                }
                z.riskScore = (base + (-5..10).random()).coerceIn(5, 100)
                z.riskLevel = when {
                    z.riskScore >= 75 -> "CRITICAL"
                    z.riskScore >= 50 -> "HIGH"
                    z.riskScore >= 25 -> "MODERATE"
                    else -> "LOW"
                }
                z.personCount = (100..900).random()
                z.density = z.personCount.toFloat() / 1000f
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Live badge
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Venue Digital Twin", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = CsText)
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(modifier = Modifier.size(6.dp).clip(CircleShape).background(CsGreen))
                Spacer(modifier = Modifier.width(4.dp))
                Text("LIVE", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = CsGreen)
            }
        }

        // Digital Twin Canvas
        Card(
            modifier = Modifier.fillMaxWidth().height(300.dp),
            colors = CardDefaults.cardColors(containerColor = CsSurface),
            shape = RoundedCornerShape(12.dp),
        ) {
            Canvas(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(8.dp)
                    .clickable { selectedZone = null }
            ) {
                val canvasW = size.width
                val canvasH = size.height

                zones.forEach { zone ->
                    val color = riskColor(zone.riskLevel)
                    val x = zone.x * canvasW
                    val y = zone.y * canvasH
                    val w = zone.w * canvasW
                    val h = zone.h * canvasH
                    val isSelected = selectedZone == zone.id

                    // Zone background with alpha based on risk
                    val alpha = 0.15f + (zone.riskScore / 100f) * 0.35f
                    drawRect(
                        color = color.copy(alpha = alpha),
                        topLeft = Offset(x, y),
                        size = Size(w, h),
                    )

                    // Zone border
                    drawRect(
                        color = color.copy(alpha = if (isSelected) 1f else 0.6f),
                        topLeft = Offset(x, y),
                        size = Size(w, h),
                        style = Stroke(width = if (isSelected) 4f else 2f),
                    )

                    // Gate markers
                    zone.gates.forEachIndexed { gi, gate ->
                        val gx = x + (gi + 1) * (w / (zone.gates.size + 1))
                        val gy = y - 8f
                        drawCircle(
                            color = CsRed,
                            radius = 6f,
                            center = Offset(gx, gy)
                        )
                    }
                }

                // Connection lines between zones
                val lineColor = Color.White.copy(alpha = 0.1f)
                for (i in 0 until zones.size - 1) {
                    val z1 = zones[i]
                    val z2 = zones[i + 1]
                    drawLine(
                        color = lineColor,
                        start = Offset((z1.x + z1.w / 2) * canvasW, (z1.y + z1.h / 2) * canvasH),
                        end = Offset((z2.x + z2.w / 2) * canvasW, (z2.y + z2.h / 2) * canvasH),
                        strokeWidth = 1f,
                    )
                }
            }
        }

        // Zone cards (2-column grid)
        Text("All Zones", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = CsTextMuted, letterSpacing = 1.sp)
        zones.chunked(2).forEach { row ->
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                row.forEach { zone ->
                    val color = riskColor(zone.riskLevel)
                    val isSelected = selectedZone == zone.id
                    Card(
                        modifier = Modifier.weight(1f).clickable { selectedZone = zone.id },
                        colors = CardDefaults.cardColors(
                            containerColor = if (isSelected) color.copy(alpha = 0.1f) else CsSurface
                        ),
                        shape = RoundedCornerShape(8.dp),
                        border = if (isSelected) androidx.compose.foundation.BorderStroke(1.dp, color) else null,
                    ) {
                        Column(modifier = Modifier.padding(10.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Text(zone.name, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = CsText)
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(4.dp))
                                        .background(color.copy(alpha = 0.15f))
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text("${zone.riskScore}", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = color)
                                }
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("${zone.personCount} people · ${String.format("%.1f", zone.density)} p/m²", fontSize = 10.sp, color = CsTextMuted)
                            if (zone.gates.isNotEmpty()) {
                                Text("Gates: ${zone.gates.joinToString(", ")}", fontSize = 9.sp, color = CsTextMuted.copy(alpha = 0.7f))
                            }
                        }
                    }
                }
            }
        }

        // Selected zone details
        selectedZone?.let { sid ->
            val zone = zones.find { it.id == sid }
            if (zone != null) {
                val color = riskColor(zone.riskLevel)
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = CsSurface),
                    shape = RoundedCornerShape(12.dp),
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(zone.name, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = CsText)
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(color.copy(alpha = 0.15f))
                                    .padding(horizontal = 10.dp, vertical = 4.dp)
                            ) {
                                Text(zone.riskLevel, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = color)
                            }
                        }
                        Spacer(modifier = Modifier.height(12.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                        ) {
                            MetricCard("Risk", "${zone.riskScore}", color, Modifier.weight(1f))
                            MetricCard("People", "${zone.personCount}", CsRed, Modifier.weight(1f))
                            MetricCard("Density", String.format("%.1f", zone.density), CsBeige, Modifier.weight(1f))
                            MetricCard("ID", zone.id, CsTextMuted, Modifier.weight(1f))
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))
    }
}

@Composable
private fun MetricCard(label: String, value: String, color: Color, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = CsBg),
        shape = RoundedCornerShape(6.dp),
    ) {
        Column(modifier = Modifier.padding(8.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(label, fontSize = 9.sp, color = CsTextMuted)
            Spacer(modifier = Modifier.height(4.dp))
            Text(value, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = color)
        }
    }
}
