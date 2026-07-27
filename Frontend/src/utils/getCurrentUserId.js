export const getCurrentUserId = () => {
  try {
    const storageKeys = Object.keys(localStorage)
    const supabaseKey = storageKeys.find(
      key => key.startsWith("sb-") && key.endsWith("-auth-token")
    )
    if (!supabaseKey) return null

    const sessionData = JSON.parse(localStorage.getItem(supabaseKey))

    return (
      sessionData?.user?.id ||
      sessionData?.currentSession?.user?.id ||
      null
    )
  } catch (err) {
    console.error(err)
    return null
  }
}