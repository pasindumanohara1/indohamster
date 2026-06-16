# Eporner API v2 Documentation

Base endpoint: `https://www.eporner.com/api/v2/METHOD/`

All calls use HTTP GET. Responses available in JSON or XML.

---

## Methods

### Search `/api/v2/video/search/`

Search for videos matching criteria. Paginated with max 1000 results per page.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `query` | String | `all` | Search query (e.g. `teen`, `anal milf`). Use `all` for all videos |
| `per_page` | Integer | 30 | Results per page (1-1000) |
| `page` | Integer | 1 | Page number (1 to total_pages) |
| `thumbsize` | String | `medium` | Thumbnail size: `small` (190x152), `medium` (427x240), `big` (640x360) |
| `order` | String | `latest` | Sort order: `latest`, `longest`, `shortest`, `top-rated`, `most-popular`, `top-weekly`, `top-monthly` |
| `gay` | Integer | 0 | Gay content: 0 = exclude, 1 = include, 2 = only gay |
| `lq` | Integer | 1 | Low quality: 0 = exclude, 1 = include, 2 = only low quality |
| `format` | String | `json` | Response format: `json` or `xml` |

**Example call:**

```
https://www.eporner.com/api/v2/video/search/?query=teen&per_page=10&page=2&thumbsize=big&order=top-weekly&gay=1&lq=1&format=json
```

### ID `/api/v2/video/id/`

Get information about a specific video by ID. Also checks if a video is still available.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `id` | String | required | Video ID |
| `thumbsize` | String | `medium` | Thumbnail size: `small`, `medium`, `big` |
| `format` | String | `json` | Response format: `json` or `xml` |

**Example call:**

```
https://www.eporner.com/api/v2/video/id/?id=ozKfC3UC2Wl&thumbsize=big&format=json
```

### Removed `/api/v2/video/removed/`

Return list of all removed video IDs.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `format` | String | `json` | Response format: `json` or `xml` |

---

## Response Fields (video object)

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Unique video identifier |
| `title` | String | Video title |
| `keywords` | String | Comma-separated keywords |
| `views` | Integer | View count |
| `rate` | String | Rating (e.g. "4.13") |
| `url` | String | Video page URL |
| `added` | String | Date added (Y-m-d H:i:s) |
| `length_sec` | Integer | Duration in seconds |
| `length_min` | String | Duration formatted (M:SS) |
| `embed` | String | Embed URL |
| `default_thumb` | Object | Default thumbnail with `size`, `width`, `height`, `src` |
| `thumbs` | Array | Array of thumbnail objects with `size`, `width`, `height`, `src` |

---

## Sample JSON Response

```json
{
  "count": 10,
  "start": 0,
  "per_page": 10,
  "page": 2,
  "time_ms": 5,
  "total_count": 100000,
  "total_pages": 10000,
  "videos": [
    {
      "id": "IsabYDAiqXa",
      "title": "Young Teen Heather",
      "keywords": "Teen, Petite, Young, ...",
      "views": 260221,
      "rate": "4.13",
      "url": "https://www.eporner.com/hd-porn/IsabYDAiqXa/Young-Teen-Heather/",
      "added": "2019-11-21 11:42:47",
      "length_sec": 2539,
      "length_min": "42:19",
      "embed": "https://www.eporner.com/embed/IsabYDAiqXa/",
      "default_thumb": {
        "size": "big",
        "width": 640,
        "height": 360,
        "src": "https://static-ca-cdn.eporner.com/thumbs/static4/3/30/305/3054537/5_360.jpg"
      },
      "thumbs": [
        {"size": "big", "width": 640, "height": 360, "src": "https://..."}
      ]
    }
  ]
}
```

---

## Code Examples

PHP examples are available in the `examples/` directory:

- `examples/php_example_1.php` — Basic looped search for "anal" videos with pagination
- `examples/php_example_2.php` — Advanced search (1000 per page, most-popular order, big thumbs)
- `examples/php_example_3.php` — Fetch single video by ID with all fields
