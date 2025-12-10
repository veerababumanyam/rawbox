# Digital Invitation Service Requirements

## 1.0 Introduction

### 1.1 Purpose

This document outlines the functional requirements for a new Digital Invitation Service within the core application. This service will enable users to create, manage, and share culturally-appropriate digital invitations for various events.

### 1.2 Scope

The scope of this project includes the user interface for creating and managing invitations, backend logic for data handling, and the rendering of the final invitation. The initial focus is on Indian cultural events and languages.

## 2.0 Functional Requirements (FRs)

### 2.1 Core Service Functionality

#### 2.1.1 Invitation Creation & Management (UI/Backend Logic)

| ID      | Requirement               | Description                                                                                                                                                             | Integration Point              | Priority |
| :------ | :------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------- | :------- |
| FR1.1   | User Dashboard (CRUD)     | The application shall introduce a new "Invitations" module/route displaying a grid view of all user-owned invitations, allowing for creation, editing, duplication, and deletion. | New Frontend Route (/invitations) | High     |
| FR1.2   | Wizard-Based Creation     | The application shall implement a 3-step creation wizard (Event Details, Template & Customization, Images & Publishing) within the main application UI to guide users.     | New Frontend Component         | High     |
| FR1.3   | Event Detail Input        | The wizard shall capture mandatory details: Event Type (from a predefined list including Indian festivals), Title, Host Name(s), Date/Time, and Language (supporting English and 5 regional languages). | Existing Business Logic Layer  | High     |
| FR1.4   | Venue and Map Integration | The application shall accept a Venue Name/Address and a Google Maps Link for embedding.                                                                                 | Frontend & Backend Data Model  | Medium   |
| FR1.5   | Multi-Language Content    | The application shall allow selection of content languages (e.g., English, Telugu) and apply corresponding regional language fonts through existing i18n/font libraries.  | Existing i18n/L10n Framework   | High     |
| FR1.6   | Draft Management          | Users shall be able to save an invitation at any point as a Draft using the existing application's database connection.                                                    | Existing ORM/Repository Layer  | High     |
| FR1.7   | Dedicated Sidebar (UX)    | The creation wizard shall include a Dedicated Sidebar with predefined, culturally relevant values for one-click application to accelerate creation.                       | New Frontend Component         | High     |

#### 2.1.2 Template and Customization (Rendering Logic)

| ID      | Requirement         | Description                                                                                                                 | Integration Point         | Priority |
| :------ | :------------------ | :-------------------------------------------------------------------------------------------------------------------------- | :------------------------ | :------- |
| FR2.1   | Template Gallery    | The application shall provide a gallery of at least 15 culturally-appropriate templates with a live preview function.         | Frontend Assets/Styling   | High     |
| FR2.2   | Live Customization  | Users shall customize the invitation's look and feel (Color, Font, Layout) via an editor with a live preview of the changes.  | New Frontend Component    | High     |

### 2.2 Proposed Enhancements for Indian Market

| ID      | Feature Area                    | Requirement                             | Description                                                                                                                                                             |
| :------ | :------------------------------ | :-------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR3.1   | Event & Language Support        | Granular Event Types                    | Expand the predefined event list to include specific regional festivals (e.g., Bihu, Onam) and various wedding ceremonies (e.g., *Sangeet*, *Mehendi*, *Haldi*).           |
| FR3.2   | Event & Language Support        | Expanded Language Pack                  | Increase language support to include other major languages like Hindi, Bengali, Marathi, Tamil, and Kannada.                                                          |
| FR3.3   | Astrological Timings            | Auspicious Time (Muhurtham)             | Provide an optional field to add "Muhurtham" or auspicious timing details to an invitation.                                                                             |
| FR3.4   | Advanced Guest Management       | WhatsApp Integration                    | Allow hosts to send invitations and track RSVPs via WhatsApp, in addition to email and direct links.                                                                    |
| FR3.5   | Advanced Guest Management       | Detailed RSVP Tracking                  | Enable hosts to request additional information from guests, such as dietary preferences (e.g., Vegetarian, Jain).                                                       |
| FR3.6   | Richer Customization            | Traditional Music Integration           | Allow users to optionally add a short, looping clip of traditional music (e.g., Shehnai) to their digital invitation.                                                   |
| FR3.7   | Richer Customization            | Symbol & Motif Library                  | Provide a library of culturally significant symbols and motifs (e.g., *kalash*, *diya*) that can be added to the invitation design.                                      |
| FR3.8   | Gifting & Blessings             | Digital "Shagun" (Gift) Integration     | Integrate with a payment gateway to allow guests to send a digital cash gift ("shagun") directly through the invitation.                                                |

## 3.0 Non-Functional Requirements (NFRs)

*(Placeholder for NFRs like performance, security, accessibility, etc.)*

## 4.0 Out of Scope

*(Placeholder for features that are explicitly not part of this project.)*