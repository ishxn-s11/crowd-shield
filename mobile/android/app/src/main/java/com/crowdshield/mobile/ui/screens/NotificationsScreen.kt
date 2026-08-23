package com.crowdshield.mobile.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.crowdshield.mobile.ui.theme.*
import java.text.SimpleDateFormat
import java.util.*

data class Notification(
    val id: String,
    val type: String,
    val title: String,
    val body: String,
    val fromName: String?,
    val createdAt: Date,
    val read: Boolean
)

@Composable
fun NotificationsScreen() {
    var filter by remember { mutableStateOf("ALL") }
    val notifications = remember {
        mutableStateListOf(
            Notification("1", "ALERT", "Zone Z5 — High Density Alert", "Density exceeded 2.0 p/m² in Central Plaza. Risk level elevated to HIGH.", null, Date(), false),
            Notification("2", "COMMANDER", "Team Alpha Deployed", "Response team Alpha has been dispatched to Zone Z1 for crowd management.", "Commander Davis", Date(System.currentTimeMillis() - 300000), false),
            Notification("3", "ACKNOWLEDGEMENT", "Alert Acknowledged", "High-density alert for Z5 has been acknowledged by Operator Johnson.", null, Date(System.currentTimeMillis() - 600000), true),
            Notification("4", "OPERATOR", "CCTV Feed Online", "CAM-03 (Food Court) stream reconnected successfully.", "Operator Lee", Date(System.currentTimeMillis() - 900000), true),
            Notification("5", "ACKNOWLEDGEMENT", "Incident Resolved", "Incident INC-007 (Minor stampede near Gate G2) has been resolved.", null, Date(System.currentTimeMillis() - 1200000), true),
        )
    }

    val typeColors = mapOf(
        "OPERATOR" to CsRed,
        "COMMANDER" to CsBeige,
        "ACKNOWLEDGEMENT" to CsGreen,
        "ALERT" to CsOrange,
        "SYSTEM" to CsTextMuted,
    )
    val typeIcons = mapOf(
        "OPERATOR" to "📹",
        "COMMANDER" to "🎖️",
        "ACKNOWLEDGEMENT" to "✅",
        "ALERT" to "⚠️",
        "SYSTEM" to "⚙️",
    )

    val filtered = when (filter) {
        "ALL" -> notifications
        else -> notifications.filter { it.type == filter }
    }
    val unreadCount = notifications.count { !it.read }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        // Header
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("Notifications", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = CsText)
                    if (unreadCount > 0) {
                        Spacer(modifier = Modifier.width(8.dp))
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(10.dp))
                                .background(CsRed)
                                .padding(horizontal = 8.dp, vertical = 2.dp)
                        ) {
                            Text("$unreadCount", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = androidx.compose.ui.graphics.Color.White)
                        }
                    }
                }
            }
        }

        // Filter pills
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                listOf("ALL", "OPERATOR", "COMMANDER", "ACKNOWLEDGEMENT").forEach { f ->
                    val isSelected = filter == f
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(if (isSelected) CsRed.copy(alpha = 0.15f) else CsSurface)
                            .border(
                                width = 1.dp,
                                color = if (isSelected) CsRed else CsGlassBorder,
                                shape = RoundedCornerShape(6.dp)
                            )
                            .clickable { filter = f }
                            .padding(horizontal = 14.dp, vertical = 6.dp)
                    ) {
                        Text(
                            if (f == "ALL") "All" else f.replace("_", " "),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = if (isSelected) CsRed else CsTextMuted
                        )
                    }
                }
            }
        }

        // Notification items
        if (filtered.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(40.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Default.Notifications, contentDescription = null, tint = CsGreen, modifier = Modifier.size(40.dp))
                        Spacer(modifier = Modifier.height(12.dp))
                        Text("No notifications", color = CsGreen, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                    }
                }
            }
        }

        items(filtered) { notif ->
            val color = typeColors[notif.type] ?: CsTextMuted
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { },
                colors = CardDefaults.cardColors(
                    containerColor = if (notif.read) CsSurface.copy(alpha = 0.5f) else CsSurface
                ),
                shape = RoundedCornerShape(8.dp),
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.Top
                ) {
                    // Left color bar
                    Box(
                        modifier = Modifier
                            .width(3.dp)
                            .height(50.dp)
                            .clip(RoundedCornerShape(2.dp))
                            .background(color)
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(typeIcons[notif.type] ?: "🔔", fontSize = 14.sp)
                                Spacer(modifier = Modifier.width(6.dp))
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(4.dp))
                                        .background(color.copy(alpha = 0.15f))
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text(notif.type, fontSize = 9.sp, fontWeight = FontWeight.Bold, color = color)
                                }
                                if (notif.fromName != null) {
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("from ${notif.fromName}", fontSize = 11.sp, color = CsTextMuted)
                                }
                            }
                            Text(
                                SimpleDateFormat("HH:mm", Locale.getDefault()).format(notif.createdAt),
                                fontSize = 10.sp,
                                color = CsTextMuted
                            )
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            notif.title,
                            fontSize = 13.sp,
                            fontWeight = if (notif.read) FontWeight.Normal else FontWeight.SemiBold,
                            color = CsText
                        )
                        if (notif.body.isNotEmpty()) {
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(notif.body, fontSize = 11.sp, color = CsTextMuted, lineHeight = 15.sp)
                        }
                    }
                }
            }
        }
    }
}
