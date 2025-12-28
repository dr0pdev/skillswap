import { supabase } from '../lib/supabase'

/**
 * Calculate the value of a skill contribution
 * Based on: difficulty, demand, level, time commitment, and user reputation
 */
export function calculateSkillValue(userSkill, skillData, userReputation) {
  // Base components
  const difficulty = userSkill.difficulty_score || skillData.base_difficulty || 50
  const demand = skillData.demand_score || 50
  const reputation = userReputation || 50
  const hours = userSkill.weekly_hours_available || 1

  // Level multiplier
  const levelMultipliers = {
    beginner: 0.7,
    intermediate: 1.0,
    advanced: 1.4,
  }
  const levelMultiplier = levelMultipliers[userSkill.level?.toLowerCase()] || 1.0

  // Value formula: weighted combination of factors
  // difficulty (30%) + demand (25%) + reputation (20%) + hours factor (25%)
  const baseValue =
    difficulty * 0.3 +
    demand * 0.25 +
    reputation * 0.2 +
    Math.min(hours * 10, 50) * 0.25 // Cap hours contribution at 5h/week

  // Apply level multiplier
  const finalValue = baseValue * levelMultiplier

  return finalValue
}

/**
 * Calculate fairness score between two skill values
 * Returns 0-100, where 100 is perfectly fair
 * LOWERED THRESHOLD: Now accepts matches with 40+ fairness (was 60+)
 */
export function calculateFairness(value1, value2) {
  if (value1 === 0 || value2 === 0) return 0

  const ratio = Math.min(value1, value2) / Math.max(value1, value2)
  
  // Convert ratio to 0-100 scale
  // 1.0 ratio = 100, 0.5 ratio = 50, etc.
  const fairness = ratio * 100

  return Math.round(fairness)
}

/**
 * Generate explanation for why a match is fair or unfair
 */
export function generateExplanation(
  yourSkill,
  theirSkill,
  yourValue,
  theirValue,
  fairnessScore
) {
  const difference = Math.abs(yourValue - theirValue)
  const percentDiff = (difference / Math.max(yourValue, theirValue)) * 100

  if (fairnessScore >= 90) {
    return `This is an excellent match! The skills are nearly equal in value (${percentDiff.toFixed(0)}% difference). Both ${yourSkill.skills.name} and ${theirSkill.skills.name} offer similar difficulty, demand, and time commitment.`
  } else if (fairnessScore >= 75) {
    return `This is a good match with ${percentDiff.toFixed(0)}% value difference. The exchange is balanced when considering skill difficulty, market demand, and your experience levels.`
  } else if (fairnessScore >= 60) {
    const higher = yourValue > theirValue ? yourSkill.skills.name : theirSkill.skills.name
    const lower = yourValue > theirValue ? theirSkill.skills.name : yourSkill.skills.name
    return `Fair match with ${percentDiff.toFixed(0)}% difference. ${higher} has slightly higher value than ${lower}, but both parties gain valuable skills within acceptable fairness thresholds.`
  } else {
    return `Borderline match with ${percentDiff.toFixed(0)}% value difference. Consider adjusting time commitments or skill levels to improve fairness.`
  }
}

/**
 * Find potential direct swap matches for a user
 */
export async function findMatches(userId, teachingSkills, learningSkills, userProfile) {
  const matches = []

  console.log('🔍 FindMatches called with:', {
    userId,
    teachingSkills: teachingSkills.map(s => ({ id: s.skill_id, name: s.skills?.name })),
    learningSkills: learningSkills.map(s => ({ id: s.skill_id, name: s.skills?.name }))
  })

  try {
    // For each skill the user wants to learn
    for (const learningSkill of learningSkills) {
      console.log(`\n📚 Looking for teachers of: ${learningSkill.skills?.name} (skill_id: ${learningSkill.skill_id})`)
      
      // Find users who can teach it
      const { data: potentialTeachers, error: teachersError } = await supabase
        .from('user_skills')
        .select(`
          *,
          skills (*),
          users (*)
        `)
        .eq('skill_id', learningSkill.skill_id)
        .eq('role', 'teach')
        .eq('is_active', true)
        .neq('user_id', userId)

      if (teachersError) throw teachersError
      
      console.log(`   Found ${potentialTeachers?.length || 0} potential teachers:`, 
        potentialTeachers?.map(t => ({ 
          user: t.users?.full_name || t.users?.email,
          userId: t.user_id,
          level: t.level 
        }))
      )

      // For each potential teacher
      for (const teacher of potentialTeachers || []) {
        console.log(`\n   👤 Checking teacher: ${teacher.users?.full_name || teacher.users?.email}`)
        
        // Check if they want to learn any of our teaching skills
        const { data: theirLearning, error: learningError } = await supabase
          .from('user_skills')
          .select(`
            *,
            skills (*)
          `)
          .eq('user_id', teacher.user_id)
          .eq('role', 'learn')
          .eq('is_active', true)

        if (learningError) throw learningError
        
        console.log(`      They want to learn:`, 
          theirLearning?.map(l => ({ id: l.skill_id, name: l.skills?.name })) || []
        )
        console.log(`      We teach:`, 
          teachingSkills.map(t => ({ id: t.skill_id, name: t.skills?.name }))
        )

        // Find overlapping skills
        for (const theirLearnSkill of theirLearning || []) {
          const weTeach = teachingSkills.find(
            (ts) => ts.skill_id === theirLearnSkill.skill_id
          )

          console.log(`      Checking if we teach ${theirLearnSkill.skills?.name}:`, !!weTeach)

          if (weTeach) {
            console.log(`      ✅ MATCH FOUND! We teach ${weTeach.skills?.name}, they want to learn it!`)
            // Calculate values
            const ourValue = calculateSkillValue(
              weTeach,
              weTeach.skills,
              userProfile?.reputation_score
            )

            const theirValue = calculateSkillValue(
              teacher,
              teacher.skills,
              teacher.users?.reputation_score
            )

            // Calculate fairness
            const fairnessScore = calculateFairness(ourValue, theirValue)

            console.log(`      📊 Fairness calculation:`, {
              ourValue,
              theirValue,
              fairnessScore,
              threshold: 40,
              passes: fairnessScore >= 40
            })

            // Lowered threshold from 60 to 40 for more matches
            if (fairnessScore >= 40) {
              const explanation = generateExplanation(
                weTeach,
                teacher,
                ourValue,
                theirValue,
                fairnessScore
              )

              console.log(`      ✅ Adding match with fairness score ${fairnessScore}`)

              matches.push({
                partner: teacher.users,
                you_teach: weTeach,
                you_learn: learningSkill,
                they_teach: teacher,
                they_learn: theirLearnSkill,
                you_give_value: ourValue,
                you_receive_value: theirValue,
                they_give_value: theirValue,
                they_receive_value: ourValue,
                fairness_score: fairnessScore,
                explanation,
              })
            } else {
              console.log(`      ❌ Fairness score too low: ${fairnessScore} (need >= 40)`)
            }
          }
        }
      }
    }

    console.log(`\n🎯 Total matches found: ${matches.length}`)
    
    // Sort by fairness score (best matches first)
    matches.sort((a, b) => b.fairness_score - a.fairness_score)

    // Return top 20 matches
    return matches.slice(0, 20)
  } catch (error) {
    console.error('❌ Error in findMatches:', error)
    return []
  }
}

/**
 * Calculate reputation impact from ratings
 */
export function calculateReputationFromRatings(ratings) {
  if (!ratings || ratings.length === 0) return 50.0

  const avgRating = ratings.reduce((sum, r) => sum + r.overall_score, 0) / ratings.length

  // Convert 1-5 scale to 0-100
  return (avgRating / 5) * 100
}

