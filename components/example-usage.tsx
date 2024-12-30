import { useRealtime, usePresence } from '@/lib/hooks/useRealtime'

export function CourtStatus({ courtId }: { courtId: string }) {
  const { data, error, isLoading } = useRealtime({
    channelName: `court_${courtId}`,
    event: 'UPDATE',
    filter: `id=eq.${courtId}`
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return <div>Court Status: {data?.status}</div>
}

export function OnlinePlayers() {
  const presenceData = usePresence('online_players')
  
  return (
    <div>
      <h3>Online Players</h3>
      <ul>
        {presenceData.map((presence) => (
          <li key={presence.user_id}>
            {presence.user_id} - {presence.status}
          </li>
        ))}
      </ul>
    </div>
  )
} 