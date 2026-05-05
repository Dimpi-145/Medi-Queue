# MediQueue Frontend Patient API Analysis

## Executive Summary

The frontend patient features make **8 API calls** across **3 service files** plus **inline axios calls** in components. Analysis reveals:

- ✅ **3 API calls**: Correctly configured and matched to backend
- ❌ **1 API call**: Wrong endpoint (doctors list)
- ⚠️ **2 API calls**: Call non-existent backend routes (history endpoints)
- ℹ️ **2 API calls**: Hardcoded absolute URLs instead of using configured axios instance

---

## Frontend Patient Service Files

### 1. **Frontend/src/features/patient/services/appointment.api.js**

| API Call | HTTP Method | Frontend Path | Backend Endpoint | Expected Data | Status |
|----------|------------|------------------|------------------|---|--------|
| Book Appointment | `POST` | `/api/appointments/book` | ✅ Exists | `{ doctorId, date, timeSlot, reason }` | ✅ OK |
| Get My Appointments | `GET` | `/api/appointments/my` | ✅ Exists | None | ✅ OK |
| Cancel Appointment | `PUT` | `/api/appointments/cancel/:id` | ✅ Exists | None | ✅ OK |
| Get Doctors by Department | `GET` | `/api/appointments/get-doctors?department=X` | ✅ Exists | Query param: `department` | ✅ OK |

**Note**: `getDoctors()` is imported but NOT called from the service file - instead directly called inline in AppointmentForm.jsx with wrong endpoint.

---

### 2. **Frontend/src/features/patient/services/dashboard.api.js**

| API Call | HTTP Method | Frontend Path | Backend Endpoint | Expected Data | Status |
|----------|------------|------------------|------------------|---|--------|
| Get Patient Dashboard | `GET` | `/api/Dashboard/patient` | ✅ Exists | None | ✅ OK |

**Returns**: `{ patient, appointments, activeAppointment, queueInfo }`

---

### 3. **Frontend/src/features/patient/services/report.api.js**

| API Call | HTTP Method | Frontend Path | Backend Endpoint | Expected Data | Status |
|----------|------------|------------------|------------------|---|--------|
| Upload Report | `POST` | `/api/reports/upload` | ✅ Exists | FormData with `report` file | ✅ OK |
| Get My Reports | `GET` | `/api/reports/my` | ✅ Exists | None | ✅ OK |
| Get Report by Token | `GET` | `/api/reports/view/:token` | ✅ Exists | URL param: `token` | ✅ OK |

---

## Inline Axios Calls in Patient Components

These bypass the service layer and use hardcoded absolute URLs:

### **Frontend/src/features/patient/pages/PatientDashboard.jsx**

| API Call | HTTP Method | URL Called | Backend Endpoint | Expected Data | Status |
|----------|------------|-----|------------------|---|--------|
| Dashboard | `GET` | `http://localhost:3000/api/Dashboard/patient` | ✅ Exists | None | ⚠️ Hardcoded |
| Prescriptions | `GET` | `http://localhost:3000/api/prescriptions/my` | ✅ Exists | None | ⚠️ Hardcoded |
| Reports | `GET` | `http://localhost:3000/api/reports/my` | ✅ Exists | None | ⚠️ Hardcoded |
| History | `GET` | `http://localhost:3000/api/history/my` | ❌ **MISSING** | None | ❌ NOT FOUND |

**Issue**: These should use the service files instead of inline axios calls.

---

### **Frontend/src/features/patient/components/AppointmentForm.jsx**

| API Call | HTTP Method | URL Called | Backend Endpoint | Expected Data | Status |
|----------|------------|-----|------------------|---|--------|
| Get Doctors | `GET` | `http://localhost:3000/api/doctors?department=X` | ❌ **WRONG** | Query param: `department` | ❌ WRONG ENDPOINT |

**Issue**: Should be `/api/appointments/get-doctors`, not `/api/doctors`

**Error**: Response structure mismatch - backend returns array of doctors, should populate correctly.

---

### **Frontend/src/features/patient/components/Report.jsx**

| API Call | HTTP Method | URL Called | Backend Endpoint | Expected Data | Status |
|----------|------------|-----|------------------|------------------|--------|
| Get Reports | `GET` | `http://localhost:3000/api/reports/my` | ✅ Exists | None | ⚠️ Hardcoded |
| Upload Report | `POST` | `http://localhost:3000/api/reports/upload` | ✅ Exists | FormData with `report` file | ⚠️ Hardcoded |

**Note**: Duplicates service calls, should use `report.api.js` instead.

---

### **Frontend/src/features/patient/components/History.jsx**

| API Call | HTTP Method | URL Called | Backend Endpoint | Expected Data | Status |
|----------|------------|-----|------------------|---|--------|
| Get History | `GET` | `http://localhost:3000/api/history/my` | ❌ **MISSING** | None | ❌ NOT FOUND |

**Issue**: Backend has NO history route. Needs to be implemented.

---

## Critical Issues Summary

### 🔴 Issue #1: Wrong Doctors Endpoint (BLOCKING)

**File**: [Frontend/src/features/patient/components/AppointmentForm.jsx](Frontend/src/features/patient/components/AppointmentForm.jsx#L21)

**Problem**: 
```javascript
const res = await axios.get(
  `http://localhost:3000/api/doctors?department=${department}`
);
```

**Should be**:
```javascript
const res = await axios.get(
  `http://localhost:3000/api/appointments/get-doctors?department=${department}`
);
```

**Or better**, use the service:
```javascript
import { getDoctors } from "../services/appointment.api";
const res = await getDoctors(department);
```

---

### 🔴 Issue #2: History API Not Implemented (BLOCKING)

**Files**: 
- [Frontend/src/features/patient/pages/PatientDashboard.jsx](Frontend/src/features/patient/pages/PatientDashboard.jsx#L122)
- [Frontend/src/features/patient/components/History.jsx](Frontend/src/features/patient/components/History.jsx#L15)

**Problem**: Both files call:
```javascript
http://localhost:3000/api/history/my
```

**Backend Status**: NO `/api/history` route exists

**Solution**: Either
1. Add history route to backend (`Backend/src/routes/history.routes.js`), OR
2. Remove history feature from frontend (if not needed)

---

### 🟡 Issue #3: Hardcoded URLs Instead of Service Layer (CODE QUALITY)

**Files with hardcoded URLs**:
- [PatientDashboard.jsx](Frontend/src/features/patient/pages/PatientDashboard.jsx) - lines 56, 94, 108, 122
- [Report.jsx](Frontend/src/features/patient/components/Report.jsx) - lines 17, 45
- [AppointmentForm.jsx](Frontend/src/features/patient/components/AppointmentForm.jsx) - line 21
- [History.jsx](Frontend/src/features/patient/components/History.jsx) - line 15

**Issue**: Circumvents service layer configuration, making URLs hard to maintain

**Recommendation**: Use axios instances from service files:
```javascript
import { getMyAppointments, getDoctors } from "../services/appointment.api";
```

---

### 🟡 Issue #4: Auth Service Hardcoded URL

**File**: [Frontend/src/features/auth/services/auth.api.js](Frontend/src/features/auth/services/auth.api.js#L5)

```javascript
const api = axios.create({
  baseURL: "http://localhost:3000/api/auth",
  withCredentials: true,
});
```

**Issue**: Other services use relative baseURL `/api/...` but auth uses absolute URL

**Should be**:
```javascript
const api = axios.create({
  baseURL: "/api/auth",
  withCredentials: true,
});
```

---

## Backend Patient-Related Endpoints

### ✅ Implemented Routes

#### Authentication (`/api/auth`)
- `POST /register` - Patient registration
- `POST /login` - Patient login
- `GET /patient-dashboard` - Patient dashboard access check
- `GET /patients/:id` - Get patient details (doctor only)

#### Appointments (`/api/appointments`)
- `POST /book` - Book appointment (patient only)
- `GET /get-doctors` - Get doctors by department (patient only)
- `GET /my` - Get patient's appointments (patient only)
- `GET /doctor` - Get doctor's appointments (doctor only)
- `PUT /cancel/:id` - Cancel appointment (patient only)
- `PUT /complete/:id` - Mark appointment complete (doctor only)

#### Dashboard (`/api/Dashboard`)
- `GET /patient` - Get patient dashboard (patient only)
- `GET /doctor` - Get doctor dashboard (doctor only)

#### Prescriptions (`/api/prescriptions`)
- `POST /create` - Create prescription (doctor only)
- `GET /my` - Get patient's prescriptions (patient only)
- `GET /all` - Get all prescriptions (admin only)

#### Reports (`/api/reports`)
- `POST /upload` - Upload report (patient only)
- `GET /my` - Get patient's reports (patient only)
- `GET /view/:token` - View report by token (doctor only)

#### Queue (`/api/queue`)
- `GET /live` - Get live queue (doctor/admin only)
- `GET /current` - Get current patient (doctor only)
- `PUT /next` - Call next patient (doctor only)
- **`GET /position/:id`** - Get queue position (patient only) - **NOT USED BY FRONTEND**
- `POST /admin/add-to-queue` - Add to queue (admin only)
- `PUT /complete` - Mark queue complete (doctor only)

### ❌ Missing Backend Routes

- `/api/history/my` - **Used by frontend but NOT implemented**

---

## Unused Backend Endpoints (Patient Perspective)

| Endpoint | Backend Route | Frontend Usage | Reason |
|----------|---------------|---|--------|
| Queue Position | `GET /api/queue/position/:id` | Not called | Data included in dashboard response instead |
| Queue Details | `GET /api/queue/live` | Not called | Doctor-only endpoint, not relevant for patients |

---

## Prescription Service Mismatch

**File**: [Frontend/src/features/auth/services/prescription.api.js](Frontend/src/features/auth/services/prescription.api.js)

**Issue**: Prescription API service is located under `auth/services/` but should be under `patient/services/`

```
Current:  auth/services/prescription.api.js
Should be: patient/services/prescription.api.js
```

**Exports**:
- `createPrescription(data)` - Creates prescription (doctor only in backend)
- `getMyPrescriptions()` - Gets patient's prescriptions

---

## API Call Summary Table

| Feature | Frontend Endpoint | Backend Route | HTTP | Status |
|---------|------------------|---------------|------|--------|
| **Appointments** | | | | |
| - Book | `/api/appointments/book` | `POST /book` | POST | ✅ |
| - Get Mine | `/api/appointments/my` | `GET /my` | GET | ✅ |
| - Cancel | `/api/appointments/cancel/:id` | `PUT /cancel/:id` | PUT | ✅ |
| - Get Doctors | `/api/appointments/get-doctors` | `GET /get-doctors` | GET | ❌ Wrong URL called |
| **Dashboard** | | | | |
| - Patient | `/api/Dashboard/patient` | `GET /patient` | GET | ✅ |
| **Prescriptions** | | | | |
| - Get Mine | `/api/prescriptions/my` | `GET /my` | GET | ✅ |
| - Create | `/api/prescriptions/create` | `POST /create` | POST | ✅ Not used by patient |
| **Reports** | | | | |
| - Upload | `/api/reports/upload` | `POST /upload` | POST | ✅ |
| - Get Mine | `/api/reports/my` | `GET /my` | GET | ✅ |
| - View by Token | `/api/reports/view/:token` | `GET /view/:token` | GET | ✅ |
| **History** | | | | |
| - Get Mine | `/api/history/my` | NONE | GET | ❌ NOT FOUND |

---

## Recommendations

### Priority 1: CRITICAL FIXES

1. **Fix Doctors Endpoint** - Change hardcoded `/api/doctors` to `/api/appointments/get-doctors`
   - File: AppointmentForm.jsx line 21

2. **Implement History Route** - Add backend route for `/api/history/my` 
   - Option A: Create Backend/src/routes/history.routes.js
   - Option B: Remove history feature if not needed

### Priority 2: CODE QUALITY

3. **Move all inline axios calls to service layer**
   - Create: `patient/services/dashboard.api.js` (if not exists)
   - Update: PatientDashboard.jsx to import from services
   - Update: Report.jsx to use report.api.js
   - Update: History.jsx to use service once backend exists

4. **Fix Auth Service URL**
   - Change from hardcoded `http://localhost:3000/api/auth` to relative `/api/auth`

5. **Relocate Prescription Service**
   - Move from `auth/services/prescription.api.js` to `patient/services/prescription.api.js`

### Priority 3: OPTIMIZATION

6. **Leverage unused Queue endpoint**
   - Consider using `GET /api/queue/position/:id` for real-time queue updates
   - Could provide better UX than polling dashboard

7. **Standardize API configuration**
   - All services should use central axios instance from utils/axios.js
   - Pass baseURL to create() for service-specific configurations

---

## Configuration Files

### Frontend Axios Configuration
- **File**: [Frontend/src/utils/axios.js](Frontend/src/utils/axios.js)
- **baseURL**: `/api`
- **withCredentials**: `true`

### Backend API Mounting
- **File**: [Backend/src/app.js](Backend/src/app.js)
- **Routes**:
  - `/api/auth` → authRouter
  - `/api/appointments` → appointmentRouter
  - `/api/queue` → queueRouter
  - `/api/Dashboard` → dashboardRouter
  - `/api/prescriptions` → prescriptionRouter
  - `/api/reports` → reportRouter
  - `/api/admin` → adminRoutes

---

## Next Steps

1. ✏️ Fix the doctors endpoint call
2. 📁 Implement missing history backend route
3. 🔧 Consolidate API calls to service layer
4. ✅ Test all patient features end-to-end
