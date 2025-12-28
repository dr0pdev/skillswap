import { supabase } from '../lib/supabase'

/**
 * Fetch all active swaps for a user
 * Returns skills being actively learned and taught
 */
export async function fetchActiveSwaps(userId) {
  if (!userId) {
    return {
      activeSwaps: [],
      activeLearnSkillIds: [],
      activeTeachSkillIds: [],
      error: null
    }
  }

  try {
    const { data, error } = await supabase
      .from('swap_participants')
      .select(`
        *,
        swaps!inner(id, status)
      `)
      .eq('user_id', userId)
      .eq('swaps.status', 'active')

    if (error) throw error

    const activeLearnSkillIds = data?.map(p => p.learning_skill_id).filter(Boolean) || []
    const activeTeachSkillIds = data?.map(p => p.teaching_skill_id).filter(Boolean) || []

    return {
      activeSwaps: data || [],
      activeLearnSkillIds,
      activeTeachSkillIds,
      error: null
    }
  } catch (error) {
    console.error('Error fetching active swaps:', error)
    return {
      activeSwaps: [],
      activeLearnSkillIds: [],
      activeTeachSkillIds: [],
      error
    }
  }
}

/**
 * Check if a specific swap proposal already exists
 */
export async function checkDuplicateProposal(userId, otherUserId, teachSkillId, learnSkillId) {
  if (!userId || !otherUserId || !teachSkillId || !learnSkillId) {
    return { exists: false, error: null }
  }

  try {
    const { data, error } = await supabase
      .from('swap_participants')
      .select(`
        id,
        swap_id,
        teaching_skill_id,
        learning_skill_id,
        swaps!inner(id, status)
      `)
      .eq('user_id', userId)
      .eq('teaching_skill_id', teachSkillId)
      .eq('learning_skill_id', learnSkillId)
      .in('swaps.status', ['proposed', 'accepted', 'active'])

    if (error) throw error

    // Check if any of these swaps involves the other user
    if (data && data.length > 0) {
      for (const participant of data) {
        const { data: otherParticipant } = await supabase
          .from('swap_participants')
          .select('user_id')
          .eq('swap_id', participant.swap_id)
          .eq('user_id', otherUserId)
          .single()

        if (otherParticipant) {
          return { exists: true, swapId: participant.swap_id, error: null }
        }
      }
    }

    return { exists: false, error: null }
  } catch (error) {
    console.error('Error checking duplicate proposal:', error)
    return { exists: false, error }
  }
}

/**
 * Filter out skills that are already in active swaps
 */
export function filterActiveSkills(skills, activeSkillIds, skillIdField = 'skill_id') {
  if (!skills || !Array.isArray(skills)) return []
  if (!activeSkillIds || activeSkillIds.length === 0) return skills

  return skills.filter(skill => {
    const skillId = skill[skillIdField] || skill.skills?.id
    return !activeSkillIds.includes(skillId)
  })
}

