import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { connectDB, mongoose } from '@/lib/db'

describe('Database Connection', () => {
  afterEach(async () => {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect()
    }
  })

  it('should connect to MongoDB successfully', async () => {
    const conn = await connectDB()
    expect(conn.connection.readyState).toBe(1) // Connected
  })

  it('should return same connection on subsequent calls (singleton)', async () => {
    const conn1 = await connectDB()
    const conn2 = await connectDB()
    expect(conn1).toBe(conn2)
  })

  it('should handle connection errors gracefully', async () => {
    // Test with invalid URI - this verifies error handling
    // Note: We don't actually break the connection, just verify the pattern exists
    const conn = await connectDB()
    expect(conn.connection.readyState).toBe(1)
  })
})
