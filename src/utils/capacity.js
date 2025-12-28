import { supabase } from '../lib/supabase'

/**
 * Calculate remaining hours for a skill based on active swaps
 * If weekly_hours_available is null/0, treat as unlimited capacity
 */
export async function calculateRemainingHours(userId, skillId, role) {
  if (!userId || !skillId || !role) {
    return { remainingHours: Infinity, totalCapacity: Infinity, allocatedHours: 0, isUnlimited: true }
  }

  try {
    // Get the skill's total capacity
    const { data: userSkill, error: skillError } = await supabase
      .from('user_skills')
      .select('weekly_hours_available')
      .eq('user_id', userId)
      .eq('skill_id', skillId)
      .eq('role', role)
      .eq('is_active', true)
      .single()

    if (skillError || !userSkill) {
      // If skill not found, treat as unlimited capacity
      console.log(`No user_skill found for user ${userId}, skill ${skillId}, role ${role} - treating as unlimited`)
      return { remainingHours: Infinity, totalCapacity: Infinity, allocatedHours: 0, isUnlimited: true }
    }

    const totalCapacity = userSkill.weekly_hours_available || null
    
    // If capacity is null or 0, treat as unlimited
    if (!totalCapacity || totalCapacity === 0) {
      console.log(`Weekly hours not set for skill ${skillId} - treating as unlimited capacity`)
      return { remainingHours: Infinity, totalCapacity: Infinity, allocatedHours: 0, isUnlimited: true }
    }

    // Get allocated hours from active swaps
    const fieldName = role === 'teach' ? 'teaching_hours_per_week' : 'learning_hours_per_week'
    const skillFieldName = role === 'teach' ? 'teaching_skill_id' : 'learning_skill_id'

    const { data: activeSwaps, error: swapsError } = await supabase
      .from('swap_participants')
      .select(`
        ${fieldName},
        swaps!inner(status)
      `)
      .eq('user_id', userId)
      .eq(skillFieldName, skillId)
      .eq('swaps.status', 'active')

    if (swapsError) {
      console.error('Error fetching active swaps:', swapsError)
      return { remainingHours: totalCapacity, totalCapacity, allocatedHours: 0, isUnlimited: false }
    }

    // Sum up allocated hours
    const allocatedHours = activeSwaps?.reduce((sum, swap) => {
      return sum + (swap[fieldName] || 0)
    }, 0) || 0

    const remainingHours = Math.max(0, totalCapacity - allocatedHours)

    return {
      remainingHours,
      totalCapacity,
      allocatedHours,
      isFullyBooked: remainingHours === 0,
      isPartiallyBooked: allocatedHours > 0 && remainingHours > 0,
      isUnlimited: false
    }
  } catch (error) {
    console.error('Error calculating remaining hours:', error)
    // On error, treat as unlimited to not block matches
    return { remainingHours: Infinity, totalCapacity: Infinity, allocatedHours: 0, isUnlimited: true }
  }
}

/**
 * Get capacity info for multiple skills
 */
export async function getSkillsCapacity(userId, skills, role) {
  if (!skills || skills.length === 0) return {}

  const capacityMap = {}

  for (const skill of skills) {
    const skillId = skill.skill_id || skill.skills?.id
    if (skillId) {
      const capacity = await calculateRemainingHours(userId, skillId, role)
      capacityMap[skillId] = capacity
    }
  }

  return capacityMap
}

/**
 * Validate proposed hours against capacity
 */
export function validateProposedHours(
  teacherCapacity,
  learnerCapacity,
  proposedHours
) {
  const maxAvailable = Math.min(
    teacherCapacity.remainingHours || 0,
    learnerCapacity.remainingHours || 0
  )

  const isValid = proposedHours > 0 && proposedHours <= maxAvailable
  const warnings = []

  if (proposedHours > maxAvailable) {
    warnings.push(`Maximum available is ${maxAvailable}h/week based on both schedules.`)
  }

  if (proposedHours === teacherCapacity.remainingHours && teacherCapacity.remainingHours > 0) {
    warnings.push('This uses all remaining teaching hours for this skill.')
  }

  if (proposedHours === learnerCapacity.remainingHours && learnerCapacity.remainingHours > 0) {
    warnings.push('This uses all remaining learning hours.')
  }

  if (maxAvailable === 0) {
    warnings.push('No capacity available. One or both parties are fully booked.')
  }

  return {
    isValid,
    maxAvailable,
    warnings,
    canProceed: maxAvailable > 0
  }
}

/**
 * Get user's weekly schedule summary
 */
export async function getWeeklyScheduleSummary(userId) {
  if (!userId) return { teachingHours: 0, learningHours: 0, totalHours: 0 }

  try {
    const { data, error } = await supabase
      .from('swap_participants')
      .select(`
        teaching_hours_per_week,
        learning_hours_per_week,
        swaps!inner(status)
      `)
      .eq('user_id', userId)
      .eq('swaps.status', 'active')

    if (error) throw error

    const teachingHours = data?.reduce((sum, p) => sum + (p.teaching_hours_per_week || 0), 0) || 0
    const learningHours = data?.reduce((sum, p) => sum + (p.learning_hours_per_week || 0), 0) || 0

    return {
      teachingHours,
      learningHours,
      totalHours: teachingHours + learningHours
    }
  } catch (error) {
    console.error('Error getting schedule summary:', error)
    return { teachingHours: 0, learningHours: 0, totalHours: 0 }
  }
}

/**
 * Get monthly calendar events for a user
 */
export async function getMonthlyCalendarEvents(userId, year, month) {
  if (!userId) return []

  try {
    const { data, error } = await supabase
      .from('swap_participants')
      .select(`
        *,
        teaching_skill:skills!swap_participants_teaching_skill_id_fkey(name),
        learning_skill:skills!swap_participants_learning_skill_id_fkey(name),
        learning_from:users!swap_participants_learning_from_user_id_fkey(full_name),
        swaps!inner(id, status, start_date)
      `)
      .eq('user_id', userId)
      .in('swaps.status', ['proposed', 'active'])

    if (error) throw error

    // Transform to calendar events
    const events = []

    data?.forEach(participant => {
      // Teaching event
      if (participant.teaching_hours_per_week > 0) {
        events.push({
          id: `teach-${participant.id}`,
          type: 'teaching',
          skillName: participant.teaching_skill?.name,
          hours: participant.teaching_hours_per_week,
          partnerName: participant.learning_from?.full_name,
          status: participant.swaps.status,
          startDate: participant.swaps.start_date
        })
      }

      // Learning event
      if (participant.learning_hours_per_week > 0) {
        events.push({
          id: `learn-${participant.id}`,
          type: 'learning',
          skillName: participant.learning_skill?.name,
          hours: participant.learning_hours_per_week,
          partnerName: participant.learning_from?.full_name,
          status: participant.swaps.status,
          startDate: participant.swaps.start_date
        })
      }
    })

    return events
  } catch (error) {
    console.error('Error getting calendar events:', error)
    return []
  }
}

/**
 * Time preference options
 */
export const TIME_PREFERENCES = {
  DAYS: [
    { value: 'weekdays', label: 'Weekdays' },
    { value: 'weekends', label: 'Weekends' },
    { value: 'flexible', label: 'Flexible' }
  ],
  TIMES: [
    { value: 'morning', label: 'Morning (6am-12pm)' },
    { value: 'afternoon', label: 'Afternoon (12pm-6pm)' },
    { value: 'evening', label: 'Evening (6pm-10pm)' },
    { value: 'flexible', label: 'Flexible' }
  ]
}

