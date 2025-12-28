# Quick Start Guide - Testing Your Changes

## 🚀 **Getting Started**

### Step 1: Apply RLS Fix
```bash
# 1. Open Supabase Dashboard → SQL Editor
# 2. Copy entire contents of fix_rls_complete.sql
# 3. Paste and click "Run"
# 4. Verify: Should see 6 policies created
```

### Step 2: Start Development Server
```bash
npm run dev
```

### Step 3: Test Key Flows

## 🧪 **Test Scenario 1: Browse Teaching → Request to Learn** (Mode='learn')

1. **Navigate to Browse**
   - Click "Teaching" tab
   - Should see skills from other users

2. **Check Active Swap Detection**
   - If you're already learning a skill, it should show:
     - ✓ "Already Learning" badge (green)
     - "View Active Swap" button (not "Request to Learn")
   - Click "View Active Swap" → should go to My Swaps

3. **Request to Learn (New Skill)**
   - Find a skill you're NOT learning
   - Click "Request to Learn"
   - Should navigate to ProposeSwap page

4. **Verify ProposeSwap (Mode='learn')**
   - Top section: Shows "Locked: You Learn [SkillName]"
   - Swap cards: ALL show the SAME skill in "You Learn" side
   - Swap cards: Vary by "You Teach" side
   - Each card has:
     - Match score badge
     - Profile button (user icon)
     - Chat button (message icon)
     - "View Details" button
     - "Propose Swap" button

5. **Test Card Expand**
   - Click "View Details" on any card
   - Should expand to show:
     - Teaching skill details (difficulty, hours, AI assessment)
     - Learning skill details
   - Click "Hide Details" → should collapse

6. **Test Profile Modal**
   - Click profile icon button
   - Should open modal showing:
     - User's avatar, name, rating
     - Their teaching skills
     - Their learning goals
   - Close modal (X button)

7. **Test Chat Modal**
   - Click chat icon button
   - Should open modal with "Coming Soon" message
   - Close modal

8. **Propose Swap**
   - Click "Propose Swap" on a card
   - Should show success message
   - Should navigate to "My Swaps"

---

## 🧪 **Test Scenario 2: Browse Learning → Offer to Teach** (Mode='teach')

1. **Navigate to Browse**
   - Click "Learning" tab
   - Should see skills people want to learn

2. **Offer to Teach**
   - Find a skill YOU already teach that matches what they want
   - Click "Offer to Teach"
   - Should navigate to ProposeSwap page

3. **Verify ProposeSwap (Mode='teach')**
   - Top section: Shows "Locked: You Teach [SkillName]"
   - Swap cards: ALL show the SAME skill in "You Teach" side
   - Swap cards: Vary by "You Learn" side
   - Should show skills THEY teach that match YOUR learning goals

4. **Test Everything Else**
   - Expand/collapse works
   - Profile/chat buttons work
   - Propose swap creates proposal

---

## 🧪 **Test Scenario 3: Find Swaps (Active Exclusion)**

1. **Navigate to Find Swaps**
   
2. **Verify Active Exclusion**
   - Should NOT see matches for skills you're already actively learning
   - Match count should be accurate

3. **Propose from Find Swaps**
   - Click "Propose Swap" on a match
   - Should work like before
   - Should create swap successfully

---

## 🧪 **Test Scenario 4: Empty States**

1. **ProposeSwap Empty (Mode='learn')**
   - Go to ProposeSwap for a skill you can't offer
   - Should show: "No matching swap found"
   - Should have: "Add a teaching skill" button
   - Click button → AddSkillModal opens with role="teach" pre-selected

2. **ProposeSwap Empty (Mode='teach')**
   - Go to ProposeSwap offering a skill
   - If they don't teach what you want to learn:
     - Should show: "No matching swap found"
     - Should have: "Add a learning goal" button
     - Click button → AddSkillModal opens with role="learn" pre-selected

---

## 🐛 **Common Issues & Fixes**

### Issue 1: "Permission denied" when creating swap
**Fix:** Run `fix_rls_complete.sql` in Supabase SQL Editor

### Issue 2: Cards showing same skill on both sides
**Fix:** Should not happen - validation prevents this. Check console for warnings.

### Issue 3: "Already Learning" not showing
**Fix:** Make sure you have an ACTIVE swap (status='active') for that skill

### Issue 4: Match scores showing 0
**Fix:** Other user needs to have learning requests that match your teaching

### Issue 5: Profile modal empty
**Fix:** Other user might not have skills added yet

### Issue 6: Duplicate proposal error
**Fix:** Working as intended - check My Swaps for existing proposal

---

## 📋 **Visual Checklist**

### ProposeSwap Page Should Have:
- [ ] Back button (top left)
- [ ] "Propose a Skill Swap" title
- [ ] Locked skill panel with lock icon
- [ ] "Possible Swaps" section
- [ ] Swap cards in 2-column grid (desktop)
- [ ] Each card has bidirectional arrows (↔)
- [ ] Match badge (Perfect/Strong/Okay/Weak Match)
- [ ] Profile and Chat icon buttons
- [ ] Expand/collapse functionality
- [ ] Empty state if no matches

### SwapMatchCard Should Show:
- [ ] Match score progress bar at top
- [ ] Profile + Chat icon buttons in top right
- [ ] Match badge with score/100
- [ ] Left panel: "You Teach" (primary blue color)
- [ ] Right panel: "You Learn" (accent purple color)
- [ ] "LOCKED" badge on locked side
- [ ] Ring highlight on locked panel
- [ ] "View Details" / "Hide Details" button
- [ ] "Propose Swap" button (primary, larger)

### Browse Page Should Show:
- [ ] "Already Learning" badge for active skills
- [ ] "View Active Swap" button
- [ ] OR "Request to Learn" / "Offer to Teach" button

---

## ✅ **Success Criteria**

### All Tests Pass If:
1. ✅ Can browse skills in both Teaching/Learning tabs
2. ✅ "Already Learning" appears for active skills
3. ✅ Can enter ProposeSwap from both flows
4. ✅ Locked skill never changes within a flow
5. ✅ Cards vary only by non-locked side
6. ✅ Never see same skill on both sides
7. ✅ Expand/collapse animations work
8. ✅ Profile modal opens and shows data
9. ✅ Chat modal opens (placeholder)
10. ✅ Can successfully create swap proposal
11. ✅ Duplicate proposals prevented
12. ✅ FindSwaps excludes active learning skills

---

**If all tests pass, you're ready for production! 🎉**

