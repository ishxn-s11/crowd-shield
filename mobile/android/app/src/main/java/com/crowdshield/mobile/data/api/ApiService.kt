package com.crowdshield.mobile.data.api

import com.crowdshield.mobile.data.model.*
import retrofit2.http.*

interface ApiService {

    // ─── Risk & Zones ──────────────────────────────────────────
    @GET("/api/risk/live")
    suspend fun getRiskLive(): RiskState

    // ─── Alerts ────────────────────────────────────────────────
    @GET("/api/alerts/active")
    suspend fun getActiveAlerts(): List<Alert>

    @POST("/api/alerts/{id}/acknowledge")
    suspend fun acknowledgeAlert(@Path("id") id: String): Any

    // ─── Missing Persons ───────────────────────────────────────
    @GET("/api/missing/persons")
    suspend fun getMissingPersons(@Query("status") status: String = "MISSING"): List<MissingPerson>

    @POST("/api/missing/persons")
    suspend fun createMissingPerson(@Body data: CreateMissingPersonRequest): Any

    // ─── Missing Items ─────────────────────────────────────────
    @GET("/api/missing/items")
    suspend fun getMissingItems(@Query("status") status: String = "MISSING"): List<MissingItem>

    @POST("/api/missing/items")
    suspend fun createMissingItem(@Body data: CreateMissingItemRequest): Any

    @PATCH("/api/missing/{type}/{id}")
    suspend fun updateMissingStatus(
        @Path("type") type: String,
        @Path("id") id: String,
        @Body body: Map<String, String>
    ): Any

    // ─── Incidents ─────────────────────────────────────────────
    @GET("/api/incidents")
    suspend fun getIncidents(): List<Incident>

    // ─── Teams ─────────────────────────────────────────────────
    @GET("/api/teams")
    suspend fun getTeams(): List<Team>

    @POST("/api/teams")
    suspend fun createTeam(@Body data: CreateTeamRequest): Any

    // ─── AI Assistant ──────────────────────────────────────────
    @POST("/api/ai/chat")
    suspend fun chat(@Body body: Map<String, String>): ChatResponse

    // ─── Simulation ────────────────────────────────────────────
    @POST("/api/simulation/start")
    suspend fun startSimulation(@Body body: Map<String, String>): Any

    @POST("/api/simulation/stop")
    suspend fun stopSimulation(): Any
}
