# YouTube Integration Requirements for Luminos

## 1. Integration Model & Scope

### 1.1 Application Context
This document outlines the integration of YouTube-hosted videos into the Luminos platform. The goal is to allow users (e.g., photographers) to seamlessly embed videos within their existing **Galleries**, **Albums**, and **Digital Invitations**, presenting them to **Clients** as a first-class media type alongside photos.

### 1.2 Core Principles
- **External Hosting:** Luminos shall use YouTube as the sole video hosting and streaming platform; the application will not store or stream raw video files.
- **Metadata-Driven:** Luminos will act as a presentation and metadata layer. Video metadata (titles, associations, sort order) will be stored in the application's **PostgreSQL database**, while the video content is streamed from YouTube.
- **Link-Based:** The integration shall only support linking to existing YouTube videos (public or unlisted). Uploading or managing videos inside YouTube via Luminos is out of scope.

## 2. Video Registration in the Application
- Users shall be able to register a video against a Gallery or Album by pasting a full YouTube URL or a raw YouTube Video ID into the Luminos UI.
- On save, Luminos shall:
    1. Normalize and extract the canonical Video ID.
    2. Validate that the ID is a valid YouTube identifier.
    3. Store the Video ID and any related metadata (title, description, sort order) in the **PostgreSQL** database, linked to the corresponding Gallery/Album.
- The system shall support associating multiple videos with a single Gallery and defining a configurable display order.

## 3. Embedded Playback Experience (YouTube Player)
- Luminos shall embed videos using the official YouTube IFrame Player API to ensure compliance and control.
- Videos shall be rendered inline within Luminos components (e.g., **MediaViewer**, **AlbumDetailView**), so clients perceive them as part of the Luminos experience.
- The player configuration shall:
    - Hide YouTube branding and related videos as much as the API allows.
    - Disable autoplay by default.
    - Prevent automatic navigation to the YouTube website.
- The embedded player must be responsive and scale correctly across all devices.

## 4. Application UX Requirements
- In the client view, videos shall appear as first-class gallery items, with thumbnails and titles, consistent with how photos are displayed.
- Clicking a video item shall open it within the **MediaViewer** component, likely in a lightbox/modal overlay.
- The UI shall not expose raw YouTube URLs to end clients.
- A "Play" icon overlay shall be displayed on video thumbnails to distinguish them from static photos.

## 5. Performance & Bandwidth
- All video streaming bandwidth is handled directly between the client's browser and YouTube's servers. The Luminos backend will not proxy or transcode video streams.
- Luminos will serve only the metadata and assets required to instantiate the YouTube player.
- Thumbnails may be loaded from YouTube's generated URLs or be replaced by custom thumbnails uploaded by the user.

## 6. Security, Privacy & Limitations
- The integration will support public and unlisted YouTube videos. It will not support YouTube's "private" mode, which requires viewers to be logged into specific Google accounts.
- Documentation for photographers must clearly state that "unlisted" does not mean "secure." Anyone with the link can view the video.
- Access control (e.g., gallery passwords) is enforced at the Luminos application layer only and cannot prevent a user from sharing the raw YouTube link if they discover it.

## 7. No Backend Video Management
- Luminos will not store, process, transcode, or modify original video files on its servers. All video management remains the responsibility of the user within their own YouTube account.

## 8. Error Handling & Fallbacks
- If a linked YouTube video becomes unavailable (removed, made private, etc.), the Luminos UI shall display a graceful error state, such as a placeholder card with a "Video unavailable" message.
- The photographer/admin dashboard should provide a way to identify and fix these broken video links.

## 9. Optional Future Extensions (Non-MVP)
- **YouTube Data API Integration:** Use the YouTube Data API (with OAuth) to automatically fetch video metadata (title, duration, thumbnail) when a new video is linked, reducing manual input.
- **Application-Level Analytics:** Use player events to track metrics like play count and watch time, providing insights to the photographer.
- **Vector-Based Similarity Search:** In line with the use of **pgvector** for images, generate vector embeddings from video thumbnails or titles/descriptions. This would enable a "find similar videos" feature within a photographer's collection, creating feature synergy across media types.