package com.crowdshield.mobile.ui.navigation

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.crowdshield.mobile.ui.screens.*
import com.crowdshield.mobile.ui.theme.*

// ── 5 core bottom tabs only ──
sealed class Screen(val route: String, val label: String, val icon: ImageVector) {
    data object Dashboard : Screen("dashboard", "Home", Icons.Default.Dashboard)
    data object Zones : Screen("zones", "Zones", Icons.Default.Map)
    data object DeviceCamera : Screen("device_cam", "Camera", Icons.Default.Videocam)
    data object Alerts : Screen("alerts", "Alerts", Icons.Default.Notifications)
    data object More : Screen("more", "More", Icons.Default.MoreHoriz)
}

// ── Secondary screens accessible from "More" ──
sealed class SecondaryScreen(val route: String, val label: String, val icon: ImageVector) {
    data object Cameras : SecondaryScreen("cameras", "CCTV Cameras", Icons.Default.Videocam)
    data object Missing : SecondaryScreen("missing", "Missing Reports", Icons.Default.Search)
    data object Incidents : SecondaryScreen("incidents", "Incidents", Icons.Default.Warning)
    data object Assistant : SecondaryScreen("assistant", "AI Assistant", Icons.Default.AutoAwesome)
    data object Teams : SecondaryScreen("teams", "Response Teams", Icons.Default.People)
    data object UrgentContact : SecondaryScreen("urgent_contact", "Urgent Contact", Icons.Default.Phone)
    data object Notifications : SecondaryScreen("notifications", "Notifications", Icons.Default.NotificationsActive)
    data object Profile : SecondaryScreen("profile", "Profile", Icons.Default.Person)
}

private val CORE_SCREENS = listOf(Screen.Dashboard, Screen.Zones, Screen.DeviceCamera, Screen.Alerts, Screen.More)
private val MORE_SCREENS = listOf(
    SecondaryScreen.Cameras, SecondaryScreen.Missing, SecondaryScreen.Incidents,
    SecondaryScreen.Assistant, SecondaryScreen.Teams, SecondaryScreen.UrgentContact,
    SecondaryScreen.Notifications, SecondaryScreen.Profile,
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CrowdShieldNavHost() {
    var isLoggedIn by remember { mutableStateOf(false) }
    var role by remember { mutableStateOf("COMMANDER") }
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    if (!isLoggedIn) {
        LoginScreen(onLogin = { r -> role = r; isLoggedIn = true })
        return
    }

    val isCommander = role == "COMMANDER"

    // Filter More screens by role
    val accessibleMoreScreens = MORE_SCREENS.filter {
        when (it) {
            SecondaryScreen.Cameras, SecondaryScreen.Incidents,
            SecondaryScreen.Assistant, SecondaryScreen.Teams -> isCommander
            else -> true
        }
    }

    Scaffold(
        containerColor = CsBg,
        bottomBar = {
            NavigationBar(
                containerColor = CsBg.copy(alpha = 0.95f),
                tonalElevation = 0.dp,
                modifier = Modifier
                    .border(0.5.dp, CsGlassBorder)
                    .height(60.dp),
            ) {
                CORE_SCREENS.forEach { screen ->
                    val selected = currentRoute == screen.route
                    NavigationBarItem(
                        icon = {
                            Icon(
                                screen.icon,
                                contentDescription = screen.label,
                                modifier = Modifier.size(22.dp),
                            )
                        },
                        label = {
                            Text(
                                screen.label,
                                fontSize = 10.sp,
                                maxLines = 1,
                            )
                        },
                        onClick = {
                            navController.navigate(screen.route) {
                                popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        selected = selected,
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = CsRed,
                            selectedTextColor = CsRed,
                            unselectedIconColor = CsTextMuted,
                            unselectedTextColor = CsTextMuted,
                            indicatorColor = CsRed.copy(alpha = 0.1f),
                        ),
                    )
                }
            }
        },
        topBar = {
            val title = when (currentRoute) {
                Screen.Dashboard.route -> "CrowdShield"
                Screen.Zones.route -> "Zones"
                Screen.DeviceCamera.route -> "Camera"
                Screen.Alerts.route -> "Alerts"
                Screen.More.route -> "More"
                else -> MORE_SCREENS.find { it.route == currentRoute }?.label ?: "CrowdShield"
            }
            CenterAlignedTopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(title, fontWeight = FontWeight.Bold, letterSpacing = 0.5.sp)
                    }
                },
                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                    containerColor = CsBg,
                    titleContentColor = CsText,
                ),
            )
        },
    ) { paddingValues ->
        NavHost(
            navController = navController,
            startDestination = Screen.Dashboard.route,
            modifier = Modifier.padding(paddingValues),
        ) {
            composable(Screen.Dashboard.route) {
                DashboardScreen(
                    onNavigateToAlerts = { navController.navigate(Screen.Alerts.route) },
                    onNavigateToZones = { navController.navigate(Screen.Zones.route) },
                )
            }
            composable(Screen.Zones.route) { ZonesScreen() }
            composable(Screen.DeviceCamera.route) { DeviceCameraScreen() }
            composable(Screen.Alerts.route) { AlertsScreen() }
            composable(Screen.More.route) {
                MoreScreen(
                    screens = accessibleMoreScreens,
                    onNavigate = { route ->
                        navController.navigate(route)
                    },
                    onSignOut = {
                        isLoggedIn = false
                        navController.navigate(Screen.Dashboard.route) {
                            popUpTo(Screen.Dashboard.route) { inclusive = true }
                        }
                    },
                    role = role,
                )
            }
            // Secondary screens
            composable(SecondaryScreen.Cameras.route) { CamerasScreen() }
            composable(SecondaryScreen.Missing.route) { MissingScreen() }
            composable(SecondaryScreen.Incidents.route) { IncidentsScreen() }
            composable(SecondaryScreen.Assistant.route) { AssistantScreen() }
            composable(SecondaryScreen.Teams.route) { TeamsScreen() }
            composable(SecondaryScreen.UrgentContact.route) { UrgentContactScreen() }
            composable(SecondaryScreen.Notifications.route) { NotificationsScreen() }
            composable(SecondaryScreen.Profile.route) {
                ProfileScreen(onSignOut = {
                    isLoggedIn = false
                    navController.navigate(Screen.Dashboard.route) {
                        popUpTo(Screen.Dashboard.route) { inclusive = true }
                    }
                })
            }
        }
    }
}

@Composable
fun MoreScreen(
    screens: List<SecondaryScreen>,
    onNavigate: (String) -> Unit,
    onSignOut: () -> Unit,
    role: String,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        // Role badge
        Card(
            modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
            colors = CardDefaults.cardColors(containerColor = CsSurface),
            shape = RoundedCornerShape(10.dp),
        ) {
            Row(
                modifier = Modifier.padding(14.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(Icons.Default.Person, contentDescription = null, tint = CsRed, modifier = Modifier.size(24.dp))
                Spacer(modifier = Modifier.width(10.dp))
                Column {
                    Text("Operator", fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = CsText)
                    Text(role, fontSize = 11.sp, color = CsTextMuted)
                }
            }
        }

        // Menu items
        screens.forEach { screen ->
            Card(
                modifier = Modifier.fillMaxWidth().clickable { onNavigate(screen.route) },
                colors = CardDefaults.cardColors(containerColor = CsSurface),
                shape = RoundedCornerShape(8.dp),
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Icon(screen.icon, contentDescription = null, tint = CsTextMuted, modifier = Modifier.size(20.dp))
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(screen.label, fontSize = 14.sp, color = CsText, modifier = Modifier.weight(1f))
                    Icon(Icons.Default.ChevronRight, contentDescription = null, tint = CsTextMuted, modifier = Modifier.size(16.dp))
                }
            }
        }

        Spacer(modifier = Modifier.weight(1f))

        // Sign out
        Card(
            modifier = Modifier.fillMaxWidth().clickable { onSignOut() },
            colors = CardDefaults.cardColors(containerColor = CsRed.copy(alpha = 0.1f)),
            shape = RoundedCornerShape(8.dp),
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(Icons.Default.Logout, contentDescription = null, tint = CsRed, modifier = Modifier.size(20.dp))
                Spacer(modifier = Modifier.width(12.dp))
                Text("Sign Out", fontSize = 14.sp, color = CsRed, fontWeight = FontWeight.SemiBold)
            }
        }
    }
}
