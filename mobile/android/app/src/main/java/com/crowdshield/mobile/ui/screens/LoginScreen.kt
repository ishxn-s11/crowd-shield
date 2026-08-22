package com.crowdshield.mobile.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
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
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.crowdshield.mobile.ui.components.*
import com.crowdshield.mobile.ui.theme.*

@Composable
fun LoginScreen(onLogin: (role: String) -> Unit) {
    var isRegister by remember { mutableStateOf(false) }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var name by remember { mutableStateOf("") }
    var role by remember { mutableStateOf("OPERATOR") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(CsBg)
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        // Logo
        Box(
            modifier = Modifier
                .size(80.dp)
                .clip(CircleShape)
                .background(CsRedLight)
                .border(2.dp, CsRed.copy(alpha = 0.4f), CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                Icons.Default.Shield,
                contentDescription = "Logo",
                tint = CsRed,
                modifier = Modifier.size(48.dp),
            )
        }
        Spacer(modifier = Modifier.height(16.dp))
        Text("CROWDSHIELD", color = CsText, fontSize = 28.sp, fontWeight = FontWeight.Black, letterSpacing = 3.sp)
        Text("AI-Powered Crowd Safety Platform", color = CsTextMuted, fontSize = 12.sp)
        Spacer(modifier = Modifier.height(32.dp))

        // Tabs
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp))
                .border(1.dp, CsGlassBorder, RoundedCornerShape(16.dp)),
        ) {
            listOf("Sign In" to false, "Create Account" to true).forEach { (label, register) ->
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .background(if (register == isRegister) CsRedLight else CsGlass)
                        .clickable { isRegister = register }
                        .padding(vertical = 12.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        label,
                        color = if (register == isRegister) CsRed else CsTextMuted,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 14.sp,
                    )
                }
            }
        }
        Spacer(modifier = Modifier.height(16.dp))

        // Form
        GlassCard {
            if (isRegister) {
                Text("Full Name", color = CsTextMuted, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                Spacer(modifier = Modifier.height(4.dp))
                OutlinedTextField(
                    value = name, onValueChange = { name = it },
                    placeholder = { Text("John Doe", color = CsTextDim) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = CsRed, unfocusedBorderColor = CsGlassBorder,
                        focusedContainerColor = CsSurfaceLight, unfocusedContainerColor = CsSurfaceLight,
                        focusedTextColor = CsText, unfocusedTextColor = CsText,
                    ),
                    shape = RoundedCornerShape(12.dp),
                )
                Spacer(modifier = Modifier.height(12.dp))
            }

            Text("Email", color = CsTextMuted, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
            Spacer(modifier = Modifier.height(4.dp))
            OutlinedTextField(
                value = email, onValueChange = { email = it },
                placeholder = { Text("you@example.com", color = CsTextDim) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = CsRed, unfocusedBorderColor = CsGlassBorder,
                    focusedContainerColor = CsSurfaceLight, unfocusedContainerColor = CsSurfaceLight,
                    focusedTextColor = CsText, unfocusedTextColor = CsText,
                ),
                shape = RoundedCornerShape(12.dp),
            )
            Spacer(modifier = Modifier.height(12.dp))

            Text("Password", color = CsTextMuted, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
            Spacer(modifier = Modifier.height(4.dp))
            OutlinedTextField(
                value = password, onValueChange = { password = it },
                placeholder = { Text("••••••••", color = CsTextDim) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                visualTransformation = PasswordVisualTransformation(),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = CsRed, unfocusedBorderColor = CsGlassBorder,
                    focusedContainerColor = CsSurfaceLight, unfocusedContainerColor = CsSurfaceLight,
                    focusedTextColor = CsText, unfocusedTextColor = CsText,
                ),
                shape = RoundedCornerShape(12.dp),
            )
            Spacer(modifier = Modifier.height(12.dp))

            if (isRegister) {
                Text("Role", color = CsTextMuted, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                Spacer(modifier = Modifier.height(4.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    listOf("OPERATOR" to Icons.Default.Visibility, "COMMANDER" to Icons.Default.Shield).forEach { (r, icon) ->
                        Row(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(12.dp))
                                .background(CsSurfaceLight)
                                .border(
                                    1.dp,
                                    if (role == r) CsRed.copy(alpha = 0.4f) else CsGlassBorder,
                                    RoundedCornerShape(12.dp)
                                )
                                .clickable { role = r }
                                .padding(12.dp),
                            horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Icon(icon, contentDescription = null, tint = if (role == r) CsRed else CsTextMuted, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(r, color = if (role == r) CsRed else CsTextMuted, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }
                }
                Spacer(modifier = Modifier.height(16.dp))
            }

            CsButton(
                text = if (isRegister) "Create Account" else "Sign In",
                onClick = { onLogin(role) },
                variant = ButtonVariant.Primary,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp),
            )
        }
    }
}
