package com.crowdshield.mobile.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.crowdshield.mobile.data.api.RetrofitClient
import com.crowdshield.mobile.data.model.*
import com.crowdshield.mobile.ui.components.*
import com.crowdshield.mobile.ui.theme.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive

data class VenueZone(val id: String, val name: String, val cx: Float, val cy: Float, val w: Float, val h: Float, val gates: List<String>)

private val VENUE_ZONES = listOf(
    VenueZone("Z1", "Main Entrance", 0.45f, 0.1f, 0.2f, 0.1f, listOf("G1", "G2")),
    VenueZone("Z2", "North Corridor", 0.45f, 0.22f, 0.4f, 0.08f, listOf("G3")),
    VenueZone("Z3", "Food Court", 0.17f, 0.35f, 0.2f, 0.12f, emptyList()),
    VenueZone("Z4", "East Wing", 0.78f, 0.35f, 0.25f, 0.15f, listOf("G4")),
    VenueZone("Z5", "Central Plaza", 0.45f, 0.5f, 0.25f, 0.18f, listOf("G5")),
    VenueZone("Z6", "Stadium", 0.5f, 0.78f, 0.35f, 0.18f, listOf("G6", "G7")),
    VenueZone("Z7", "Parking Area", 0.12f, 0.72f, 0.18f, 0.2f, listOf("G8")),
)

@Composable
fun ZonesScreen() {
    var state by remember { mutableStateOf<RiskState?>(null) }
    var selected by remember { mutableStateOf("Z5") }
    val zones = state?.zones ?: emptyMap()

    LaunchedEffect(Unit) {
        while (isActive) {
            try { state = RetrofitClient.api.getRiskLive() } catch (_: Exception) {}
            delay(5000)
        }
    }

    val sel = zones[selected]
    val rc: (String) -> Color = { riskColor(it) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(CsBg)
            .verticalScroll(rememberScrollState())
    ) {
        // Digital Twin Card
        GlassCard(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Text("VENUE DIGITAL TWIN", color = CsTextMuted, fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                Text("● LIVE", color = CsGreen, fontSize = 10.sp, fontWeight = FontWeight.SemiBold)
            }
            Spacer(modifier = Modifier.height(12.dp))

            // Venue map
            Box(
                modifier = Modifier.fillMaxWidth().aspectRatio(1.2f)
                    .clip(RoundedCornerShape(8.dp))
                    .border(1.dp, CsGlassBorder, RoundedCornerShape(8.dp))
            ) {
                // Zone blocks
                VENUE_ZONES.forEach { z ->
                    val data = zones[z.id]
                    val isActive = selected == z.id
                    val color = rc(data?.risk_level ?: "LOW")
                    Box(
                        modifier = Modifier
                            .fillMaxWidth(z.w)
                            .aspectRatio(z.w / z.h)
                            .offset(
                                x = with(LocalDensity.current) { ((z.cx - z.w / 2) * 360).toDp() },
                                y = with(LocalDensity.current) { ((z.cy - z.h / 2) * 360).toDp() },
                            )
                            .clip(RoundedCornerShape(6.dp))
                            .background(Color.White.copy(alpha = 0.02f))
                            .border(
                                if (isActive) 2.dp else 1.dp,
                                color.copy(alpha = if (isActive) 1f else 0.6f),
                                RoundedCornerShape(6.dp)
                            )
                            .clickable { selected = z.id },
                        contentAlignment = Alignment.Center,
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(z.name, color = color.copy(alpha = if (isActive) 1f else 0.6f),
                                fontSize = 7.sp, fontWeight = FontWeight.SemiBold, maxLines = 1)
                            Text(
                                "${data?.risk_score?.toInt() ?: "—"}",
                                color = color.copy(alpha = if (isActive) 1f else 0.6f),
                                fontSize = 12.sp, fontWeight = FontWeight.ExtraBold,
                            )
                            Text("${data?.person_count ?: 0}", color = CsTextMuted, fontSize = 6.sp)
                        }
                    }
                }
            }
        }

        // Zone Details
        if (sel != null) {
            GlassCard(modifier = Modifier.padding(12.dp)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    Text(sel.name.ifEmpty { selected }, color = CsText, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                    RiskBadge(sel.risk_level)
                }
                Spacer(modifier = Modifier.height(16.dp))
                listOf(
                    Triple("Risk Score", "${sel.risk_score.toInt()}", rc(sel.risk_level)),
                    Triple("People", "${sel.person_count}", CsBeige),
                    Triple("Density", "${sel.density} p/m²", CsBeige),
                    Triple("Velocity", "${sel.avg_velocity} m/s", CsGreen),
                    Triple("Flow Conflict", "${(sel.flow_conflict * 100).toInt()}%", CsOrange),
                    Triple("Bottleneck", "${(sel.bottleneck_score * 100).toInt()}%", CsCritical),
                ).chunked(2).forEach { row ->
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        row.forEach { (label, value, color) ->
                            GlassCard(modifier = Modifier.weight(1f), padding = 12.dp) {
                                Text(label, color = CsTextMuted, fontSize = 9.sp)
                                Text(value, color = color, fontSize = 18.sp, fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(top = 4.dp))
                            }
                        }
                    }
                }
            }
        }

        // All Zones List
        GlassCard(modifier = Modifier.padding(12.dp)) {
            CardTitle("ALL ZONES")
            zones.forEach { (zid, z) ->
                val zc = riskColor(z.risk_level)
                Row(
                    modifier = Modifier.fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(if (selected == zid) CsRed.copy(alpha = 0.08f) else Color.Transparent)
                        .clickable { selected = zid }
                        .padding(vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Box(modifier = Modifier.size(8.dp).clip(RoundedCornerShape(4.dp)).background(zc))
                    Spacer(modifier = Modifier.width(10.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(z.name.ifEmpty { zid }, color = CsText, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                        Text("${z.person_count} people · ${z.density} p/m²", color = CsTextMuted, fontSize = 10.sp)
                    }
                    Text("${z.risk_score.toInt()}", color = zc, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                }
                HorizontalDivider(color = CsGlassBorder)
            }
        }

        Spacer(modifier = Modifier.height(16.dp))
    }
}
