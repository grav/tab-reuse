import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import vm from "node:vm"

const script = readFileSync(new URL("./content.js", import.meta.url), "utf8")

function setup(pageUrl, hostnames) {
  let onMessage
  let onClick
  let capture
  const messages = []
  const navigations = []

  class HTMLAnchorElement {
    constructor(href) {
      this.href = href
      this.target = ""
      this.download = ""
    }
  }

  vm.runInNewContext(script, {
    URL,
    HTMLAnchorElement,
    document: {
      baseURI: pageUrl,
      addEventListener(type, listener, useCapture) {
        assert.equal(type, "click")
        onClick = listener
        capture = useCapture
      },
    },
    window: {
      location: {
        hostname: new URL(pageUrl).hostname,
        assign: (url) => navigations.push(url),
      },
      open: (url) => navigations.push(url),
    },
    chrome: {
      runtime: {
        onMessage: { addListener: (listener) => { onMessage = listener } },
        async sendMessage(message) {
          messages.push(message)
          return { reused: true }
        },
      },
    },
  })
  onMessage({ type: "pinned-hostnames", hostnames })
  messages.length = 0

  return {
    messages,
    navigations,
    capture,
    async click(href, overrides = {}) {
      const anchor = new HTMLAnchorElement(href)
      const event = {
        button: 0,
        defaultPrevented: false,
        stopped: false,
        composedPath: () => [anchor],
        preventDefault() { this.defaultPrevented = true },
        stopImmediatePropagation() { this.stopped = true },
        ...overrides,
      }
      await onClick(event)
      return event
    },
  }
}

test("leaves Linear project clicks to the app even with a pinned Linear tab", async () => {
  const page = setup("https://linear.app/team/issue/ABC-1", ["linear.app"])
  const event = await page.click("https://linear.app/team/project/project-1")

  assert.equal(event.defaultPrevented, false)
  assert.equal(event.stopped, false)
  assert.deepEqual(page.messages, [])
  assert.deepEqual(page.navigations, [])
})

test("allows page handlers to cancel cross-hostname navigation", async () => {
  const page = setup("https://example.com", ["linear.app"])
  assert.equal(page.capture, false)
  const event = await page.click("https://linear.app/team/project/project-1", {
    defaultPrevented: true,
  })

  assert.equal(event.stopped, false)
  assert.deepEqual(page.messages, [])
  assert.deepEqual(page.navigations, [])
})

test("still reuses pinned tabs for ordinary cross-hostname links", async () => {
  const page = setup("https://example.com", ["linear.app"])
  const url = "https://linear.app/team/issue/ABC-1"
  const event = await page.click(url)

  assert.equal(event.defaultPrevented, true)
  assert.equal(page.messages.length, 1)
  assert.equal(page.messages[0].type, "reuse-pinned-tab")
  assert.equal(page.messages[0].url, url)
  assert.deepEqual(page.navigations, [])
})
