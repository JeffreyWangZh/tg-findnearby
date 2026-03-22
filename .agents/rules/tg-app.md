---
trigger: always_on
---

# Role: Senior Full-Stack Developer & Telegram Mini App Expert

# Project: "NearbyPulse Pro" - Crowdsourced Local Business & Merchant Growth Platform

# Context: 
Extend the Telegram Mini App to allow users to crowdsource merchant data (including social links and media) and provide a dedicated "Merchant Training" module for business owners.

# Updated Tech Stack:
- Frontend: React.js (Vite), Tailwind CSS, Shadcn UI.
- Backend: Node.js (Express/FastAPI).
- Storage: Supabase Storage or AWS S3 (for merchant photos/videos).
- Database: PostgreSQL with PostGIS.
- TG Integration: @twa-dev/sdk, Telegram Bot API (for notifications).

# New Core Modules & Logic:

## 1. Crowdsourced Merchant Submission (UGC)
- **Submission Form**: A multi-step form for users to add new merchants.
    - **Basic Info**: Name, Category, Physical Address.
    - **Contact Integration**: Field for "Owner's Telegram ID/Username". Automatically format as `t.me/username`.
    - **Media Upload**: Support for multiple photos and short video clips (max 20MB). 
    - **Location Picker**: Integration with Mapbox/Google Maps to pin the exact coordinates.
- **Review System**: A simple status for submissions (Pending, Approved, Rejected) visible to the submitter.

## 2. Media Handling Logic
- Implement a pre-signed URL upload flow to S3/Supabase.
- Frontend image compression before upload to save bandwidth within Telegram.
- Video playback optimization for mobile (HTML5 video player).

## 3. Merchant Training & Growth Module (Knowledge Base)
- **Content Hub**: A section containing articles or video tutorials for merchants (e.g., "How to get more customers via TG", "Setting up your TG Bot").
- **Categorization**: Group training materials by "Beginner", "Marketing", "Operations".
- **Interactive Element**: Ability for users to "Save" or "Bookmark" training sessions.

## 4. User-Merchant Interaction
- **One-Click Connect**: A prominent "Contact Boss" button on the merchant profile that opens a direct Telegram DM with the owner.
- **Contribution Points**: (Optional) Gamification logic where users get points/badges for adding verified merchants or training materials.

# Technical Requirements:
- **Database Schema Updates**:
    - `merchants` table: Add `owner_tg_id`, `media_urls` (JSONB array), `status`, `submitted_by_user_id`.
    - `training_materials` table: `id`, `title`, `content_type` (video/article), `url`, `category`.
- **Telegram Features**: 
    - Use `Telegram.WebApp.showConfirm` before submitting data.
    - Use `Telegram.WebApp.openTelegramLink` for the owner's contact.
    - Sync UI colors with `--tg-theme-secondary-bg-color` for the form fields.

# Prompt Instructions:
1. Generate the updated Database Schema (SQL).
2. Create the "Add Merchant" multi-step form component with media upload UI.
3. Design the "Merchant Training" listing page with a clean, educational layout.
4. Implement the logic to link the "Contact Boss" button to a Telegram chat.