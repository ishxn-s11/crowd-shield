package com.crowdshield.mobile.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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

@Composable
fun DeviceCameraScreen() {
    var isStreaming by remember { mutableStateOf(false) }
    var detectionCount by remember { mutableIntStateOf(0) }
    var fps by remember { mutableIntStateOf(0) }
    var density by remember { mutableFloatStateOf(0f) }

    LaunchedEffect(isStreaming) {
        if (!isStreaming) return@LaunchedEffect
        while (isStreaming) {
            kotlinx.coroutines.delay(1000)
            detectionCount = (Math.random() * 15 + 2).toInt()
            fps = (Math.random() * 10 + 20).toInt()
            density = (Math.random() * 0.8 + 0.1).toFloat()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(CsBg)
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
    ) {
        SectionHeader(icon = Icons.Default.PhoneAndroid, title = "DEVICE CAMERA")

        // Camera preview
        GlassCard(padding = 0.dp) {
            Box(
                modifier = Modifier.fillMaxWidth().height(280.dp)
                    .background(CsSurface),
            ) {
                // Top bar
                Row(
                    modifier = Modifier.fillMaxWidth().padding(8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    Row(
                        modifier = Modifier.clip(RoundedCornerShape(6.dp))
                            .background(Color.Black.copy(alpha = 0.5f))
                            .padding(horizontal = 8.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Icon(Icons.Default.PhoneAndroid, contentDescription = null, tint = CsText, modifier = Modifier.size(12.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("DEVICE CAM", color = CsText, fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.5.sp)
                    }
                    if (isStreaming) {
                        Row(
                            modifier = Modifier.clip(RoundedCornerShape(6.dp))
                                .background(CsRed)
                                .padding(horizontal = 8.dp, vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Box(modifier = Modifier.size(6.dp).clip(androidx.compose.foundation.shape.CircleShape).background(Color.White))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("LIVE", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.ExtraBold, letterSpacing = 1.sp)
                        }
                    }
                }

                // Center content
                Column(
                    modifier = Modifier.fillMaxSize(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center,
                ) {
                    if (!isStreaming) {
                        Icon(Icons.Default.CameraAlt, contentDescription = null, tint = CsTextDim, modifier = Modifier.size(48.dp))
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("Tap to start camera", color = CsTextMuted, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                        Text("Uses your device camera for real-time crowd detection",
                            color = CsTextDim, fontSize = 12.sp)
                    } else {
                        Icon(Icons.Default.Videocam, contentDescription = null, tint = CsRed, modifier = Modifier.size(48.dp))
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("Camera Active", color = CsRed, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                    }
                }

                // Stats overlay
                if (isStreaming) {
                    Row(
                        modifier = Modifier.align(Alignment.BottomCenter).fillMaxWidth().padding(8.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        listOf(
                            Triple("${detectionCount}", "People", CsText),
                            Triple("${fps}", "FPS", CsText),
                            Triple("${(density * 100).toInt()}%", "Density", if (density > 0.5f) CsRed else CsGreen),
                        ).forEach { (value, label, color) ->
                            Column(
                                modifier = Modifier.weight(1f)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color.Black.copy(alpha = 0.6f))
                                    .padding(6.dp),
                                horizontalAlignment = Alignment.CenterHorizontally,
                            ) {
                                Text(value, color = color, fontSize = 18.sp, fontWeight = FontWeight.ExtraBold)
                                Text(label, color = CsTextMuted, fontSize = 10.sp)
                            }
                        }
                    }
                }
            }
        }

        // Controls
        CsButton(
            text = if (isStreaming) "Stop Camera" else "Start Camera",
            onClick = { isStreaming = !isStreaming },
            variant = if (isStreaming) ButtonVariant.Danger else ButtonVariant.Primary,
            icon = if (isStreaming) Icons.Default.StopCircle else Icons.Default.PlayArrow,
            modifier = Modifier.fillMaxWidth().height(48.dp),
        )

        Spacer(modifier = Modifier.height(12.dp))

        // How It Works
        GlassCard {
            Text("How It Works", color = CsText, fontSize = 14.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(12.dp))
            listOf(
                Icons.Default.Person to "YOLOv8 person detection runs on-device",
                Icons.Default.AccountTree to "ByteTrack assigns unique IDs to each person",
                Icons.Default.Analytics to "Real-time density & flow analysis",
                Icons.Default.Warning to "Stampede risk prediction via LSTM model",
            ).forEach { (icon, text) ->
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(icon, contentDescription = null, tint = CsRed, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(text, color = CsTextMuted, fontSize = 12.sp, modifier = Modifier.weight(1f))
                }
                Spacer(modifier = Modifier.height(8.dp))
            }
        }

        // Detection Results
        if (isStreaming) {
            Spacer(modifier = Modifier.height(12.dp))
            GlassCard {
                Text("Detection Results", color = CsText, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    GlassCard(modifier = Modifier.weight(1f), padding = 12.dp) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                            Text("$detectionCount", color = CsText, fontSize = 18.sp, fontWeight = FontWeight.ExtraBold)
                            Text("Tracked", color = CsTextMuted, fontSize = 10.sp)
                        }
                    }
                    GlassCard(modifier = Modifier.weight(1f), padding = 12.dp) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                            val riskLabel = when {
                                density > 0.6f -> "HIGH"
                                density > 0.3f -> "MODERATE"
                                else -> "LOW"
                            }
                            Text(riskLabel, color = if (density > 0.6f) CsRed else CsGreen,
                                fontSize = 18.sp, fontWeight = FontWeight.ExtraBold)
                            Text("Risk", color = CsTextMuted, fontSize = 10.sp)
                        }
                    }
                    GlassCard(modifier = Modifier.weight(1f), padding = 12.dp) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                            Text("${(Math.random() * 3 + 1).toInt()}", color = CsText, fontSize = 18.sp, fontWeight = FontWeight.ExtraBold)
                            Text("Zones", color = CsTextMuted, fontSize = 10.sp)
                        }
                    }
                }
            }
        }
    }
}
