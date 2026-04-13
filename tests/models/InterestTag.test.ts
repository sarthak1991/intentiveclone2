import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { connectDB, mongoose } from '@/lib/db'
import { InterestTag } from '@/models/InterestTag'

describe('InterestTag Model', () => {
  beforeAll(async () => {
    await connectDB()
  })

  afterAll(async () => {
    await mongoose.disconnect()
  })

  beforeEach(async () => {
    await InterestTag.deleteMany({})
  })

  it('should create interest tag', async () => {
    const tag = await InterestTag.create({
      name: 'coding',
      description: 'Programming and software development'
    })

    expect(tag.name).toBe('coding')
    expect(tag.description).toBe('Programming and software development')
    expect(tag.isActive).toBe(true)
  })

  it('should enforce unique names', async () => {
    await InterestTag.create({
      name: 'coding',
      description: 'Programming'
    })

    await expect(InterestTag.create({
      name: 'coding',
      description: 'Different description'
    })).rejects.toThrow()
  })

  it('should trim tag names', async () => {
    const tag = await InterestTag.create({
      name: '  writing  ',
      description: 'Writing and content creation'
    })

    expect(tag.name).toBe('writing')
  })

  it('should filter active tags', async () => {
    await InterestTag.create([
      { name: 'coding', isActive: true },
      { name: 'writing', isActive: true },
      { name: 'design', isActive: false }
    ])

    const activeTags = await InterestTag.find({ isActive: true }).sort({ name: 1 })
    const inactiveTags = await InterestTag.find({ isActive: false })

    expect(activeTags).toHaveLength(2)
    expect(activeTags[0].name).toBe('coding')
    expect(activeTags[1].name).toBe('writing')
    expect(inactiveTags).toHaveLength(1)
    expect(inactiveTags[0].name).toBe('design')
  })
})
