package com.crowdshield.mobile.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.crowdshield.mobile.data.api.RetrofitClient
import com.crowdshield.mobile.data.model.*
import com.crowdshield.mobile.ui.components.*
import com.crowdshield.mobile.ui.theme.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

@Composable
fun AlertsScreen() {
    var alerts by remember { mutableStateOf<List<Alert>>(emptyList()) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        while (isActive) {
            try { alerts = RetrofitClient.api.getActiveAlerts() } catch (_: Exception) {}
            delay(5000)
        }
    }

    fun elapsed(createdAt: String): String {
        val diff = (System.currentTimeMillis() - try {
            java.time.Instant.parse(createdAt).toEpochMilli()
        } catch (_: Exception) { System.currentTimeMillis() }) / 1000
        return if (diff < 60) "${diff}s" else "${diff / 60}m ${diff % 60}s"
    }

    Column(modifier = Modifier.fillMaxSize().background(CsBg)) {
        // Header
        Row(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("Alert Center", color = CsText, fontSize = 20.sp, fontWeight = FontWeight.ExtraBold)
            if (alerts.isEmpty()) {
                Text("All Clear", color = CsGreen, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
            }
        }

        if (alerts.isEmpty()) {
            Column(
                modifier = Modifier.fillMaxSize(),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
            ) {
                Icon(Icons.Default.Notifications, contentDescription = null, tint = CsGreen, modifier = Modifier.size(48.dp))
                Spacer(modifier = Modifier.height(12.dp))
                Text("No active alerts", color = CsGreen, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                Text("All zones operating within safe parameters", color = CsTextMuted, fontSize = 13.sp)
            }
        } else {
            LazyColumn(contentPadding = PaddingValues(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(alerts) { a ->
                    val borderColor = if (a.severity == "CRITICAL") CsCritical else CsOrange
                    val progress = try {
                        val ms = System.currentTimeMillis() - java.time.Instant.parse(a.created_at).toEpochMilli()
                        (ms / 300000.0).coerceIn(0.0, 1.0)
                    } catch (_: Exception) { 0.0 }

                    GlassCard {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier.clip(RoundedCornerShape(3.dp))
                                    .background(CsSurfaceLight)
                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                            ) {
                                Text(a.severity, color = borderColor, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(a.title, color = CsText, fontSize = 12.sp, fontWeight = FontWeight.SemiBold,
                                maxLines = 1, modifier = Modifier.weight(1f))
                            Text(elapsed(a.created_at), color = CsTextMuted, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                            IconButton(onClick = {
                                alerts = alerts.filter { it.id != a.id }
                                scope.launch { try { RetrofitClient.api.acknowledgeAlert(a.id) } catch (_: Exception) {} }
                            }, modifier = Modifier.size(24.dp)) {
                                Icon(Icons.Default.Close, contentDescription = "Dismiss", tint = CsTextMuted, modifier = Modifier.size(14.dp))
                            }
                        }
                        Text("${a.zone_id} -- ${a.message}", color = CsTextDim, fontSize = 11.sp, modifier = Modifier.padding(top = 6.dp))
                        LinearProgressIndicator(
                            progress = { progress.toFloat() },
                            modifier = Modifier.fillMaxWidth().padding(top = 8.dp).height(2.dp).clip(RoundedCornerShape(1.dp)),
                            color = CsOrange,
                            trackColor = Color.White.copy(alpha = 0.05f),
                        )
                    }
                }
            }
        }
    }
}
