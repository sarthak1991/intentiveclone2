import { NextRequest, NextResponse } from 'next/server'
import { getPhotoBucket, User } from '@/models/User'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Please log in to upload a photo' },
        { status: 401 }
      )
    }

    const formData = await req.formData()
    const file = formData.get('photo') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Please choose a photo to upload' },
        { status: 400 }
      )
    }

    // Validate file size (5MB max per Pitfall 4)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({
        error: 'File too large. Please choose an image under 5MB.'
      }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({
        error: 'Please upload a valid image file (JPEG, PNG).'
      }, { status: 400 })
    }

    await connectDB()

    // Convert File to Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to GridFS
    const bucket = getPhotoBucket()
    const uploadStream = bucket.openUploadStream(file.name, {
      contentType: file.type,
      metadata: {
        userId: session.user.id,
        uploadedAt: new Date()
      }
    })

    await new Promise((resolve, reject) => {
      uploadStream.write(buffer)
      uploadStream.end()
      uploadStream.on('finish', resolve)
      uploadStream.on('error', reject)
    })

    // Update user with photo ID
    await User.findByIdAndUpdate(session.user.id, {
      photoId: uploadStream.id,
      photoUrl: `/api/photos/${uploadStream.id}`
    })

    return NextResponse.json({
      success: true,
      photoId: uploadStream.id.toString(),
      photoUrl: `/api/photos/${uploadStream.id}`
    })

  } catch (error) {
    console.error('Photo upload error:', error)
    return NextResponse.json({
      error: 'Failed to upload photo. Please try again.'
    }, { status: 500 })
  }
}
