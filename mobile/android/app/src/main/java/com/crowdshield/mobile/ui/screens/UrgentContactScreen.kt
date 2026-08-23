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
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

data class UrgentMessage(
    val id: String,
    val priority: String,
    val message: String,
    val senderName: String,
    val senderRole: String,
    val createdAt: Date,
    val acknowledged: Boolean
)

@Composable
fun UrgentContactScreen() {
    var selectedPriority by remember { mutableStateOf("URGENT") }
    var message by remember { mutableStateOf("") }
    var sent by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    val messages = remember {
        mutableStateListOf<UrgentMessage>()
    }

    val priorityColors = mapOf(
        "URGENT" to CsBeige,
        "CRITICAL" to CsOrange,
        "EMERGENCY" to CsRed
    )

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Header
        item {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(bottom = 8.dp)
            ) {
                Icon(
                    Icons.Default.Phone,
                    contentDescription = null,
                    tint = CsRed,
                    modifier = Modifier.size(24.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    "Urgent Contact — Commander",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = CsText
                )
            }
            Text(
                "Send an urgent message directly to the commander in case of stampede, crowd surge, or emergency.",
                fontSize = 12.sp,
                color = CsTextMuted
            )
        }

        // Priority selector
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                listOf("URGENT", "CRITICAL", "EMERGENCY").forEach { priority ->
                    val color = priorityColors[priority] ?: CsTextMuted
                    val isSelected = selectedPriority == priority
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(8.dp))
                            .background(
                                if (isSelected) color.copy(alpha = 0.15f)
                                else CsSurface
                            )
                            .border(
                                width = if (isSelected) 2.dp else 1.dp,
                                color = if (isSelected) color else CsGlassBorder,
                                shape = RoundedCornerShape(8.dp)
                            )
                            .clickable { selectedPriority = priority }
                            .padding(12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            priority,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isSelected) color else CsTextMuted
                        )
                    }
                }
            }
        }

        // Message input
        item {
            val color = priorityColors[selectedPriority] ?: CsRed
            OutlinedTextField(
                value = message,
                onValueChange = { message = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(120.dp),
                placeholder = { Text("Describe the urgency...", fontSize = 13.sp) },
                shape = RoundedCornerShape(8.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = color,
                    unfocusedBorderColor = CsGlassBorder,
                    cursorColor = color,
                    focusedTextColor = CsText,
                    unfocusedTextColor = CsText,
                ),
            )
        }

        // Send button
        item {
            Button(
                onClick = {
                    if (message.isNotBlank()) {
                        val newMsg = UrgentMessage(
                            id = UUID.randomUUID().toString(),
                            priority = selectedPriority,
                            message = message,
                            senderName = "Operator",
                            senderRole = "OPERATOR",
                            createdAt = Date(),
                            acknowledged = false
                        )
                        messages.add(0, newMsg)
                        sent = true
                        message = ""
                        scope.launch {
                            kotlinx.coroutines.delay(3000)
                            sent = false
                        }
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp),
                enabled = message.isNotBlank(),
                shape = RoundedCornerShape(8.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (sent) CsGreen else (priorityColors[selectedPriority] ?: CsRed)
                )
            ) {
                Icon(
                    if (sent) Icons.Default.CheckCircle else Icons.Default.Phone,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    if (sent) "✓ Message Sent!" else "📞 Contact Commander ($selectedPriority)",
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp
                )
            }
        }

        // Info note
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = CsSurface),
                shape = RoundedCornerShape(8.dp),
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.Top
                ) {
                    Icon(Icons.Default.Info, contentDescription = null, tint = CsTextMuted, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        "Messages are sent to the commander's dashboard and trigger a push notification. In EMERGENCY mode, all response teams are also notified.",
                        fontSize = 11.sp,
                        color = CsTextMuted,
                        lineHeight = 16.sp,
                    )
                }
            }
        }

        // History header
        item {
            Text(
                "Contact History",
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = CsTextMuted,
                letterSpacing = 1.sp,
                modifier = Modifier.padding(top = 8.dp)
            )
        }

        // History items
        if (messages.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(40.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("No urgent contacts yet", color = CsTextMuted, fontSize = 12.sp)
                }
            }
        }

        items(messages) { msg ->
            val color = priorityColors[msg.priority] ?: CsRed
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = CsSurface),
                shape = RoundedCornerShape(8.dp),
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(4.dp))
                                    .background(color.copy(alpha = 0.15f))
                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                            ) {
                                Text(msg.priority, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = color)
                            }
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                "${msg.senderName} (${msg.senderRole})",
                                fontSize = 11.sp,
                                color = CsTextMuted
                            )
                        }
                        Text(
                            SimpleDateFormat("HH:mm", Locale.getDefault()).format(msg.createdAt),
                            fontSize = 10.sp,
                            color = CsTextMuted
                        )
                    }
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(msg.message, fontSize = 12.sp, color = CsText)

                    if (!msg.acknowledged) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Box(
                            modifier = Modifier
                                .align(Alignment.End)
                                .clip(RoundedCornerShape(4.dp))
                                .background(CsGreen.copy(alpha = 0.1f))
                                .border(1.dp, CsGreen.copy(alpha = 0.3f), RoundedCornerShape(4.dp))
                                .clickable { }
                                .padding(horizontal = 10.dp, vertical = 4.dp)
                        ) {
                            Text("Acknowledge", fontSize = 10.sp, fontWeight = FontWeight.SemiBold, color = CsGreen)
                        }
                    }
                }
            }
        }
    }
}
