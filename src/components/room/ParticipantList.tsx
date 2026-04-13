'use client'
import { useRoomStore } from '@/store/roomStore'
import Image from 'next/image'

export function ParticipantList() {
  const { participants, participantCount } = useRoomStore()

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-3">
        Participants ({participantCount})
      </h3>
      {participants.length === 0 ? (
        <p className="text-gray-500 text-sm">No participants yet</p>
      ) : (
        <ul className="space-y-2">
          {participants.map((participant) => (
            <li key={participant.userId} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
              {participant.userPhoto ? (
                <Image
                  src={participant.userPhoto}
                  alt={participant.userName}
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-indigo-700 font-semibold text-sm">
                    {participant.userName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-sm font-medium text-gray-900">
                {participant.userName}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
