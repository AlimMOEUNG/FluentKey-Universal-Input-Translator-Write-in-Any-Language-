/**
 * CRUD service for custom char-map transformations in chrome.storage.sync.
 * Each transformation is stored under its own sharded key to stay within the
 * 8 KB per-item limit.  A single index key tracks the set of IDs.
 */
import type { CustomTransformation, CustomTransformIndex } from '@/types/common'

const INDEX_KEY = 'customTransformIndex'
const ITEM_PREFIX = 'customTransform_'

export const MAX_TRANSFORMS = 20

function itemKey(id: string): string {
  return `${ITEM_PREFIX}${id}`
}

async function getIndex(): Promise<CustomTransformIndex> {
  const result = await chrome.storage.sync.get(INDEX_KEY)
  return (result[INDEX_KEY] as CustomTransformIndex) ?? { ids: [] }
}

export async function getAllCustomTransforms(): Promise<CustomTransformation[]> {
  const index = await getIndex()
  if (index.ids.length === 0) return []

  const keys = index.ids.map(itemKey)
  const result = await chrome.storage.sync.get(keys)

  return index.ids.map((id) => result[itemKey(id)] as CustomTransformation).filter(Boolean)
}

export async function getCustomTransformById(id: string): Promise<CustomTransformation | null> {
  const result = await chrome.storage.sync.get(itemKey(id))
  return (result[itemKey(id)] as CustomTransformation) ?? null
}

export async function createCustomTransform(
  data: Omit<CustomTransformation, 'id' | 'createdAt' | 'updatedAt'>
): Promise<CustomTransformation> {
  const index = await getIndex()

  if (index.ids.length >= MAX_TRANSFORMS) {
    throw new Error(`Maximum of ${MAX_TRANSFORMS} custom transformations reached`)
  }

  const id = crypto.randomUUID()
  const now = Date.now()
  const transform: CustomTransformation = { ...data, id, createdAt: now, updatedAt: now }

  index.ids.push(id)
  await chrome.storage.sync.set({
    [INDEX_KEY]: index,
    [itemKey(id)]: transform,
  })

  return transform
}

export async function updateCustomTransform(
  id: string,
  updates: Partial<Omit<CustomTransformation, 'id' | 'createdAt'>>
): Promise<CustomTransformation | null> {
  const existing = await getCustomTransformById(id)
  if (!existing) return null

  const updated: CustomTransformation = { ...existing, ...updates, updatedAt: Date.now() }
  await chrome.storage.sync.set({ [itemKey(id)]: updated })
  return updated
}

export async function deleteCustomTransform(id: string): Promise<boolean> {
  const index = await getIndex()
  const pos = index.ids.indexOf(id)
  if (pos === -1) return false

  index.ids.splice(pos, 1)
  await chrome.storage.sync.set({ [INDEX_KEY]: index })
  await chrome.storage.sync.remove(itemKey(id))
  return true
}
