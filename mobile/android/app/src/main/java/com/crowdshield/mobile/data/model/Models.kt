package com.crowdshield.mobile.data.model

import kotlinx.serialization.Serializable

@Serializable
data class RiskState(
    val overall_risk: Double = 0.0,
    val overall_risk_level: String = "LOW",
    val zones: Map<String, ZoneData> = emptyMap()
)

@Serializable
data class ZoneData(
    val name: String = "",
    val risk_score: Double = 0.0,
    val risk_level: String = "LOW",
    val person_count: Int = 0,
    val density: Double = 0.0,
    val avg_velocity: Double = 0.0,
    val flow_conflict: Double = 0.0,
    val bottleneck_score: Double = 0.0,
)

@Serializable
data class Alert(
    val id: String = "",
    val title: String = "",
    val message: String = "",
    val severity: String = "MODERATE",
    val zone_id: String = "",
    val created_at: String = "",
    val status: String = "ACTIVE",
)

@Serializable
data class MissingPerson(
    val id: String = "",
    val name: String = "",
    val age: Int = 0,
    val gender: String = "",
    val description: String = "",
    val last_seen_zone: String = "",
    val clothing: String = "",
    val height: String = "",
    val reporter_name: String = "",
    val reporter_contact: String = "",
    val status: String = "MISSING",
)

@Serializable
data class MissingItem(
    val id: String = "",
    val item_name: String = "",
    val category: String = "",
    val last_seen_zone: String = "",
    val status: String = "MISSING",
)

@Serializable
data class Incident(
    val id: String = "",
    val type: String = "",
    val severity: String = "MODERATE",
    val zone: String = "",
    val time: String = "",
    val status: String = "active",
    val reported: String = "",
)

@Serializable
data class Team(
    val id: String = "",
    val name: String = "",
    val members: Int = 0,
    val status: String = "standby",
    val leader: String = "",
    val zone: String = "",
    val specialty: String = "",
)

@Serializable
data class ChatResponse(
    val response: String = "",
    val message: String = "",
)

@Serializable
data class LoginRequest(
    val email: String,
    val password: String,
)

@Serializable
data class RegisterRequest(
    val name: String,
    val email: String,
    val password: String,
    val role: String,
)

@Serializable
data class CreateMissingPersonRequest(
    val name: String,
    val age: Int = 0,
    val gender: String = "",
    val description: String = "",
    val last_seen_zone: String = "",
    val clothing: String = "",
    val height: String = "",
    val reporter_name: String = "",
    val reporter_contact: String = "",
)

@Serializable
data class CreateMissingItemRequest(
    val item_name: String,
    val category: String = "",
    val last_seen_zone: String = "",
)

@Serializable
data class CreateTeamRequest(
    val name: String,
    val specialty: String = "",
    val zone: String = "",
    val leader: String = "",
)
