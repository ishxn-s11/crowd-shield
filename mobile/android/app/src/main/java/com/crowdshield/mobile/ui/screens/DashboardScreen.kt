package com.crowdshield.mobile.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.crowdshield.mobile.data.api.RetrofitClient
import com.crowdshield.mobile.data.model.*
import com.crowdshield.mobile.ui.components.*
import com.crowdshield.mobile.ui.theme.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive

@Composable
fun DashboardScreen(onNavigateToAlerts: () -> Unit = {}, onNavigateToZones: () -> Unit = {}) {
    var state by remember { mutableStateOf<RiskState?>(null) }
    var alerts by remember { mutableStateOf<List<Alert>>(emptyList()) }
    var refreshing by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        while (isActive) {
            try {
                state = RetrofitClient.api.getRiskLive()
                alerts = RetrofitClient.api.getActiveAlerts()
            } catch (_: Exception) {}
            delay(5000)
        }
    }

    val risk = state?.overall_risk ?: 0.0
    val riskLevel = state?.overall_risk_level ?: "LOW"
    val zones = state?.zones ?: emptyMap()
    val rc = riskColor(riskLevel)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(CsBg)
            .verticalScroll(rememberScrollState())
    ) {
        // Risk Gauge Card
        GlassCard(modifier = Modifier.padding(12.dp)) {
            CardTitle("OVERALL RISK SCORE")
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier.size(90.dp)
                        .clip(CircleShape)
                        .border(4.dp, Color.White.copy(alpha = 0.08f), CircleShape),
                    contentAlignment = Alignment.Center,
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("${risk.toInt()}", color = rc, fontSize = 28.sp, fontWeight = FontWeight.ExtraBold)
                        Text(riskLevel, color = rc, fontSize = 10.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
                Spacer(modifier = Modifier.width(16.dp))
                Text(
                    when (riskLevel) {
                        "CRITICAL" -> "Immediate action required."
                        "HIGH" -> "Heightened alert. Several zones approaching critical thresholds."
                        "MODERATE" -> "Monitoring elevated conditions."
                        else -> "All zones within safe operating parameters."
                    },
                    color = CsTextDim, fontSize = 12.sp, lineHeight = 18.sp,
                    modifier = Modifier.weight(1f),
                )
            }
        }

        // Zone Risk Levels
        GlassCard(modifier = Modifier.padding(12.dp)) {
            CardTitle("ZONE RISK LEVELS")
            zones.entries.chunked(2).forEach { row ->
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    row.forEach { (zid, z) ->
                        val zc = riskColor(z.risk_level)
                        GlassCard(
                            modifier = Modifier.weight(1f).clickable { onNavigateToZones() },
                            padding = 12.dp,
                        ) {
                            Text(z.name.ifEmpty { zid }, color = CsTextDim, fontSize = 11.sp)
                            Text("${z.risk_score.toInt()}", color = zc, fontSize = 20.sp, fontWeight = FontWeight.ExtraBold)
                            Text("${z.person_count} people", color = CsTextMuted, fontSize = 10.sp)
                        }
                    }
                    // Fill empty slot
                    if (row.size < 2) {
                        Spacer(modifier = Modifier.weight(1f))
                    }
                }
                Spacer(modifier = Modifier.height(8.dp))
            }
        }

        // Active Alerts
        GlassCard(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                CardTitle("ACTIVE ALERTS")
                Text("View all →", color = CsRed, fontSize = 12.sp, fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.clickable { onNavigateToAlerts() })
            }
            if (alerts.isEmpty()) {
                Column(
                    modifier = Modifier.fillMaxWidth().padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Icon(Icons.Default.Notifications, contentDescription = null, tint = CsGreen, modifier = Modifier.size(32.dp))
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("No active alerts", color = CsTextMuted, fontSize = 12.sp)
                }
            } else {
                alerts.take(3).forEach { a ->
                    val borderColor = if (a.severity == "CRITICAL") CsCritical else CsOrange
                    Row(
                        modifier = Modifier.fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(CsSurfaceLight)
                            .border(1.dp, CsGlassBorder, RoundedCornerShape(8.dp))
                            .padding(12.dp),
                    ) {
                        Box(
                            modifier = Modifier
                                .width(3.dp)
                                .height(40.dp)
                                .clip(RoundedCornerShape(2.dp))
                                .background(borderColor)
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    a.severity,
                                    color = borderColor,
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold,
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(a.title, color = CsText, fontSize = 12.sp, fontWeight = FontWeight.SemiBold,
                                    maxLines = 1, modifier = Modifier.weight(1f))
                            }
                            Text("${a.zone_id} — ${a.message}", color = CsTextDim, fontSize = 11.sp, modifier = Modifier.padding(top = 4.dp))
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                }
            }
        }

        // Status Overview
        GlassCard(modifier = Modifier.padding(12.dp)) {
            CardTitle("STATUS OVERVIEW")
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                val totalPeople = zones.values.sumOf { it.person_count }
                StatCard("Zones", zones.size, Icons.Default.Map, CsRed, Modifier.weight(1f))
                StatCard("Alerts", alerts.size, Icons.Default.Notifications,
                    if (alerts.isNotEmpty()) CsCritical else CsGreen, Modifier.weight(1f))
                StatCard("Crowd", totalPeople, Icons.Default.People, CsBeige, Modifier.weight(1f))
                StatCard("Risk", riskLevel, Icons.Default.Shield, rc, Modifier.weight(1f))
            }
        }

        Spacer(modifier = Modifier.height(16.dp))
    }
}
