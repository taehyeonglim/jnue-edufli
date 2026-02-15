import { httpsCallable } from 'firebase/functions'
import { functions } from '../config/firebase'

const adminAdjustPointsCallable = httpsCallable<
  { targetUid: string; delta: number; requestId: string },
  { points: number; tier: string }
>(functions, 'adminAdjustPoints')

const adminSetRoleCallable = httpsCallable<
  { targetUid: string; isAdmin?: boolean; isChallenger?: boolean; isTestAccount?: boolean },
  { success: boolean }
>(functions, 'adminSetRole')

export async function adminAdjustPoints(targetUid: string, delta: number): Promise<void> {
  await adminAdjustPointsCallable({
    targetUid,
    delta,
    requestId: crypto.randomUUID(),
  })
}

export async function adminSetRole(payload: {
  targetUid: string
  isAdmin?: boolean
  isChallenger?: boolean
  isTestAccount?: boolean
}): Promise<void> {
  await adminSetRoleCallable(payload)
}
