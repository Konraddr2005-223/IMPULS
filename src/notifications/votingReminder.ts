import { createNotification } from './api'

/** Spec §4 demo reminder — only for presentation simulation. */
export async function sendVotingReminderDemo(input: {
  recipientIds: string[]
  ideaId: string
  ideaTitle: string
}) {
  for (const recipientId of input.recipientIds) {
    await createNotification({
      recipientId,
      ideaId: input.ideaId,
      type: 'voting_reminder',
      eventKey: `demo:voting:${input.ideaId}:${recipientId}`,
      payload: {
        title: input.ideaTitle,
        message: 'Przypomnienie demonstracyjne o głosowaniu.',
      },
    })
  }
}
