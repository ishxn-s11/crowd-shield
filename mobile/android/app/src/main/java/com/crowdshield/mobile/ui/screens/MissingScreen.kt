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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.crowdshield.mobile.data.api.RetrofitClient
import com.crowdshield.mobile.data.model.*
import com.crowdshield.mobile.ui.components.*
import com.crowdshield.mobile.ui.theme.*
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MissingScreen() {
    var tab by remember { mutableIntStateOf(0) } // 0 = persons, 1 = items
    var showForm by remember { mutableStateOf(false) }
    var persons by remember { mutableStateOf<List<MissingPerson>>(emptyList()) }
    var items by remember { mutableStateOf<List<MissingItem>>(emptyList()) }
    val scope = rememberCoroutineScope()

    // Form state
    var pName by remember { mutableStateOf("") }
    var pAge by remember { mutableStateOf("") }
    var pGender by remember { mutableStateOf("") }
    var pDescription by remember { mutableStateOf("") }
    var pLastZone by remember { mutableStateOf("") }
    var pClothing by remember { mutableStateOf("") }
    var pHeight by remember { mutableStateOf("") }
    var pReporterName by remember { mutableStateOf("") }
    var pReporterContact by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        try { persons = RetrofitClient.api.getMissingPersons() } catch (_: Exception) {}
        try { items = RetrofitClient.api.getMissingItems() } catch (_: Exception) {}
    }

    fun resetForm() {
        pName = ""; pAge = ""; pGender = ""; pDescription = ""
        pLastZone = ""; pClothing = ""; pHeight = ""
        pReporterName = ""; pReporterContact = ""
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(CsBg)
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
    ) {
        // Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("Missing Reports", color = CsText, fontSize = 20.sp, fontWeight = FontWeight.ExtraBold)
            CsButton(text = "New Report", onClick = { showForm = !showForm }, icon = Icons.Default.Add)
        }
        Spacer(modifier = Modifier.height(16.dp))

        // Tabs
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf("👤 Persons (${persons.size})", "📦 Items (${items.size})").forEachIndexed { i, label ->
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(if (tab == i) CsRedGlow else CsGlass)
                        .border(1.dp, if (tab == i) CsRed else CsGlassBorder, RoundedCornerShape(8.dp))
                        .clickable { tab = i; showForm = false }
                        .padding(horizontal = 16.dp, vertical = 10.dp)
                ) {
                    Text(label, color = if (tab == i) CsRed else CsTextDim, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                }
            }
        }
        Spacer(modifier = Modifier.height(16.dp))

        // Form
        if (showForm && tab == 0) {
            GlassCard {
                Text("👤 Report Missing Person", color = CsText, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(12.dp))
                listOf(
                    "Full name *" to (pName to { v: String -> pName = v }),
                    "Age" to (pAge to { v: String -> pAge = v }),
                    "Height (e.g. 5'8)" to (pHeight to { v: String -> pHeight = v }),
                    "Clothing" to (pClothing to { v: String -> pClothing = v }),
                    "Description" to (pDescription to { v: String -> pDescription = v }),
                    "Last seen zone (Z1-Z7) *" to (pLastZone to { v: String -> pLastZone = v }),
                    "Your name" to (pReporterName to { v: String -> pReporterName = v }),
                    "Contact (phone/email)" to (pReporterContact to { v: String -> pReporterContact = v }),
                ).forEach { (placeholder, state) ->
                    OutlinedTextField(
                        value = state.first,
                        onValueChange = { state.second(it) },
                        placeholder = { Text(placeholder, color = CsTextMuted, fontSize = 13.sp) },
                        modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = CsRed, unfocusedBorderColor = CsGlassBorder,
                            focusedContainerColor = CsSurfaceLight, unfocusedContainerColor = CsSurfaceLight,
                            focusedTextColor = CsText, unfocusedTextColor = CsText,
                        ),
                        shape = RoundedCornerShape(8.dp),
                    )
                }
                CsButton(
                    text = "Submit Report",
                    onClick = {
                        if (pName.isNotBlank()) {
                            scope.launch {
                                try {
                                    RetrofitClient.api.createMissingPerson(
                                        CreateMissingPersonRequest(
                                            name = pName, age = pAge.toIntOrNull() ?: 0,
                                            gender = pGender, description = pDescription,
                                            last_seen_zone = pLastZone, clothing = pClothing,
                                            height = pHeight, reporter_name = pReporterName,
                                            reporter_contact = pReporterContact,
                                        )
                                    )
                                    resetForm()
                                    showForm = false
                                    persons = RetrofitClient.api.getMissingPersons()
                                } catch (_: Exception) {}
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                )
            }
            Spacer(modifier = Modifier.height(16.dp))
        }

        // List
        GlassCard {
            when {
                tab == 0 && persons.isEmpty() -> {
                    Column(modifier = Modifier.fillMaxWidth().padding(32.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Default.Search, contentDescription = null, tint = CsTextMuted, modifier = Modifier.size(36.dp))
                        Text("No missing person reports", color = CsTextMuted, fontSize = 13.sp, modifier = Modifier.padding(top = 8.dp))
                    }
                }
                tab == 0 -> persons.forEach { p ->
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Icon(Icons.Default.Person, contentDescription = null, tint = CsRed, modifier = Modifier.size(20.dp))
                        Spacer(modifier = Modifier.width(10.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(p.name, color = CsText, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                            Text(
                                "${if (p.age > 0) "${p.age}y " else ""}${p.gender} · Zone: ${p.last_seen_zone}",
                                color = CsTextMuted, fontSize = 10.sp,
                            )
                            if (p.clothing.isNotEmpty()) {
                                Text("Clothing: ${p.clothing}", color = CsTextMuted, fontSize = 10.sp)
                            }
                        }
                        val statusColor = if (p.status == "FOUND") CsGreen else CsRed
                        Box(
                            modifier = Modifier.clip(RoundedCornerShape(4.dp))
                                .background(statusColor.copy(alpha = 0.12f))
                                .padding(horizontal = 8.dp, vertical = 3.dp)
                        ) {
                            Text(p.status.ifEmpty { "MISSING" }, color = statusColor, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                    HorizontalDivider(color = CsGlassBorder)
                }
                tab == 1 && items.isEmpty() -> {
                    Column(modifier = Modifier.fillMaxWidth().padding(32.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Default.Search, contentDescription = null, tint = CsTextMuted, modifier = Modifier.size(36.dp))
                        Text("No missing item reports", color = CsTextMuted, fontSize = 13.sp, modifier = Modifier.padding(top = 8.dp))
                    }
                }
                tab == 1 -> items.forEach { item ->
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Icon(Icons.Default.Inventory2, contentDescription = null, tint = CsBeige, modifier = Modifier.size(20.dp))
                        Spacer(modifier = Modifier.width(10.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(item.item_name, color = CsText, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                            Text("${item.category} · Zone: ${item.last_seen_zone}", color = CsTextMuted, fontSize = 10.sp)
                        }
                    }
                    HorizontalDivider(color = CsGlassBorder)
                }
            }
        }
    }
}
