package com.crowdshield.mobile.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.crowdshield.mobile.ui.components.*
import com.crowdshield.mobile.ui.theme.*

data class IncidentData(val id: String, val type: String, val severity: String, val zone: String, val time: String, val status: String, val reported: String)

private val MOCK_INCIDENTS = listOf(
    IncidentData("INC-001", "Crowd Surge", "CRITICAL", "Central Plaza", "2 min ago", "active", "AI Detection"),
    IncidentData("INC-002", "Medical Emergency", "HIGH", "Food Court", "8 min ago", "responding", "Citizen Report"),
    IncidentData("INC-003", "Barrier Breach", "MODERATE", "North Gate", "15 min ago", "resolved", "CCTV AI"),
    IncidentData("INC-004", "Missing Person", "HIGH", "Stadium", "22 min ago", "active", "Citizen Report"),
    IncidentData("INC-005", "Suspicious Activity", "MODERATE", "East Wing", "35 min ago", "investigating", "CCTV AI"),
)

@Composable
fun IncidentsScreen() {
    var filter by remember { mutableStateOf("all") }
    val filtered = if (filter == "all") MOCK_INCIDENTS else MOCK_INCIDENTS.filter { it.status == filter }
    val statusColor: (String) -> Color = { s ->
        when (s) {
            "active" -> CsRed
            "responding" -> CsOrange
            "resolved" -> CsGreen
            else -> CsBeige
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(CsBg)
            .padding(16.dp),
    ) {
        SectionHeader(icon = Icons.Default.Warning, title = "INCIDENTS")

        // Filter pills
        Row(modifier = Modifier.horizontalScroll(rememberScrollState())) {
            listOf("all", "active", "responding", "investigating", "resolved").forEach { f ->
                Box(
                    modifier = Modifier
                        .padding(end = 8.dp)
                        .clip(RoundedCornerShape(999.dp))
                        .background(if (filter == f) CsRed.copy(alpha = 0.2f) else CsGlass)
                        .border(1.dp, if (filter == f) CsRed.copy(alpha = 0.4f) else CsGlassBorder, RoundedCornerShape(999.dp))
                        .clickable { filter = f }
                        .padding(horizontal = 16.dp, vertical = 8.dp)
                ) {
                    Text(f.uppercase(), color = if (filter == f) CsRed else CsTextMuted, fontSize = 10.sp, fontWeight = FontWeight.SemiBold, letterSpacing = 0.5.sp)
                }
            }
        }
        Spacer(modifier = Modifier.height(16.dp))

        // Incident list
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            filtered.forEach { inc ->
                GlassCard {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier.size(36.dp).clip(RoundedCornerShape(8.dp))
                                .background(statusColor(inc.status).copy(alpha = 0.12f)),
                            contentAlignment = Alignment.Center,
                        ) {
                            Icon(Icons.Default.Warning, contentDescription = null, tint = statusColor(inc.status), modifier = Modifier.size(18.dp))
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(inc.type, color = CsText, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                            Text("${inc.time} · ${inc.zone}", color = CsTextMuted, fontSize = 10.sp)
                        }
                        RiskBadge(inc.severity, fontSize = 9)
                    }
                    // Footer
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Radio, contentDescription = null, tint = statusColor(inc.status), modifier = Modifier.size(10.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(inc.status.uppercase(), color = statusColor(inc.status), fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.5.sp)
                        }
                        Text(inc.reported, color = CsTextDim, fontSize = 10.sp)
                    }
                }
            }
        }
    }
}
