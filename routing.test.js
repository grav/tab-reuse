import test from "node:test"
import assert from "node:assert/strict"

import { hostnameFor, matchingPinnedTabs, pinnedHostnames } from "./routing.js"

test("extracts normalized HTTP hostnames", () => {
  assert.equal(hostnameFor("https://GitHub.com/foobar"), "github.com")
  assert.equal(hostnameFor("chrome://extensions"), null)
  assert.equal(hostnameFor("not a url"), null)
})

test("matches by exact hostname only within the source window", () => {
  const tabs = [
    { id: 1, pinned: true, url: "https://github.com/one", windowId: 1, index: 0 },
    { id: 2, pinned: true, url: "https://github.com/two", windowId: 2, index: 2 },
    { id: 3, pinned: true, url: "https://gist.github.com/three", windowId: 2, index: 0 },
    { id: 4, pinned: false, url: "https://github.com/four", windowId: 2, index: 1 },
  ]

  assert.deepEqual(
    matchingPinnedTabs(tabs, "https://github.com/foobar", 2).map((tab) => tab.id),
    [2],
  )
})

test("does not reuse a matching pinned tab in another window", () => {
  const tabs = [
    { id: 1, pinned: true, url: "https://github.com/one", windowId: 1, index: 0 },
  ]

  assert.deepEqual(
    matchingPinnedTabs(tabs, "https://github.com/two", 2),
    [],
  )
})

test("lists each pinned hostname once", () => {
  assert.deepEqual(
    pinnedHostnames([
      { pinned: true, url: "https://github.com/one" },
      { pinned: true, url: "https://github.com/two" },
      { pinned: false, url: "https://example.com" },
    ]),
    ["github.com"],
  )
})
