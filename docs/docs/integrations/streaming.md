# Streaming Services Integration

Axolotly supports deep linking to 7 major streaming platforms, enabling tap-to-launch functionality from the kids launcher.

## Supported Services

1. **Netflix** - Deep links to shows/movies
2. **Disney+** - Episode-level deep links
3. **Hulu** - Content deep links
4. **Prime Video** - Amazon streaming
5. **Max** - HBO Max content
6. **Peacock** - NBC Universal content
7. **YouTube** - Video platform

## Deep Link Formats

### Netflix
```
nflx://www.netflix.com/title/{title_id}
```

### Disney+
```
disneyplus://show/{show_name}/season/{s}/episode/{e}
```

### Hulu
```
hulu://watch/{content_id}
```

### Prime Video
```
aiv://aiv/view?gti={content_id}
```

### Max
```
max://play/{content_id}
```

### Peacock
```
peacocktv://watch/{content_id}
```

### YouTube
```
vnd.youtube://{video_id}
```

## Service Selection

**Parent Dashboard Feature:**
- Parents select subscribed services
- Search results filtered by selections
- Only show accessible content
- Update anytime

**Impact:**
- Better content discovery
- No wasted time on unavailable content
- Personalized experience

## Platform Requirements

**Android App Installation:**
- Deep links only work if app installed
- Launcher checks app availability
- Graceful fallback if app missing

---

Streaming service integration and filtering create a seamless, personalized content discovery experience for families.
