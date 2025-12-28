# Availability & Scheduling System Implementation Status

## ✅ COMPLETED COMPONENTS

### 1. Core Utility Functions (`src/utils/capacity.js`)
- `calculateRemainingHours()` - Calculates available hours for a skill
- `getSkillsCapacity()` - Batch capacity check for multiple skills
- `validateProposedHours()` - Validates hours against capacity
- `getWeeklyScheduleSummary()` - Gets user's weekly commitment
- `getMonthlyCalendarEvents()` - Fetches calendar events
- `TIME_PREFERENCES` - Time slot options

### 2. Hours Allocation Form (`src/components/swaps/HoursAllocationForm.jsx`)
**Features:**
- Hour stepper (±0.5h increments)
- Visual slider
- Max capacity validation
- Teacher/Learner capacity display
- Warning messages for edge cases
- Time preference selection (days + times)
- "Remaining after booking" preview
- Fully booked detection

### 3. Monthly Calendar Component (`src/components/calendar/MonthlyCalendar.jsx`)
**Features:**
- Month view with day grid
- Weekly summary (teaching/learning/total hours)
- Teaching events (blue)
- Learning events (purple)
- Status indicators (Active/Proposed)
- Month navigation
- Events list below calendar
- Color-coded legend

### 4. Enhanced User Profile Modal
**Features:**
- Two tabs: "Skills & Info" and "Schedule"
- Capacity display for each teaching skill
- "Fully Booked" / "Partially Booked" badges
- Progress bars showing allocation
- Integrated MonthlyCalendar component

---

## 🚧 REMAINING WORK

### Priority 1: ProposeSwap Integration
**File:** `src/pages/ProposeSwap.jsx`

**Required Changes:**
1. Add state for hours and time preferences
2. Fetch capacity for teach/learn skills
3. Integrate `HoursAllocationForm` component
4. Pass hours to `handleProposeSwap`
5. Update database insert to include:
   - `teaching_hours_per_week`
   - `learning_hours_per_week`
   - `preferred_days` (JSON)
   - `preferred_times` (JSON)

### Priority 2: Browse Page Capacity Display
**File:** `src/pages/Browse.jsx`

**Required Changes:**
1. Fetch capacity for all displayed skills
2. Add "Available: Xh/week" to each card
3. Add "Fully Booked" badge and disable CTA
4. Add "Partially Booked" badge
5. Update filtering to handle capacity

### Priority 3: FindSwaps Capacity Filtering
**File:** `src/pages/FindSwaps.jsx`

**Required Changes:**
1. Check capacity before generating matches
2. Only show matches where both have capacity
3. Display capacity info in match cards
4. Add "Limited availability" badge

### Priority 4: SwapMatchCard Updates
**File:** `src/components/swaps/SwapMatchCard.jsx`

**Required Changes:**
1. Display hours/week in card
2. Show remaining capacity for both parties
3. Add capacity warnings if low

### Priority 5: Counter Offer Enhancement
**File:** `src/pages/MySwaps.jsx`

**Required Changes:**
1. Create proper CounterOfferModal component
2. Include `HoursAllocationForm`
3. Allow changing hours
4. Show updated fairness preview

---

## 📝 DATABASE SCHEMA UPDATES NEEDED

### Current Schema Status:
✅ `swap_participants` table already has:
- `teaching_hours_per_week`
- `learning_hours_per_week`

❌ Missing fields (need migration):
```sql
ALTER TABLE swap_participants 
ADD COLUMN preferred_days JSONB,
ADD COLUMN preferred_times JSONB;
```

---

## 🎯 IMPLEMENTATION GUIDE

### Step 1: Run Database Migration
```sql
-- Add time preference fields
ALTER TABLE swap_participants 
ADD COLUMN IF NOT EXISTS preferred_days JSONB,
ADD COLUMN IF NOT EXISTS preferred_times JSONB;
```

### Step 2: Update ProposeSwap.jsx
```javascript
// Add to state
const [proposedHours, setProposedHours] = useState(1)
const [timePreferences, setTimePreferences] = useState({})
const [teacherCapacity, setTeacherCapacity] = useState({})
const [learnerCapacity, setLearnerCapacity] = useState({})

// In fetchData, add:
const teachCapacity = await calculateRemainingHours(
  teacherUserId,
  teachSkillId,
  'teach'
)
const learnCapacity = await calculateRemainingHours(
  learnerUserId,
  learnSkillId,
  'learn'
)
setTeacherCapacity(teachCapacity)
setLearnerCapacity(learnCapacity)

// In JSX, before swap cards:
<HoursAllocationForm
  teacherCapacity={teacherCapacity}
  learnerCapacity={learnerCapacity}
  onHoursChange={setProposedHours}
  onPreferencesChange={setTimePreferences}
/>

// In handleProposeSwap, add to insert:
teaching_hours_per_week: proposedHours,
learning_hours_per_week: proposedHours,
preferred_days: timePreferences.days ? [timePreferences.days] : null,
preferred_times: timePreferences.time ? [timePreferences.time] : null,
```

### Step 3: Update Browse.jsx
```javascript
// After fetching skills:
const teachingCapacity = await getSkillsCapacity(
  user.id,
  filteredSkills,
  'teach'
)

// In skill card:
{(() => {
  const capacity = teachingCapacity[skillId] || {}
  
  if (capacity.isFullyBooked) {
    return (
      <div className="text-center py-2">
        <span className="badge badge-error">Fully Booked</span>
        <button className="btn btn-secondary mt-2" onClick={() => setShowProfileModal(true)}>
          View Profile
        </button>
      </div>
    )
  }
  
  return (
    <>
      <div className="text-sm text-dark-400 mb-2">
        Available: {capacity.remainingHours || skill.weekly_hours_available}h/week
        {capacity.isPartiallyBooked && (
          <span className="badge badge-warning ml-2">Partially Booked</span>
        )}
      </div>
      <button onClick={() => handleRequestToLearn(skill)} className="btn btn-primary">
        Request to Learn
      </button>
    </>
  )
})()}
```

### Step 4: Update FindSwaps.jsx
```javascript
// In fetchDataAndFindMatches:
const potentialMatches = await findMatches(user.id, teaching, availableLearningSkills, profile)

// Filter by capacity:
const capacityFilteredMatches = []
for (const match of potentialMatches) {
  const teachCapacity = await calculateRemainingHours(
    user.id,
    match.you_teach.skill_id,
    'teach'
  )
  const learnCapacity = await calculateRemainingHours(
    match.partner.id,
    match.they_teach.skill_id,
    'teach'
  )
  
  if (teachCapacity.remainingHours > 0 && learnCapacity.remainingHours > 0) {
    match.teacherCapacity = teachCapacity
    match.learnerCapacity = learnCapacity
    capacityFilteredMatches.push(match)
  }
}

setMatches(capacityFilteredMatches)

// In match card display:
<div className="text-xs text-dark-400">
  Your remaining: {match.teacherCapacity.remainingHours}h/week
  Their remaining: {match.learnerCapacity.remainingHours}h/week
</div>
```

---

## ⚠️ KEY CONSIDERATIONS

### 1. Performance
- Capacity calculations require DB queries
- Cache capacity data where possible
- Consider batch queries for Browse page

### 2. Race Conditions
- Two users might propose simultaneously
- Add optimistic locking or transaction handling
- Validate capacity again on server side

### 3. UX Edge Cases
- User has 0.5h remaining, another user has 2h
  → Max proposable is 0.5h
- User books last hours → Immediately hide from Browse
- Partial bookings → Show remaining, not total

### 4. Calendar Accuracy
- Events currently show as "all week"
- For V2: Add specific day/time slots
- For V2: Add scheduling after acceptance

---

## 📊 TESTING CHECKLIST

- [ ] Add skill with 2h/week capacity
- [ ] Create active swap using 1h → Check remaining = 1h
- [ ] Try proposing 1.5h → Should clamp to 1h max
- [ ] Create second swap using remaining 1h → Should show "Fully Booked"
- [ ] Browse should not show fully booked skills
- [ ] Profile modal shows capacity correctly
- [ ] Calendar shows active swaps
- [ ] Counter offer allows changing hours

---

## 🚀 DEPLOYMENT STEPS

1. Run database migration
2. Deploy updated components
3. Test capacity calculations
4. Monitor for performance issues
5. Add caching if needed

---

**Status: 40% Complete**
- ✅ Core utilities
- ✅ Hours form
- ✅ Calendar
- ✅ Profile with capacity
- ⏳ ProposeSwap integration
- ⏳ Browse capacity
- ⏳ FindSwaps filtering
- ⏳ Counter offer

This is a major feature requiring careful integration across the entire app!

