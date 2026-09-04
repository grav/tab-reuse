export function hostnameFor(url) {
  try {
    const parsed = new URL(url)
    return ["http:", "https:"].includes(parsed.protocol)
      ? parsed.hostname.toLowerCase()
      : null
  } catch {
    return null
  }
}

export function matchingPinnedTabs(tabs, targetUrl, sourceWindowId) {
  const targetHostname = hostnameFor(targetUrl)
  if (!targetHostname) return []

  return tabs
    .filter(
      (tab) =>
        tab.pinned &&
        tab.windowId === sourceWindowId &&
        hostnameFor(tab.url) === targetHostname,
    )
    .sort((left, right) => left.index - right.index)
}

export function pinnedHostnames(tabs) {
  return [
    ...new Set(
      tabs
        .filter((tab) => tab.pinned)
        .map((tab) => hostnameFor(tab.url))
        .filter(Boolean),
    ),
  ]
}
