'use client'

import { doc, setDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { cacheManager } from '@/lib/cache'

export class VersionManager {
  static async updateVersion(collectionName: string): Promise<void> {
    try {
      // Solo invalidar caché local
      cacheManager.invalidateCache(collectionName)
    } catch (error) {
    }
  }

  static async bumpVersions(collections: string[]): Promise<void> {
    collections.forEach(collection => {
      cacheManager.invalidateCache(collection)
    })
  }
}