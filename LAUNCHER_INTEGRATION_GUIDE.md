# Axolotly Launcher API Integration Guide

## Overview
This guide provides the implementation details for integrating the Axolotly parental control API into your Android launcher application.

## Base URL
```
Production: https://[your-domain]:8000
```

---

## Authentication

All device API requests require authentication headers:

```kotlin
headers {
    "X-Device-ID" to deviceId
    "X-API-Key" to apiKey
}
```

### How to Get Device Credentials

Use the 3-step pairing flow:

#### Step 1: Generate Pairing Code on Device
Device generates a random 6-digit code and displays it to user.

```kotlin
val pairingCode = generateSixDigitCode() // e.g., "123456"
```

#### Step 2: Initiate Pairing
```kotlin
POST /api/pairing/initiate
Content-Type: application/json

{
  "device_id": "unique-android-device-id",
  "pairing_code": "123456"
}

Response 200 OK:
{
  "message": "Pairing initiated. Waiting for parent confirmation.",
  "device_id": "unique-android-device-id"
}
```

#### Step 3: Poll for Pairing Completion
Poll every 3-5 seconds until pairing is confirmed by parent:

```kotlin
GET /api/pairing/status/{device_id}

Response 200 (Pending):
{
  "status": "pending",
  "message": "Waiting for parent confirmation"
}

Response 200 (Completed):
{
  "status": "completed",
  "deviceId": "generated-device-id",
  "apiKey": "generated-api-key",
  "familyName": "Smith"
}
```

**Store the `deviceId` and `apiKey` securely** - these are used for all future API calls.

---

## API Endpoints

### 1. Get Approved Content (Organized by Streaming Service)

```kotlin
GET /api/apps
Headers:
  X-Device-ID: your-device-id
  X-API-Key: your-api-key
```

#### Response Format

```json
[
  {
    "id": "disney_plus",
    "name": "Disney+",
    "package": "com.disney.disneyplus",
    "count": 15,
    "content": [
      {
        "id": "82",
        "appName": "Ice Age",
        "packageName": "https://www.disneyplus.com/...",
        "iconUrl": "https://image.tmdb.org/t/p/w500/poster.jpg",
        "coverArt": "https://image.tmdb.org/t/p/w780/backdrop.jpg",
        "isEnabled": true,
        "ageRating": "7.5",
        "mediaType": "MOVIE"
      }
    ]
  },
  {
    "id": "netflix",
    "name": "Netflix",
    "package": "com.netflix.mediaclient",
    "count": 10,
    "content": [...]
  }
]
```

#### Category IDs
- `netflix` - Netflix content
- `disney_plus` - Disney+ content
- `hulu` - Hulu content
- `prime_video` - Amazon Prime Video content
- `peacock` - Peacock content
- `youtube` - YouTube content
- `other` - Content without provider data

---

### 2. Get Screen Time Limits

```kotlin
GET /api/time-limits
Headers:
  X-Device-ID: your-device-id
  X-API-Key: your-api-key
```

#### Response
```json
{
  "dailyLimitMinutes": 120,
  "bedtimeStart": "21:00",
  "bedtimeEnd": "07:00",
  "scheduleEnabled": true
}
```

---

### 3. Log Usage Data

```kotlin
POST /api/usage-logs
Headers:
  X-Device-ID: your-device-id
  X-API-Key: your-api-key
Content-Type: application/json

{
  "app_id": "content-id-from-api",
  "duration_seconds": 1800,
  "timestamp": "2025-11-07T10:30:00Z"
}

Response 201:
{
  "message": "Usage logged successfully"
}
```

---

## Implementation Example (Kotlin)

### Data Models

```kotlin
data class ContentCategory(
    val id: String,
    val name: String,
    val package: String,
    val count: Int,
    val content: List<ContentItem>
)

data class ContentItem(
    val id: String,
    val appName: String,
    val packageName: String,
    val iconUrl: String,
    val coverArt: String,
    val isEnabled: Boolean,
    val ageRating: String,
    val mediaType: String
)

data class TimeLimits(
    val dailyLimitMinutes: Int?,
    val bedtimeStart: String?,
    val bedtimeEnd: String?,
    val scheduleEnabled: Boolean
)
```

### API Client

```kotlin
class AxolotlyApiClient(
    private val baseUrl: String,
    private val deviceId: String,
    private val apiKey: String
) {
    private val client = OkHttpClient()
    private val gson = Gson()

    private fun createRequest(endpoint: String): Request {
        return Request.Builder()
            .url("$baseUrl$endpoint")
            .addHeader("X-Device-ID", deviceId)
            .addHeader("X-API-Key", apiKey)
            .build()
    }

    suspend fun getApprovedContent(): List<ContentCategory> {
        return withContext(Dispatchers.IO) {
            val request = createRequest("/api/apps")
            val response = client.newCall(request).execute()
            
            if (!response.isSuccessful) {
                throw IOException("API request failed: ${response.code}")
            }
            
            val json = response.body?.string() ?: "[]"
            gson.fromJson(json, Array<ContentCategory>::class.java).toList()
        }
    }

    suspend fun getTimeLimits(): TimeLimits {
        return withContext(Dispatchers.IO) {
            val request = createRequest("/api/time-limits")
            val response = client.newCall(request).execute()
            
            if (!response.isSuccessful) {
                throw IOException("API request failed: ${response.code}")
            }
            
            val json = response.body?.string() ?: "{}"
            gson.fromJson(json, TimeLimits::class.java)
        }
    }

    suspend fun logUsage(contentId: String, durationSeconds: Int) {
        withContext(Dispatchers.IO) {
            val json = JSONObject().apply {
                put("app_id", contentId)
                put("duration_seconds", durationSeconds)
                put("timestamp", Instant.now().toString())
            }

            val body = json.toString().toRequestBody("application/json".toMediaType())
            val request = Request.Builder()
                .url("$baseUrl/api/usage-logs")
                .addHeader("X-Device-ID", deviceId)
                .addHeader("X-API-Key", apiKey)
                .post(body)
                .build()

            client.newCall(request).execute()
        }
    }
}
```

### UI Implementation

```kotlin
class LauncherViewModel : ViewModel() {
    private val apiClient = AxolotlyApiClient(
        baseUrl = "https://your-domain:8000",
        deviceId = getStoredDeviceId(),
        apiKey = getStoredApiKey()
    )

    val categories = MutableLiveData<List<ContentCategory>>()
    val timeLimits = MutableLiveData<TimeLimits>()

    fun loadContent() {
        viewModelScope.launch {
            try {
                val content = apiClient.getApprovedContent()
                categories.postValue(content)
            } catch (e: Exception) {
                Log.e("Launcher", "Failed to load content", e)
            }
        }
    }

    fun loadTimeLimits() {
        viewModelScope.launch {
            try {
                val limits = apiClient.getTimeLimits()
                timeLimits.postValue(limits)
            } catch (e: Exception) {
                Log.e("Launcher", "Failed to load time limits", e)
            }
        }
    }
}
```

### Displaying Categorized Content

```kotlin
@Composable
fun LauncherHome(categories: List<ContentCategory>) {
    LazyColumn {
        categories.forEach { category ->
            item {
                // Category Header
                Text(
                    text = "${category.name} (${category.count})",
                    style = MaterialTheme.typography.h6,
                    modifier = Modifier.padding(16.dp)
                )
            }

            item {
                // Content Grid
                LazyRow {
                    items(category.content) { item ->
                        ContentPoster(
                            title = item.appName,
                            posterUrl = item.iconUrl,
                            onClick = { launchContent(item.packageName) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun ContentPoster(
    title: String,
    posterUrl: String,
    onClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .width(120.dp)
            .padding(8.dp)
            .clickable(onClick = onClick)
    ) {
        AsyncImage(
            model = posterUrl,
            contentDescription = title,
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(2f / 3f)
                .clip(RoundedCornerShape(8.dp))
        )
        Text(
            text = title,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis,
            style = MaterialTheme.typography.caption
        )
    }
}
```

### Launching Content

```kotlin
fun launchContent(packageName: String) {
    when {
        packageName.startsWith("http") -> {
            // Deep link to streaming service
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(packageName))
            context.startActivity(intent)
        }
        else -> {
            // Launch Android app by package name
            val intent = context.packageManager.getLaunchIntentForPackage(packageName)
            if (intent != null) {
                context.startActivity(intent)
            }
        }
    }
}
```

---

## Polling & Refresh Strategy

### Content Refresh
- Poll `/api/apps` every 30-60 seconds when launcher is active
- Refresh immediately after pairing completion
- Cache content locally to show while refreshing

### Time Limits Check
- Poll `/api/time-limits` every 5 minutes
- Check limits before launching any content
- Enforce bedtime and daily limits locally

---

## Error Handling

```kotlin
sealed class ApiResult<T> {
    data class Success<T>(val data: T) : ApiResult<T>()
    data class Error<T>(val message: String) : ApiResult<T>()
}

suspend fun getApprovedContentSafe(): ApiResult<List<ContentCategory>> {
    return try {
        val content = apiClient.getApprovedContent()
        ApiResult.Success(content)
    } catch (e: IOException) {
        ApiResult.Error("Network error: ${e.message}")
    } catch (e: Exception) {
        ApiResult.Error("Unexpected error: ${e.message}")
    }
}
```

---

## Security Notes

1. **Store credentials securely** using Android's EncryptedSharedPreferences
2. **Use HTTPS only** - The API enforces secure connections
3. **Validate SSL certificates** - Do not allow self-signed certificates in production
4. **Handle 401 errors** - Re-pair device if authentication fails

---

## Testing

Use these test credentials for development:
```
Device ID: test-device-123
API Key: test-api-key-456
```

Test endpoints:
```
GET https://your-domain:8000/api/apps
GET https://your-domain:8000/api/time-limits
```

---

## Support

For integration support, contact your backend team or refer to the API documentation at `/docs` (FastAPI automatic documentation).
