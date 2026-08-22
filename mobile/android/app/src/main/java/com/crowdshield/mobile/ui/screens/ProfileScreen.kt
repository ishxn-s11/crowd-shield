package com.crowdshield.mobile.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.crowdshield.mobile.ui.components.*
import com.crowdshield.mobile.ui.theme.*

data class SettingItem(val icon: ImageVector, val label: String, val color: Color, val sub: String? = null)

@Composable
fun ProfileScreen(onSignOut: () -> Unit) {
    val user = mapOf(
        "name" to "Dev User",
        "username" to "commander",
        "email" to "dev@crowdshield.io",
        "role" to "COMMANDER",
        "status" to "Active",
    )

    val settings = listOf(
        SettingItem(Icons.Default.Notifications, "Notifications", CsRed),
        SettingItem(Icons.Default.Language, "Language", CsBeige),
        SettingItem(Icons.Default.DarkMode, "Dark Mode", CsBeige, sub = "Enabled"),
        SettingItem(Icons.Default.Shield, "Privacy", CsGreen),
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(CsBg)
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
    ) {
        Text("My Profile", color = CsText, fontSize = 20.sp, fontWeight = FontWeight.ExtraBold)
        Spacer(modifier = Modifier.height(16.dp))

        // User card
        GlassCard {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier.size(64.dp).clip(CircleShape)
                        .background(CsRedGlow)
                        .border(1.dp, CsRedDim, CircleShape),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(Icons.Default.Person, contentDescription = null, tint = CsRed, modifier = Modifier.size(28.dp))
                }
                Spacer(modifier = Modifier.width(16.dp))
                Column {
                    Text(user["name"]!!, color = CsText, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                    Text("@${user["username"]}", color = CsTextMuted, fontSize = 13.sp, modifier = Modifier.padding(top = 2.dp))
                }
            }
            Spacer(modifier = Modifier.height(20.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf("EMAIL" to user["email"]!!, "ROLE" to user["role"]!!, "STATUS" to user["status"]!!).forEach { (label, value) ->
                    GlassCard(modifier = Modifier.weight(1f), padding = 12.dp) {
                        Text(label, color = CsTextMuted, fontSize = 9.sp, letterSpacing = 1.sp)
                        Text(value, color = CsText, fontSize = 14.sp, fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.padding(top = 4.dp))
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Settings
        GlassCard {
            Text("Settings", color = CsText, fontSize = 14.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(12.dp))
            settings.forEach { item ->
                Row(
                    modifier = Modifier.fillMaxWidth()
                        .padding(vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Box(
                        modifier = Modifier.size(32.dp).clip(RoundedCornerShape(8.dp))
                            .background(item.color.copy(alpha = 0.09f)),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(item.icon, contentDescription = null, tint = item.color, modifier = Modifier.size(18.dp))
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(item.label, color = CsText, fontSize = 13.sp, modifier = Modifier.weight(1f))
                    if (item.sub != null) {
                        Text(item.sub, color = CsTextMuted, fontSize = 11.sp)
                        Spacer(modifier = Modifier.width(8.dp))
                    }
                    Icon(Icons.Default.ChevronRight, contentDescription = null, tint = CsTextMuted, modifier = Modifier.size(16.dp))
                }
                HorizontalDivider(color = CsGlassBorder)
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Sign Out
        Row(
            modifier = Modifier.fillMaxWidth()
                .clip(RoundedCornerShape(8.dp))
                .border(1.dp, CsRedDim, RoundedCornerShape(8.dp))
                .clickable { onSignOut() }
                .padding(14.dp),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(Icons.Default.Logout, contentDescription = null, tint = CsCritical, modifier = Modifier.size(16.dp))
            Spacer(modifier = Modifier.width(8.dp))
            Text("Sign Out", color = CsCritical, fontSize = 13.sp, fontWeight = FontWeight.Bold)
        }
    }
}
