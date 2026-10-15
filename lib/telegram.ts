// Utilidad para enviar notificaciones a Telegram cuando un invitado responde a su confirmación

export async function sendTelegramNotification(text: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!botToken || !chatId) {
    // Si no están configuradas las variables, se omite silenciosamente sin romper el flujo
    return
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
      })
    })
  } catch (error) {
    console.error('Error enviando notificación a Telegram:', error)
  }
}
