// src/features/admindashboard/actions/actions.ts
'use server'

import { prisma } from '../../../lib/prisma'
import { assertPlatformReadAccess } from '../utils/utils'

/* ---------- Actions ---------- */

export async function getPlatformStats() {
  try {
    await assertPlatformReadAccess()

    const [totalUsers, totalCompanies] = await Promise.all([
      prisma.user.count(),
      prisma.company.count()
    ])

    return {
      totalUsers,
      totalCompanies
    }    
  } catch (error) {
    console.log("Error getPlatformStats %O",error)
    return { totalUsers: 0, totalCompanies: 0 }
  }

}

export async function getSubscriptionOverview() {
  try {
  await assertPlatformReadAccess()

//   const now = new Date()

//   const [trial, active] = await Promise.all([
//     prisma.company.count({
//       where: { trialEndsAt: { gt: now } }
//     }),
//     prisma.company.count({
//       where: { subscriptionStatus: 'ACTIVE' }
//     })
//   ])

//   return { trial, active }
    return { trial: 0, active: 0 }    
  } catch (error) {
    return { trial: 0, active: 0 }
    console.log ("Error getSubscriptionOverView %O",error);
  }

}

export async function getRecentSignups() {
  try {
    await assertPlatformReadAccess()

    return prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        createdAt: true
      }
    })    
  } catch (error) {
    console.log("Error getRecentSignups %O",error)
    return []
  }

}

export async function getRecentCompanies() {
  try {
    await assertPlatformReadAccess()

    return prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        createdAt: true,
      }
    })    
  } catch (error) {
    console.log("Error getRecentCompanies %O",error);
    return [];
  }

}

export async function getSystemHealth() {
  try {
    await assertPlatformReadAccess()

    return {
      db: 'ok',
      serverTime: new Date().toISOString(),
      env: process.env.NODE_ENV
    }    
  } catch (error) {
    console.log("Error getSystemHealth %O",error)
    return {db:'Error',serverTime: new Date().toISOString(),env: process.env.NODE_ENV }
  }

}
