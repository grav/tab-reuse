let pinnedHostnames = new Set()

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "pinned-hostnames") {
    pinnedHostnames = new Set(message.hostnames)
  }
})

chrome.runtime.sendMessage({ type: "get-pinned-hostnames" }).catch(() => {})

function clickedAnchor(event) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return null
  }

  const anchor = event.composedPath().find(
    (element) => element instanceof HTMLAnchorElement,
  )

  if (!anchor || anchor.download) return null

  try {
    const url = new URL(anchor.href, document.baseURI)
    if (!["http:", "https:"].includes(url.protocol)) return null
    if (!pinnedHostnames.has(url.hostname.toLowerCase())) return null
    return { url: url.href, target: anchor.target }
  } catch {
    return null
  }
}

document.addEventListener(
  "click",
  async (event) => {
    const link = clickedAnchor(event)
    if (!link) return

    event.preventDefault()
    event.stopImmediatePropagation()

    try {
      const result = await chrome.runtime.sendMessage({
        type: "reuse-pinned-tab",
        url: link.url,
      })

      // The hostname cache can briefly be stale after a tab is unpinned.
      if (!result?.reused) openNormally(link)
    } catch {
      openNormally(link)
    }
  },
  true,
)

function openNormally(link) {
  if (link.target && link.target.toLowerCase() !== "_self") {
    window.open(link.url, link.target)
  } else {
    window.location.assign(link.url)
  }
}
