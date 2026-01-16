// ==UserScript==
// @name         Stash-Box Tag Aliases Badges
// @namespace    https://github.com/xantror/stash-userscripts
// @version      0.3.0
// @description  Display tag aliases as Bootstrap badges on Stash-Box instances
// @author       xantror
// @match        https://stashdb.org/*
// @match        https://fansdb.cc/*
// @match        https://javstash.org/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
  "use strict";

  function getTagIdFromUrl() {
    const match = location.pathname.match(/\/tags\/([a-f0-9-]+)/i);
    return match?.[1] ?? null;
  }

  async function fetchAliases(id) {
    try {
      const response = await fetch("/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          operationName: "Tag",
          variables: { id },
          query: `query Tag($id: ID) { findTag(id: $id) { aliases } }`,
        }),
      });
      if (!response.ok) return null;
      const { data } = await response.json();
      return data?.findTag?.aliases ?? null;
    } catch {
      return null;
    }
  }

  function findAliasesRow() {
    for (const el of document.querySelectorAll(".NarrowPage .d-flex > b")) {
      if (el.textContent.trim() === "Aliases:") {
        return el.parentElement;
      }
    }
    return null;
  }

  function renderBadges(row, aliases) {
    row.classList.add("flex-wrap", "align-items-center");

    const textSpan = row.querySelector("span");
    if (textSpan) textSpan.remove();

    aliases.forEach((alias, i) => {
      const badge = document.createElement("span");
      badge.className = "badge bg-secondary";
      badge.textContent = alias;
      if (i > 0) badge.style.marginLeft = "0.25rem";
      row.appendChild(badge);
    });
  }

  async function processPage() {
    const tagId = getTagIdFromUrl();
    if (!tagId) return;

    const row = findAliasesRow();
    if (!row || row.dataset.processed) return;
    row.dataset.processed = "true";

    const aliases = await fetchAliases(tagId);
    if (!aliases?.length) return;

    renderBadges(row, aliases);
  }

  let debounceTimer;
  new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(processPage, 100);
  }).observe(document.body, { childList: true, subtree: true });

  processPage();
})();
