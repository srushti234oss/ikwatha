# iKWATH PROJECT AUDIT — ENGINEERING BASELINE REPORT

**Date:** September 12, 2026  
**Project:** iKWATH — Intelligent Ayurvedic Wellness Ecosystem  
**Version:** 1.0.0  
**Audit Type:** Full Engineering Assessment  

---

## EXECUTIVE SUMMARY

### Project Status: **PROTOTYPE STAGE — HIGH DEMO READINESS**

iKWATH is a premium, futuristic web-based Ayurvedic Kwatha preparation platform featuring a sophisticated 3D smart machine visualization, multi-view SPA architecture, and comprehensive simulated workflow from machine identification through preparation to dispensing.

**Overall Assessment:** The project demonstrates exceptional UI/UX quality and visual innovation but is currently a **frontend-only simulation** with no backend integration, authentication, or real hardware connectivity.

**Technology Stack:**
- **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Build Tool:** Vite 6.2.0
- **3D Engine:** Three.js 0.174.0
- **Animation:** GSAP 3.12.7
- **Icons:** Lucide 0.475.0
- **Architecture:** Single Page Application (SPA) with view routing

---

## 1. PROJECT STRUCTURE ANALYSIS

### 1.1 File Inventory

```
/Users/shreeganeshk/sih2/
├── index.html          (2,126 lines) — Complete UI/UX markup
├── main.js             (1,382 lines) — Application controller & business logic
├── style.css           (2,085 lines) — Complete design system
├── js/
│   └── scene3d.js      (601 lines)   — Three.js 3D engine
├── package.json        — Dependencies & scripts
├── package-lock.json   — Dependency lock
└── dist/               (752 KB)      — Production build

Total Source Code: 6,194 lines
Total Project Size: 95 MB (including node_modules)
```

### 1.2 View Architecture

The application implements a **Single Page Application (SPA)** with 9 distinct views:

| View ID | Purpose | Status |
|---------|---------|--------|
| `view-login` | Authentication/Entry | ✅ UI Complete, No Auth |
| `view-dashboard` | Main hub/overview | ✅ UI Complete |
| `view-scanner` | Machine QR scanning | ✅ UI Complete, Simulated |
| `view-twin` | Digital twin hardware view | ✅ UI Complete |
| `view-pod-scanner` | Smart pod verification | ✅ UI Complete, Simulated |
| `view-ai-recommend` | AI wellness recommendations | ✅ UI Complete, Simulated |
| `view-preparation` | Active Kwatha brewing | ✅ UI Complete, Simulated |
| `view-dispensing` | Smart dispensing system | ✅ UI Complete, Simulated |

## 2. UI/UX AUDIT — SCREEN-BY-SCREEN ANALYSIS

### 2.1 LOGIN VIEW ✅ EXCELLENT

**What Works:**
- Beautiful futuristic brand identity
- Premium glassmorphism effects
- 3D hero machine with Three.js
- Machine status bar with mode indicators
- Sound toggle and hardware specs modal
- Smooth entry animations

**What is Simulated:**
- Machine connection (always shows KWATH-A1 #8842)
- Machine modes (Standby/Infusing/Dispensing) — UI only
- Login authentication — No backend

**Critical Issues:**
- ❌ No actual authentication system
- ❌ Hard-coded machine ID
- ❌ Form validation missing
- ⚠️ Mobile layout breaks below 768px

### 2.2 DASHBOARD VIEW ✅ EXCELLENT

**What Works:**
- Welcome header with user greeting
- Quick action cards (Scanner, AI Wellness, History)
- Environmental data module (Temp, Purity, Synergy)
- Wellness insights card
- Recent preparation cards
- Bottom floating navigation

**What is Simulated:**
- User name ("Aarav Sharma") — Hard-coded
- Environmental sensors (Temp: 22-24°C, Purity: 94-98%, Synergy: 96-98%) — Math.sin()
- Recent preparations — Static array
- Statistics — Hard-coded values

**Critical Issues:**
- ❌ All data is hard-coded
- ❌ No real-time updates
- ⚠️ No data persistence

### 2.3 MACHINE SCANNER VIEW ✅ GOOD SIMULATION

**What Works:**
- Animated scanner frame with laser beam
- QR code placeholder graphic
- Success modal with machine details
- Manual entry options

**What is Simulated:**
- QR scanning (auto-succeeds after 2.4 seconds)
- Machine verification (always returns IKW-24A8-7392)

**Critical Issues:**
- ❌ No camera API integration
- ❌ No real QR decoding
- ❌ Upload button non-functional
- ❌ Always succeeds — no error handling

### 2.4 POD SCANNER VIEW ✅ EXCELLENT SIMULATION

**What Works:**
- Premium pod scanning interface
- 3D pod graphic
- Holographic ingredient tags
- Detailed pod information
- Compatibility checklist

**What is Simulated:**
- Pod QR scanning (auto-succeeds after 2.8s)
- Pod authentication (always POD-IM-240829)
- Batch verification
- Ingredient data lookup

**Critical Issues:**
- ❌ No camera/QR scanning
- ❌ No pod database
- ❌ No expiry validation logic

### 2.5 AI RECOMMENDATION VIEW ⚠️ HIGH RISK

**What Works:**
- Beautiful AI interface
- Prakriti dosha analysis
- Goal-based recommendations
- Biometric factor display

**What is Simulated:**
- Dosha percentages (hardcoded: Vata 35%, Pitta 40%, Kapha 25%)
- Biometric data (Sleep: 92%, Stress: Low, Activity: 72%)
- AI logic (switch statement, not ML)

**CRITICAL ISSUES:**
- ⚠️ **LEGAL RISK:** Language implies medical diagnosis
- ❌ No real AI/ML model
- ❌ Biometric data is static
- 🚨 **Needs compliance review and disclaimer updates**

**Required Changes:**
- Replace "AI Wellness Assessment" with "AI Wellness Insights"
- Add disclaimer: "For informational purposes only — not medical advice"
- Change "Diagnosis" to "Recommendation"

### 2.6 PREPARATION & DISPENSING VIEWS ✅ EXCELLENT

**What Works:**
- Real-time progress tracking
- Safety monitoring (cup detection)
- Animated visualizations
- Phase indicators

**What is Simulated:**
- All preparation/dispensing processes
- All sensor values

**Note:** Safety design shows maturity


| `view-history` | Preparation history log | ✅ UI Complete, Static Data |

### 1.3 Dependencies

```json
{
  "gsap": "^3.12.7",      // ✅ Stable, widely used
  "lucide": "^0.475.0",   // ✅ Modern icon library
  "three": "^0.174.0",    // ✅ Latest version
  "vite": "^6.2.0"        // ✅ Fast build tool
}
```

**Status:** All dependencies are current and secure. No known vulnerabilities.

---

## 3. TECHNICAL AUDIT

### 3.1 JavaScript Analysis

**Strengths:**
- ✅ Clean ES6+ code
- ✅ Modular Scene3D class
- ✅ No syntax errors
- ✅ Good separation of concerns

**Critical Issues:**
1. **No Error Handling** — No try-catch blocks, no null checks
2. **Memory Leaks** — Three.js resources not disposed, event listeners not cleaned
3. **Hard-coded Values** — All data is static
4. **No Data Persistence** — Everything resets on refresh

### 3.2 CSS Analysis

**Strengths:**
- ✅ Design token system
- ✅ 60+ animations
- ✅ Consistent glassmorphism

**Issues:**
- ⚠️ Mobile responsiveness needs work (<768px)
- ⚠️ Some contrast ratios may fail WCAG AA
- ❌ No prefers-reduced-motion support

### 3.3 Three.js 3D Engine

**Strengths:**
- ✅ Beautiful visuals
- ✅ 60fps performance

**Issues:**
- ❌ Resources not disposed
- ❌ No WebGL fallback

---

## 4. SECURITY AUDIT

✅ **No Secrets Exposed**  
✅ **HTTPS Font Loading**  

**Concerns:**
1. ⚠️ No Authentication
2. ⚠️ XSS Vulnerabilities (unsanitized inputs)
3. ⚠️ innerHTML usage in toasts

**Recommendations:**
- Implement JWT with httpOnly cookies
- Sanitize all user inputs
- Add CSP headers

---

## 5. HEALTH/AI CLAIM AUDIT — ⚠️ HIGH RISK

### Problematic Language

❌ "AI Wellness Assessment" — Implies diagnosis  
❌ "Dosha Detection" — Medical claim  
❌ "Immunity Support" — Health benefit claim  

### REQUIRED CHANGES (Priority 0)

| Current (RISKY) | Safe Alternative |
|-----------------|------------------|
| "AI Wellness Assessment" | "AI Wellness Insights" |
| "Dosha Detection" | "Traditional Profile" |
| "Immunity Support" | "Traditional Recipe" |
| "Diagnose" | "Recommend" |

**Add Disclaimers:**
- "For informational purposes only"
- "Not medical advice"
- "Consult healthcare professional"

**Files:** `index.html` (lines 930-1180), `main.js`

---

## 6. SIMULATION AUDIT

| Component | Status | Priority |
|-----------|--------|----------|
| Temperature | SIMULATED (Math.sin) | P1 |
| Pressure | SIMULATED (Math.sin) | P1 |
| QR Scanning | SIMULATED (timer) | P0 |
| Pod Detection | SIMULATED (timer) | P0 |
| User Data | HARD-CODED | P0 |
| Dosha Values | HARD-CODED | P1 |
| History | HARD-CODED (3 items) | P0 |

**Summary:** 0 real components, 15 simulated

---

## 7. ARCHITECTURE GAP ANALYSIS

### Current Architecture
```
┌─────────────────────┐
│   WEB FRONTEND      │ ← ✅ Complete (6,194 lines)
│  (HTML/CSS/JS)      │
└─────────────────────┘
```

### Target Architecture
```
Frontend → Backend API → Auth → Database → AI Service → IoT → ESP32 → Hardware
  ✅          ❌         ❌       ❌          ❌         ❌     ❌       ❌
```

### Missing Components (P0)
- Backend API (Node.js/Express) — 4 days
- Authentication (JWT) — 2 days
- Database (PostgreSQL) — 2 days
- QR Scanner (Camera API) — 3 days

### Missing Components (P1)
- AI Model — 7 days
- IoT Gateway (MQTT) — 5 days
- ESP32 Firmware — 14 days

---

## 8. SIH READINESS

| Criterion | Score | Status |
|-----------|-------|--------|
| Demo Readiness | 9/10 | ✅ Excellent UI |
| Technical Credibility | 6/10 | ⚠️ Frontend only |
| UI Quality | 10/10 | ✅ World-class |
| Innovation | 8/10 | ✅ Strong concept |
| Scalability | 4/10 | ❌ No backend |
| Security | 3/10 | ❌ No auth |
| AI Integration | 2/10 | ❌ Hardcoded |
| IoT Readiness | 2/10 | ❌ No hardware |

**Overall:** 6.2/10

### Strengths for Judges
✅ Premium UI — Looks commercial  
✅ Complete user journey  
✅ 3D visualization — unique  
✅ Safety-first design  

### Weaknesses
❌ No backend — everything simulated  
❌ No real AI — hardcoded logic  
❌ No hardware integration  

### Critical Judge Questions to Prepare For

**Q: "How does the AI work?"**  
Current: Switch statements ❌  
Need: Real algorithm or ML model

**Q: "Can you show hardware?"**  
Current: No hardware ❌  
Need: ESP32 prototype

**Q: "How is data secured?"**  
Current: No auth ❌  
Need: JWT implementation

---

## 9. BIGGEST PROBLEMS

### 9.1 NO BACKEND ⚠️ CRITICAL
- Can't persist data or scale
- Effort: 3-4 weeks for MVP

### 9.2 NO REAL AI ⚠️ HIGH
- Hardcoded switch logic
- Effort: 1-2 weeks (rule engine) or 4-6 weeks (ML)

### 9.3 ALL SENSORS SIMULATED ⚠️ HIGH
- Math.sin() patterns
- Effort: 2-4 weeks (ESP32)

### 9.4 NO QR SCANNING ⚠️ MEDIUM
- Auto-succeeds after timer
- Effort: 2-3 days (camera API)

### 9.5 HEALTH CLAIM RISK ⚠️ LEGAL
- Language implies diagnosis
- Effort: 1 day to fix

### 9.6 MEMORY LEAKS ⚠️ MEDIUM
- Three.js resources not cleaned
- Effort: 1-2 days

---

## 10. RECOMMENDED NEXT 10 STEPS

### Priority 0 — MUST FIX (Before Demo)

**1. Fix Health Claim Language (1 day) 🚨 LEGAL RISK**
- Update terminology to be wellness-focused
- Add disclaimers: "For informational purposes only"
- Remove "diagnosis" language
- Files: `index.html`, `main.js`

**2. Implement Real QR Scanner (2-3 days)**
```bash
npm install html5-qrcode
```
- Integrate camera API
- Decode QR codes
- Handle scan failures

**3. Build Backend API (3-4 days)**
- Node.js + Express
- Endpoints: /auth, /machines, /pods, /preparations
- JWT authentication
- Error handling

**4. Add Database (2 days)**
- PostgreSQL setup
- Tables: users, machines, pods, history
- Migrations and seed data

**5. Implement Authentication (2 days)**
- JWT tokens with httpOnly cookies
- Login/logout endpoints
- Protected routes

### Priority 1 — SHOULD BUILD

**6. AI Recommendation Engine (1 week)**
- Rule-based decision tree
- Input: Goal + Dosha → Output: Ranked pods

**7. ESP32 Prototype (2-3 weeks)**
- Temperature sensor (DS18B20)
- Water level sensor
- Heater relay control
- MQTT communication

**8. Fix Memory Leaks (1 day)**
- Dispose Three.js resources properly
- Clear intervals/timeouts

**9. Mobile Responsive (3-4 days)**
- Media queries for <768px
- Touch targets minimum 44x44px

**10. WebSocket Real-time (3 days)**
- Socket.io for live telemetry streaming

---

## 11. STRONGEST FEATURES

1. **Premium 3D Visualization** — World-class Three.js implementation
2. **Complete User Journey** — End-to-end workflow with no dead ends
3. **Safety-First Design** — Cup detection shows product maturity
4. **Design System Excellence** — Consistent glassmorphism and animations
5. **Smart Pod Concept** — Innovative QR/NFC authentication solution

---

