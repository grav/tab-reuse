import {
  hostnameFor,
  matchingPinnedTabs,
  pinnedHostnames,
} from "./routing.js"

const newlyCreatedTabIds = new Set()

async function getPinnedTabs() {
  return chrome.tabs.query({ pinned: true })
}

async function sendHostnames(tabId) {
  const hostnames = pinnedHostnames(await getPinnedTabs())
  return chrome.tabs.sendMessage(tabId, { type: "pinned-hostnames", hostnames })
}

async function broadcastHostnames() {
  const hostnames = pinnedHostnames(await getPinnedTabs())
  const tabs = await chrome.tabs.query({})

  await Promise.allSettled(
    tabs.map((tab) =>
      chrome.tabs.sendMessage(tab.id, { type: "pinned-hostnames", hostnames }),
    ),
  )
}

async function reuseNewTab(tab, targetUrl) {
  const [match] = matchingPinnedTabs(
    await getPinnedTabs(),
    targetUrl,
    tab.windowId,
  )

  if (!match) return false

  await chrome.tabs.update(match.id, { active: true, url: targetUrl })
  await chrome.windows.update(match.windowId, { focused: true })
  await chrome.tabs.remove(tab.id)
  return true
}

function routeNewTabWhenPossible(tab, targetUrl) {
  if (!hostnameFor(targetUrl)) return

  newlyCreatedTabIds.delete(tab.id)
  reuseNewTab(tab, targetUrl).catch(() => {})
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "get-pinned-hostnames" && sender.tab?.id != null) {
    sendHostnames(sender.tab.id).catch(() => {})
    return
  }

  if (message?.type !== "reuse-pinned-tab" || sender.tab?.id == null) return

  ;(async () => {
    const pinnedTabs = await getPinnedTabs()
    const [match] = matchingPinnedTabs(
      pinnedTabs,
      message.url,
      sender.tab.windowId,
    )

    if (!match) {
      sendResponse({ reused: false })
      broadcastHostnames().catch(() => {})
      return
    }

    await chrome.tabs.update(match.id, { active: true, url: message.url })
    await chrome.windows.update(match.windowId, { focused: true })
    sendResponse({ reused: true })
  })().catch(() => sendResponse({ reused: false }))

  return true
})

chrome.tabs.onCreated.addListener((tab) => {
  if (!tab.pinned) newlyCreatedTabIds.add(tab.id)
  routeNewTabWhenPossible(tab, tab.pendingUrl || tab.url)
  broadcastHostnames()
})
chrome.tabs.onRemoved.addListener((tabId) => {
  newlyCreatedTabIds.delete(tabId)
  broadcastHostnames()
})
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (newlyCreatedTabIds.has(tabId) && changeInfo.url) {
    routeNewTabWhenPossible(tab, changeInfo.url)
  }

  if (changeInfo.pinned !== undefined || changeInfo.url !== undefined) {
    broadcastHostnames()
  }
})
chrome.tabs.onAttached.addListener(() => broadcastHostnames())
chrome.tabs.onDetached.addListener(() => broadcastHostnames())
