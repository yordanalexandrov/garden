# Gardening Helper Application — Product Scope

## Product type
A **PWA-first garden management application** for personal use, designed so it can later expand to family sharing and possibly a mobile app.

## Primary goal
Let the user manage gardens in a structured way without turning daily use into a burden.

The app should be:

- **fast enough for real daily logging**
- **structured enough for automation**
- **complete enough to replace scattered notes**

---

# Locked product decisions

## Time model
The application will use:

- **year only**, not named seasons

So plantings and history will be organized primarily by **calendar year**.

### Consequence
A bed planting belongs to a year, for example:
- Bed 1 → Tomato / Roma / 2026
- Bed 1 → Basil / Genovese / 2026

This is enough for:
- current-year view
- previous-year history
- future crop rotation logic later

---

## Units
The application should use only **basic SI-style units**, kept simple.

### Recommended supported units
Inventory / dosage / stock should use only a small set like:

- ml
- l
- g
- kg

This is enough for most:
- insecticides
- pesticides
- foliar feeds
- fertilizers
- concentrates
- powders

Avoid unit conversion complexity in v1 unless absolutely needed.

---

## Weather location model
Different places may use **different weather locations**, and weather should be optionally enabled per place.

### Recommended behavior
Each place should have:

- weather enabled: yes/no
- weather location reference

That way:
- one place can use weather
- another can ignore it
- rain logic applies only where enabled

---

## App form factor
The application should be:

- **PWA first**
- with a possible mobile app later

### Product implication
The UX should be designed to be usable both:
- on phone for field logging
- on desktop for richer management and planning

Push notifications via PWA are in scope for v1.

---

## Photos
For v1:
- **photos only for problems**

This keeps media handling focused and avoids unnecessary complexity in the first version.

---

# Final v1 requirements summary

## 1. Place management
The user can define multiple places.

Each place can contain:
- trees / perennials
- garden beds

Each place may optionally have:
- weather integration enabled
- its own weather location

---

## 2. Plant structure

### Trees / perennial plants
Track individual plants such as:
- fruit trees
- vines
- shrubs
- other perennial plants

### Garden beds
Track physical beds.

### Bed plantings
Each bed can contain multiple planted crop entries for a given year.

This is required for:
- history
- AI spacing suggestions
- coexistence suggestions
- future crop rotation logic

But operations can still be applied to:
- whole bed
- selected beds
- all beds

---

## 3. Activity log
The application must support logging gardening activities with flexible targeting.

### Supported target modes
- whole place
- all trees in a place
- selected trees
- all beds in a place
- selected beds
- single bed
- selected bed plantings where needed

### Activity types
At minimum:
- watering
- spraying / treatment
- fertilizing
- pruning
- planting
- transplanting
- harvesting
- observation
- maintenance
- soil work
- custom

### Watering
Watering only tracks:
- happened
- date
- target
- optional note

No detailed water amount tracking in v1.

---

## 4. Problems and observations
The app must support recording:
- problems
- observations

### Requirements
- target a place / tree / bed / planting as applicable
- text description
- category/type
- severity/status for problems
- photo upload for problems
- historical record

This becomes the visual history of garden issues.

---

## 5. Product database
The app must maintain a user-built product database.

### Product types
At minimum:
- insecticides
- pesticides
- fungicides
- fertilizers
- biostimulants
- other garden preparations

### Product structure
Each product should have:
- name
- category
- manufacturer optional
- active substance optional
- notes
- unit type

---

## 6. Product usage rules by plant
Each product can contain multiple plant-specific sections.

This is one of the key requirements.

### Each usage rule should support
- target plant type
- dose
- unit
- dilution / water ratio
- reapplication interval
- quarantine period
- notes
- possibly target problems later

This powers:
- correct usage guidance
- future task suggestions
- quarantine warnings
- AI-assisted entry

---

## 7. Inventory
Inventory is required and important.

### Requirements
- stock quantity per product
- purchase records / lots
- expiry date
- batch/lot number
- automatic stock decrease when used
- history of stock changes

### Important rule
Inventory should not just store “current remaining quantity”.
It should also keep a **movement history** so stock changes remain traceable.

---

## 8. Calendar and tasks
The app needs a calendar view for both history and future work.

### Calendar should show
- completed activities
- planned tasks
- suggested tasks waiting confirmation
- quarantine periods
- weather context where enabled

### Task reminders
Push notifications should alert:
- the day before
- the same day

### Auto-suggested future tasks
For activities like:
- spraying
- fertilizing
- pruning

The system may create future tasks as `suggested` based on product or task rules. User confirmation is required before any suggestion becomes a planned task with reminders.

Not for:
- watering
- inspection

---

## 9. Quarantine period handling
When a treatment includes a quarantine period, the app should:

- calculate the restricted period
- show it as a calendar period
- warn the user regarding harvest timing

This is in scope for v1.

---

## 10. Weather integration
Weather is in v1.

### Weather behavior
Per place, when enabled:
- show forecast context for relevant tasks
- especially for treatments/spraying

### Rain logic
If weather indicates rain around a spraying-related event/task:
- prompt user to confirm whether it actually rained

The system should not make the final decision automatically.

That is the correct product rule.

---

## 11. AI features in v1
AI is included, but must remain assistive.

### AI use cases in v1
- parse product information from name, label text, or uploaded image
- suggest structured product fields
- suggest plant-specific usage sections
- suggest bed planting spacing
- suggest plant coexistence compatibility
- provide optional summaries/suggestions when asked

### AI rule
AI-generated data is never saved automatically.
The user must confirm before save.

---

# Final product definition

## Product definition
A PWA-first Gardening Helper application that lets a user define places, manage trees and garden beds, record yearly plantings, log gardening activities across single or multiple targets, track problems with photos, maintain a structured product and inventory database with plant-specific usage rules, manage future tasks and reminders in a calendar, incorporate place-based weather awareness into treatment workflows, and use AI to assist with product entry and planting suggestions, always with explicit user confirmation before saving AI-generated data.

---

# Core product modules
The application will need these core modules:

1. **Places**
2. **Plants and beds**
3. **Yearly bed plantings**
4. **Activity log**
5. **Problems with photos**
6. **Product catalog**
7. **Inventory and stock movements**
8. **Plant-specific product rules**
9. **Tasks and calendar**
10. **Notifications**
11. **Weather integration**
12. **AI assistance**

---

# Product principles

## 1. History matters
Do not overwrite meaningful gardening records. Keep activity and stock history.

## 2. Bulk actions are first-class
Real gardening work is often done to many trees or beds at once.

## 3. Products are structured, not just notes
Otherwise automation and safety become unreliable.

## 4. AI assists, user decides
Always confirm before saving AI-generated data.

## 5. Weather informs, user confirms
Especially for rain-sensitive treatments.

## 6. Bed-level and crop-level both matter
Operations happen at bed level, but planning and history often need crop-level tracking.
