package com.crowdshield.mobile.ui.screens

import android.Manifest
import android.content.pm.PackageManager
import android.util.Log
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import com.crowdshield.mobile.ui.theme.*
import java.util.concurrent.Executors

@Composable
fun DeviceCameraScreen() {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current

    var hasCameraPermission by remember { mutableStateOf(false) }
    var isStreaming by remember { mutableStateOf(false) }
    var showPermissionDialog by remember { mutableStateOf(false) }
    var personCount by remember { mutableIntStateOf(0) }
    var density by remember { mutableFloatStateOf(0f) }
    var riskLevel by remember { mutableStateOf("LOW") }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        hasCameraPermission = permissions[Manifest.permission.CAMERA] == true
        if (hasCameraPermission) {
            isStreaming = true
        }
    }

    // Check permission on launch
    LaunchedEffect(Unit) {
        val granted = ContextCompat.checkSelfPermission(
            context, Manifest.permission.CAMERA
        ) == PackageManager.PERMISSION_GRANTED
        if (granted) {
            hasCameraPermission = true
            isStreaming = true
        } else {
            showPermissionDialog = true
        }
    }

    // Simulated crowd analysis
    LaunchedEffect(isStreaming) {
        if (isStreaming) {
            while (isStreaming) {
                kotlinx.coroutines.delay(3000)
                personCount = (5..50).random()
                density = personCount.toFloat() / 100f
                riskLevel = when {
                    density > 0.4f -> "CRITICAL"
                    density > 0.25f -> "HIGH"
                    density > 0.15f -> "MODERATE"
                    else -> "LOW"
                }
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Permission dialog
        if (showPermissionDialog && !hasCameraPermission) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = CsSurface),
                shape = RoundedCornerShape(12.dp),
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Icon(Icons.Default.CameraAlt, contentDescription = null, tint = CsRed, modifier = Modifier.size(48.dp))
                    Spacer(modifier = Modifier.height(12.dp))
                    Text("Camera Access Required", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = CsText)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        "CrowdShield needs camera access for real-time crowd detection. Your camera feed stays on device — nothing is uploaded.",
                        fontSize = 12.sp, color = CsTextMuted, lineHeight = 18.sp
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(
                        onClick = {
                            permissionLauncher.launch(arrayOf(
                                Manifest.permission.CAMERA,
                                Manifest.permission.RECORD_AUDIO,
                            ))
                            showPermissionDialog = false
                        },
                        modifier = Modifier.fillMaxWidth().height(44.dp),
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = CsRed),
                    ) {
                        Icon(Icons.Default.CameraAlt, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Grant Camera Access", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    TextButton(onClick = { showPermissionDialog = false }) {
                        Text("Skip for now", color = CsTextMuted, fontSize = 12.sp)
                    }
                }
            }
        }

        // Camera preview or placeholder
        Card(
            modifier = Modifier.fillMaxWidth().height(280.dp),
            colors = CardDefaults.cardColors(containerColor = Color.Black),
            shape = RoundedCornerShape(12.dp),
        ) {
            if (hasCameraPermission && isStreaming) {
                Box(modifier = Modifier.fillMaxSize()) {
                    // CameraX preview
                    AndroidView(
                        factory = { ctx ->
                            val previewView = PreviewView(ctx)
                            val cameraProviderFuture = ProcessCameraProvider.getInstance(ctx)
                            cameraProviderFuture.addListener({
                                val cameraProvider = cameraProviderFuture.get()
                                val preview = Preview.Builder().build().also {
                                    it.setSurfaceProvider(previewView.surfaceProvider)
                                }
                                try {
                                    cameraProvider.unbindAll()
                                    cameraProvider.bindToLifecycle(
                                        lifecycleOwner,
                                        CameraSelector.DEFAULT_BACK_CAMERA,
                                        preview,
                                    )
                                } catch (e: Exception) {
                                    Log.e("Camera", "CameraX bind failed", e)
                                }
                            }, ContextCompat.getMainExecutor(ctx))
                            previewView
                        },
                        modifier = Modifier.fillMaxSize(),
                    )
                    // Live badge
                    Box(modifier = Modifier.padding(10.dp).align(Alignment.TopStart)) {
                        Row(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(Color.Black.copy(alpha = 0.7f))
                                .padding(horizontal = 8.dp, vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Box(modifier = Modifier.size(6.dp).clip(CircleShape).background(Color.Red))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("LIVE", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        }
                    }
                    // Stats overlay
                    Box(modifier = Modifier.padding(10.dp).align(Alignment.BottomStart)) {
                        Row(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(Color.Black.copy(alpha = 0.7f))
                                .padding(10.dp),
                            horizontalArrangement = Arrangement.spacedBy(16.dp),
                        ) {
                            StatItem("People", "$personCount", CsRed)
                            StatItem("Density", String.format("%.1f", density), CsBeige)
                            StatItem("Risk", riskLevel, when(riskLevel) { "CRITICAL" -> CsRed; "HIGH" -> CsOrange; else -> CsGreen })
                        }
                    }
                    // Stop button
                    Box(modifier = Modifier.padding(10.dp).align(Alignment.TopEnd)) {
                        IconButton(
                            onClick = { isStreaming = false },
                            modifier = Modifier
                                .clip(CircleShape)
                                .background(Color.Red.copy(alpha = 0.8f))
                                .size(36.dp),
                        ) {
                            Icon(Icons.Default.Stop, contentDescription = "Stop", tint = Color.White, modifier = Modifier.size(18.dp))
                        }
                    }
                }
            } else {
                // Placeholder
                Column(
                    modifier = Modifier.fillMaxSize(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center,
                ) {
                    Icon(Icons.Default.Videocam, contentDescription = null, tint = CsTextMuted, modifier = Modifier.size(48.dp))
                    Spacer(modifier = Modifier.height(12.dp))
                    Text("Tap to start camera", color = CsTextMuted, fontSize = 13.sp)
                }
            }
        }

        // Control buttons
        if (hasCameraPermission) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Button(
                    onClick = { isStreaming = !isStreaming },
                    modifier = Modifier.weight(1f).height(44.dp),
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isStreaming) CsRed else CsGreen
                    ),
                ) {
                    Icon(
                        if (isStreaming) Icons.Default.Stop else Icons.Default.PlayArrow,
                        contentDescription = null, modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(if (isStreaming) "Stop Camera" else "Start Camera", fontWeight = FontWeight.SemiBold, fontSize = 12.sp)
                }
            }
        }

        // USB Camera / CCTV Guide
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = CsSurface),
            shape = RoundedCornerShape(10.dp),
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Usb, contentDescription = null, tint = CsBeige, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Connect CCTV / USB Camera", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = CsText)
                }
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    "Connect an IP camera via RTSP or attach a USB camera to your device for crowd monitoring.",
                    fontSize = 12.sp, color = CsTextMuted, lineHeight = 18.sp
                )
                Spacer(modifier = Modifier.height(12.dp))

                // RTSP input
                OutlinedTextField(
                    value = "",
                    onValueChange = {},
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = { Text("RTSP URL: rtsp://192.168.1.100:554/stream", fontSize = 11.sp) },
                    shape = RoundedCornerShape(8.dp),
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = CsBeige,
                        unfocusedBorderColor = CsGlassBorder,
                        cursorColor = CsBeige,
                        focusedTextColor = CsText,
                        unfocusedTextColor = CsText,
                    ),
                )
                Spacer(modifier = Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(
                        onClick = { },
                        modifier = Modifier.weight(1f).height(38.dp),
                        shape = RoundedCornerShape(8.dp),
                    ) {
                        Icon(Icons.Default.Link, contentDescription = null, modifier = Modifier.size(14.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Connect RTSP", fontSize = 11.sp, color = CsBeige)
                    }
                    OutlinedButton(
                        onClick = { },
                        modifier = Modifier.weight(1f).height(38.dp),
                        shape = RoundedCornerShape(8.dp),
                    ) {
                        Icon(Icons.Default.Usb, contentDescription = null, modifier = Modifier.size(14.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("USB Camera", fontSize = 11.sp, color = CsBeige)
                    }
                }
            }
        }

        // Analysis results
        if (isStreaming && hasCameraPermission) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = CsSurface),
                shape = RoundedCornerShape(10.dp),
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Analysis Results", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = CsTextMuted, letterSpacing = 1.sp)
                    Spacer(modifier = Modifier.height(10.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        AnalysisCard("Persons", "$personCount", CsRed, Modifier.weight(1f))
                        AnalysisCard("Density", String.format("%.2f p/m²", density), CsBeige, Modifier.weight(1f))
                        AnalysisCard("Risk", riskLevel, when(riskLevel) { "CRITICAL" -> CsRed; "HIGH" -> CsOrange; else -> CsGreen }, Modifier.weight(1f))
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))
    }
}

@Composable
private fun StatItem(label: String, value: String, color: androidx.compose.ui.graphics.Color) {
    Column {
        Text(label, fontSize = 9.sp, color = Color.Gray)
        Text(value, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = color)
    }
}

@Composable
private fun AnalysisCard(label: String, value: String, color: androidx.compose.ui.graphics.Color, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = CsBg),
        shape = RoundedCornerShape(6.dp),
    ) {
        Column(modifier = Modifier.padding(10.dp)) {
            Text(label, fontSize = 10.sp, color = CsTextMuted)
            Spacer(modifier = Modifier.height(4.dp))
            Text(value, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = color)
        }
    }
}
