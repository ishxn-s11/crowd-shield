package com.crowdshield.mobile.ui.navigation

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.crowdshield.mobile.ui.screens.*
import com.crowdshield.mobile.ui.theme.*

sealed class Screen(val route: String, val label: String, val icon: ImageVector, val commanderOnly: Boolean = false) {
    data object Dashboard : Screen("dashboard", "Dashboard", Icons.Default.GridOn)
    data object Zones : Screen("zones", "Zones", Icons.Default.Map)
    data object Cameras : Screen("cameras", "Cameras", Icons.Default.Videocam, commanderOnly = true)
    data object DeviceCamera : Screen("device_cam", "Device Cam", Icons.Default.PhoneAndroid)
    data object Alerts : Screen("alerts", "Alerts", Icons.Default.Notifications)
    data object Missing : Screen("missing", "Missing", Icons.Default.Search)
    data object Incidents : Screen("incidents", "Incidents", Icons.Default.Warning, commanderOnly = true)
    data object Assistant : Screen("assistant", "Assistant", Icons.Default.AutoAwesome, commanderOnly = true)
    data object Teams : Screen("teams", "Teams", Icons.Default.People, commanderOnly = true)
    data object UrgentContact : Screen("urgent_contact", "Urgent", Icons.Default.Phone, commanderOnly = false)
    data object Notifications : Screen("notifications", "Notifs", Icons.Default.NotificationsActive, commanderOnly = false)
    data object Profile : Screen("profile", "Profile", Icons.Default.Person)
}

private val ALL_SCREENS = listOf(
    Screen.Dashboard, Screen.Zones, Screen.Cameras, Screen.DeviceCamera,
    Screen.Alerts, Screen.Missing, Screen.Incidents, Screen.Assistant,
    Screen.Teams, Screen.UrgentContact, Screen.Notifications, Screen.Profile,
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

    val screens = ALL_SCREENS.filter { !it.commanderOnly || role == "COMMANDER" }

    Scaffold(
        containerColor = CsBg,
        bottomBar = {
            NavigationBar(
                containerColor = CsBg.copy(alpha = 0.95f),
                tonalElevation = 0.dp,
                modifier = Modifier
                    .border(1.dp, CsGlassBorder)
                    .height(64.dp),
            ) {
                screens.forEach { screen ->
                    val selected = currentRoute == screen.route
                    NavigationBarItem(
                        icon = {
                            Icon(
                                screen.icon,
                                contentDescription = screen.label,
                                modifier = Modifier.size(20.dp),
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
            val title = screens.find { it.route == currentRoute }?.label ?: "CrowdShield"
            CenterAlignedTopAppBar(
                title = {
                    Text(title, fontWeight = androidx.compose.ui.text.font.FontWeight.Bold, letterSpacing = 0.5.sp)
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
            composable(Screen.Cameras.route) { CamerasScreen() }
            composable(Screen.DeviceCamera.route) { DeviceCameraScreen() }
            composable(Screen.Alerts.route) { AlertsScreen() }
            composable(Screen.Missing.route) { MissingScreen() }
            composable(Screen.Incidents.route) { IncidentsScreen() }
            composable(Screen.Assistant.route) { AssistantScreen() }
            composable(Screen.Teams.route) { TeamsScreen() }
            composable(Screen.UrgentContact.route) { UrgentContactScreen() }
            composable(Screen.Notifications.route) { NotificationsScreen() }
            composable(Screen.Profile.route) {
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
