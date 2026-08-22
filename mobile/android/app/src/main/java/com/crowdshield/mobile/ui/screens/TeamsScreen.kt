package com.crowdshield.mobile.ui.screens

import androidx.compose.animation.animateContentSize
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
import com.crowdshield.mobile.ui.components.*
import com.crowdshield.mobile.ui.theme.*

data class TeamData(val id: String, val name: String, val members: Int, val status: String, val leader: String, val zone: String, val specialty: String)

private val MOCK_TEAMS = listOf(
    TeamData("T1", "Alpha Response", 8, "active", "Sgt. Kumar", "Main Entrance", "Crowd Control"),
    TeamData("T2", "Bravo Medical", 6, "active", "Dr. Patel", "Medical Tent", "Medical Response"),
    TeamData("T3", "Charlie Evac", 10, "standby", "Lt. Singh", "North Gate", "Evacuation"),
    TeamData("T4", "Delta Surveillance", 4, "active", "Cpl. Reddy", "CCTV Hub", "Surveillance"),
)

@Composable
fun TeamsScreen() {
    var selectedTeam by remember { mutableStateOf<String?>(null) }
    val statusColor: (String) -> Color = { s ->
        when (s) { "active" -> CsGreen; "standby" -> CsOrange; else -> CsRed }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(CsBg)
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
    ) {
        SectionHeader(
            icon = Icons.Default.People,
            title = "RESPONSE TEAMS",
            action = { CsButton(text = "Create", onClick = {}, variant = ButtonVariant.Primary) },
        )

        // Stats
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            GlassCard(modifier = Modifier.weight(1f), padding = 12.dp) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                    Text("${MOCK_TEAMS.size}", color = CsText, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold)
                    Text("Teams", color = CsTextMuted, fontSize = 10.sp, modifier = Modifier.padding(top = 2.dp))
                }
            }
            GlassCard(modifier = Modifier.weight(1f), padding = 12.dp) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                    Text("${MOCK_TEAMS.count { it.status == "active" }}", color = CsGreen, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold)
                    Text("Active", color = CsTextMuted, fontSize = 10.sp, modifier = Modifier.padding(top = 2.dp))
                }
            }
            GlassCard(modifier = Modifier.weight(1f), padding = 12.dp) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                    Text("${MOCK_TEAMS.sumOf { it.members }}", color = CsBeige, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold)
                    Text("Personnel", color = CsTextMuted, fontSize = 10.sp, modifier = Modifier.padding(top = 2.dp))
                }
            }
        }
        Spacer(modifier = Modifier.height(12.dp))

        // Team Cards
        MOCK_TEAMS.forEach { team ->
            val isActive = selectedTeam == team.id
            val sc = statusColor(team.status)
            GlassCard(
                modifier = Modifier
                    .animateContentSize()
                    .let { if (isActive) it.border(1.dp, CsRed.copy(alpha = 0.4f), RoundedCornerShape(16.dp)) else it },
                padding = 16.dp,
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth().clickable {
                        selectedTeam = if (isActive) null else team.id
                    },
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Box(
                        modifier = Modifier.size(40.dp).clip(RoundedCornerShape(12.dp))
                            .background(sc.copy(alpha = 0.12f)),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(Icons.Default.Shield, contentDescription = null, tint = sc, modifier = Modifier.size(20.dp))
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(team.name, color = CsText, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                        Text(team.specialty, color = CsTextMuted, fontSize = 12.sp)
                    }
                    Box(
                        modifier = Modifier.clip(RoundedCornerShape(4.dp))
                            .background(sc.copy(alpha = 0.12f))
                            .padding(horizontal = 8.dp, vertical = 4.dp),
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(modifier = Modifier.size(8.dp).clip(RoundedCornerShape(4.dp)).background(sc))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(team.status.uppercase(), color = sc, fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.5.sp)
                        }
                    }
                }

                // Expanded details
                if (isActive) {
                    Spacer(modifier = Modifier.height(16.dp))
                    listOf(
                        Triple(Icons.Default.Person, "Leader", team.leader),
                        Triple(Icons.Default.People, "Members", "${team.members}"),
                        Triple(Icons.Default.LocationOn, "Zone", team.zone),
                    ).forEach { (icon, label, value) ->
                        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(vertical = 4.dp)) {
                            Icon(icon, contentDescription = null, tint = CsBeige, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(label, color = CsTextMuted, fontSize = 12.sp, modifier = Modifier.width(70.dp))
                            Text(value, color = CsText, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                        }
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        CsButton(text = "Assign", onClick = {}, variant = ButtonVariant.Secondary)
                        CsButton(text = "Dispatch", onClick = {}, variant = ButtonVariant.Primary)
                    }
                }
            }
            Spacer(modifier = Modifier.height(4.dp))
        }
    }
}
