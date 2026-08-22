package com.crowdshield.mobile.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.shape.CircleShape
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

data class CameraInfo(val id: String, val name: String, val zone: String, val online: Boolean)

private val CAMERAS = listOf(
    CameraInfo("CAM-01", "Main Entrance", "Entrance", true),
    CameraInfo("CAM-02", "North Corridor", "Corridor", true),
    CameraInfo("CAM-03", "Food Court", "Food Court", true),
    CameraInfo("CAM-04", "East Wing", "East Wing", false),
    CameraInfo("CAM-05", "Central Plaza", "Plaza", true),
    CameraInfo("CAM-06", "Stadium Gate", "Stadium", true),
)

@Composable
fun CamerasScreen() {
    var state by remember { mutableStateOf<RiskState?>(null) }
    LaunchedEffect(Unit) {
        while (isActive) {
            try { state = RetrofitClient.api.getRiskLive() } catch (_: Exception) {}
            delay(5000)
        }
    }
    val zones = state?.zones ?: emptyMap()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(CsBg)
            .padding(16.dp)
    ) {
        SectionHeader(icon = Icons.Default.Videocam, title = "CCTV CAMERAS")

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            // Online count
            GlassCard(modifier = Modifier.weight(1f), padding = 12.dp) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                    Text("${CAMERAS.count { it.online }}", color = CsGreen, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold)
                    Text("Online", color = CsTextMuted, fontSize = 10.sp, modifier = Modifier.padding(top = 2.dp))
                }
            }
            GlassCard(modifier = Modifier.weight(1f), padding = 12.dp) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                    Text("${CAMERAS.count { !it.online }}", color = Color(0xFFFF4444), fontSize = 22.sp, fontWeight = FontWeight.ExtraBold)
                    Text("Offline", color = CsTextMuted, fontSize = 10.sp, modifier = Modifier.padding(top = 2.dp))
                }
            }
            GlassCard(modifier = Modifier.weight(1f), padding = 12.dp) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                    Text("${CAMERAS.size}", color = CsBeige, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold)
                    Text("Total", color = CsTextMuted, fontSize = 10.sp, modifier = Modifier.padding(top = 2.dp))
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Camera Grid
        LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            items(CAMERAS) { cam ->
                val zd = zones.values.find { z -> z.name.contains(cam.zone, ignoreCase = true) }
                GlassCard(padding = 0.dp) {
                    // Camera preview placeholder
                    Box(
                        modifier = Modifier.fillMaxWidth().height(120.dp)
                            .clip(RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp))
                            .background(CsSurfaceLight),
                    ) {
                        // Top bar
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(8.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(cam.id, color = CsText, fontSize = 10.sp, fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace,
                                modifier = Modifier.clip(RoundedCornerShape(4.dp))
                                    .background(Color.Black.copy(alpha = 0.5f))
                                    .padding(horizontal = 6.dp, vertical = 2.dp))
                            Box(modifier = Modifier.size(8.dp).clip(CircleShape)
                                .background(if (cam.online) CsGreen else Color(0xFFFF4444)))
                        }
                        // Camera icon
                        Column(
                            modifier = Modifier.fillMaxSize(),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center,
                        ) {
                            Icon(
                                if (cam.online) Icons.Default.Videocam else Icons.Default.VideocamOff,
                                contentDescription = null,
                                tint = CsTextDim, modifier = Modifier.size(32.dp),
                            )
                        }
                        // Live badge
                        if (cam.online) {
                            Row(
                                modifier = Modifier.align(Alignment.TopEnd).padding(8.dp)
                                    .clip(RoundedCornerShape(4.dp))
                                    .background(CsRed.copy(alpha = 0.8f))
                                    .padding(horizontal = 6.dp, vertical = 2.dp),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Box(modifier = Modifier.size(6.dp).clip(CircleShape).background(Color(0xFFFF4444)))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("LIVE", color = Color.White, fontSize = 9.sp, fontWeight = FontWeight.ExtraBold, letterSpacing = 1.sp)
                            }
                        }
                    }
                    // Info
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text(cam.name, color = CsText, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                        Text(cam.zone, color = CsTextMuted, fontSize = 10.sp)
                        if (zd != null) {
                            Spacer(modifier = Modifier.height(4.dp))
                            RiskBadge(zd.risk_level, fontSize = 9)
                        }
                    }
                }
            }
        }
    }
}
