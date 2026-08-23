package com.crowdshield.mobile

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build

class CrowdShieldApp : Application() {

    companion object {
        const val CHANNEL_ALERTS = "crowdshield_alerts"
        const val CHANNEL_COMMANDER = "crowdshield_commander"
        const val CHANNEL_URGENT = "crowdshield_urgent"
        const val CHANNEL_ACK = "crowdshield_ack"
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannels()
    }

    private fun createNotificationChannels() {
        val channels = listOf(
            NotificationChannel(
                CHANNEL_ALERTS,
                "Crowd Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Critical crowd safety alerts and surge warnings"
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 300, 200, 300)
            },
            NotificationChannel(
                CHANNEL_COMMANDER,
                "Commander Messages",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Messages from commander to response teams"
                enableVibration(true)
            },
            NotificationChannel(
                CHANNEL_URGENT,
                "Urgent Contact",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Emergency contact from operators to commander"
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 500, 200, 500, 200, 500)
            },
            NotificationChannel(
                CHANNEL_ACK,
                "Acknowledgements",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Acknowledgement of alerts and incidents"
            },
        )

        val notificationManager = getSystemService(NotificationManager::class.java)
        channels.forEach { channel ->
            notificationManager.createNotificationChannel(channel)
        }
    }
}
