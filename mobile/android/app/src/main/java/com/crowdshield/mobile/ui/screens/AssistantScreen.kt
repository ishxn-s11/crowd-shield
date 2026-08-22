package com.crowdshield.mobile.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.crowdshield.mobile.data.api.RetrofitClient
import com.crowdshield.mobile.ui.theme.*
import kotlinx.coroutines.launch

data class ChatMessage(val role: String, val text: String)

private val QUICK_ACTIONS = listOf(
    "What is the current risk status?",
    "Show me evacuation routes",
    "Generate incident summary",
    "Recommend interventions",
)

@Composable
fun AssistantScreen() {
    var messages by remember { mutableStateOf(
        listOf(ChatMessage("assistant", "Hello! I am the CrowdShield AI Assistant. Ask me about risk status, recommendations, evacuation routes, or situation summaries."))
    ) }
    var input by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }
    val listState = rememberLazyListState()
    val scope = rememberCoroutineScope()

    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.size - 1)
        }
    }

    fun send(text: String? = null) {
        val msg = text ?: input.trim()
        if (msg.isEmpty()) return
        input = ""
        messages = messages + ChatMessage("user", msg)
        loading = true
        scope.launch {
            try {
                val res = RetrofitClient.api.chat(mapOf("message" to msg))
                val reply = res.response.ifEmpty { res.message }.ifEmpty { "I could not process that request." }
                messages = messages + ChatMessage("assistant", reply)
            } catch (_: Exception) {
                messages = messages + ChatMessage("assistant", "Connection error. Please check that the API server is running.")
            }
            loading = false
        }
    }

    Column(modifier = Modifier.fillMaxSize().background(CsBg)) {
        // Header
        Row(
            modifier = Modifier.fillMaxWidth()
                .background(CsGlass)
                .border(1.dp, CsGlassBorder)
                .padding(horizontal = 16.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(Icons.Default.AutoAwesome, contentDescription = null, tint = CsBeige, modifier = Modifier.size(18.dp))
            Spacer(modifier = Modifier.width(8.dp))
            Text("AI Assistant", color = CsText, fontSize = 16.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
            Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(CsGreen))
        }

        // Messages
        LazyColumn(
            state = listState,
            contentPadding = PaddingValues(12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            items(messages) { msg ->
                val isUser = msg.role == "user"
                Column(
                    modifier = Modifier.fillMaxWidth()
                        .padding(
                            start = if (isUser) 48.dp else 0.dp,
                            end = if (isUser) 0.dp else 48.dp,
                        )
                        .clip(RoundedCornerShape(12.dp))
                        .background(if (isUser) CsRed else CsGlass)
                        .then(
                            if (!isUser) Modifier.border(1.dp, CsGlassBorder, RoundedCornerShape(12.dp))
                            else Modifier
                        )
                        .padding(12.dp)
                ) {
                    if (!isUser) {
                        Text("CROWDSHIELD AI", color = CsBeige, fontSize = 9.sp, fontWeight = FontWeight.Bold,
                            letterSpacing = 1.sp, modifier = Modifier.padding(bottom = 4.dp))
                    }
                    Text(msg.text, color = if (isUser) Color.White else CsText, fontSize = 13.sp, lineHeight = 18.sp)
                }
            }
        }

        // Quick Actions (shown at start)
        if (messages.size <= 1) {
            Row(
                modifier = Modifier.padding(horizontal = 12.dp).horizontalScroll(androidx.compose.foundation.rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                QUICK_ACTIONS.forEach { q ->
                    Box(
                        modifier = Modifier.clip(RoundedCornerShape(8.dp))
                            .border(1.dp, CsGlassBorder, RoundedCornerShape(8.dp))
                            .background(CsGlass)
                            .clickable { send(q) }
                            .padding(horizontal = 12.dp, vertical = 8.dp)
                    ) {
                        Text(q, color = CsTextDim, fontSize = 11.sp)
                    }
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
        }

        // Input
        Row(
            modifier = Modifier.fillMaxWidth()
                .background(CsGlass)
                .border(1.dp, CsGlassBorder)
                .padding(8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            OutlinedTextField(
                value = input,
                onValueChange = { input = it },
                placeholder = { Text("Ask about risks, routes, incidents...", color = CsTextMuted, fontSize = 13.sp) },
                modifier = Modifier.weight(1f),
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = CsRed, unfocusedBorderColor = CsGlassBorder,
                    focusedContainerColor = CsSurfaceLight, unfocusedContainerColor = CsSurfaceLight,
                    focusedTextColor = CsText, unfocusedTextColor = CsText,
                ),
                shape = RoundedCornerShape(12.dp),
            )
            Spacer(modifier = Modifier.width(8.dp))
            IconButton(
                onClick = { send() },
                enabled = !loading && input.isNotBlank(),
                modifier = Modifier.size(40.dp).clip(CircleShape).background(CsRed),
            ) {
                Icon(Icons.Default.Send, contentDescription = "Send", tint = if (loading || input.isBlank()) CsTextMuted else CsBeige, modifier = Modifier.size(18.dp))
            }
        }
    }
}


