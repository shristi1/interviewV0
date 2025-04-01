class TrieNode {
    constructor() {
      this.children = {}
      this.isEndOfWord = false
    }
  }
  
  class Autocomplete {
    constructor() {
      this.root = new TrieNode()
      this.wordCount = 0
    }
  
    // Inserts a word into the Trie structure
    insert(word) {
      let node = this.root
      for (const char of word) {
        if (!node.children[char]) {
          node.children[char] = new TrieNode()
        }
        node = node.children[char] // Moving to next node
      }
      if (!node.isEndOfWord) {
        this.wordCount++
        node.isEndOfWord = true
      }
    }
  
    // Return suggestions given input from a user
    getSuggestions(prefix, k = 10) {
      if (!prefix || prefix.length === 0) return []
  
      let node = this.root
      for (const char of prefix.split("")) {
        if (!node.children[char]) {
          return [] // if the prefix doesn't match a word in the wordList
        }
        node = node.children[char]
      }
      // collect all the words in the trie
      return this.collectWords(node, prefix, k)
    }
  
    collectWords(node, prefix, k) {
      let results = []
      if (node.isEndOfWord) {
        results.push(prefix)
      }
  
      // Recursively collect words from child nodes
      for (const char in node.children) {
        if (results.length >= k) break
        results = results.concat(this.collectWords(node.children[char], prefix + char, k - results.length))
      }
  
      return results.slice(0, k)
    }
  }
  
  let wordList = []
  const autocomplete = new Autocomplete()
  let isLoading = true
  let selectedIndex = -1
  
  // DOM elements
  const searchBox = document.getElementById("searchBox")
  const suggestionsBox = document.getElementById("suggestions")
  const loader = document.getElementById("loader")
  const searchInfo = document.getElementById("searchInfo")
  const wordCount = document.getElementById("wordCount")
  
  // Show loading state
  loader.classList.add("active")
  searchInfo.textContent = "Loading dictionary..."
  searchInfo.classList.add("pulse")
  
  const url = "wordlist.txt"
  fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Couldn't fetch. Error status: ${response.status}`)
      }
      return response.text()
    })
    .then((data) => {
      wordList = data
        .split("\n")
        .map((word) => word.trim())
        .filter((word) => word.length > 0)
      for (const word of wordList) {
        autocomplete.insert(word)
      }
      isLoading = false
      loader.classList.remove("active")
      searchInfo.classList.remove("pulse")
      searchInfo.textContent = `Ready to search`
      wordCount.textContent = `${autocomplete.wordCount.toLocaleString()} words`
  
      // Focus the search box after loading
      searchBox.focus()
    })
    .catch((error) => {
      console.log("Couldn't complete fetch: ", error)
      isLoading = false
      loader.classList.remove("active")
      searchInfo.classList.remove("pulse")
      searchInfo.classList.add("warning")
      searchInfo.textContent = "Error loading dictionary. Please try again."
    })
  
  function handleSearches() {
    if (isLoading) return
  
    const query = searchBox.value.trim().toLowerCase()
  
    // Clear the prev suggestions
    suggestionsBox.innerHTML = ""
    selectedIndex = -1
  
    if (!query) {
      suggestionsBox.classList.remove("active")
      searchInfo.className = "search-info"
      searchInfo.textContent = "Type to see suggestions"
      return
    }
  
    const suggestions = autocomplete.getSuggestions(query)
  
    if (suggestions.length > 0) {
      suggestionsBox.classList.add("active")
  
      suggestions.forEach((word, index) => {
        const li = document.createElement("li")
        li.textContent = word
        li.setAttribute("role", "option")
        li.setAttribute("id", `suggestion-${index}`)
        li.setAttribute("aria-selected", "false")
  
        // Highlight the matching part
        const matchIndex = word.toLowerCase().indexOf(query.toLowerCase())
        if (matchIndex !== -1) {
          const beforeMatch = word.substring(0, matchIndex)
          const match = word.substring(matchIndex, matchIndex + query.length)
          const afterMatch = word.substring(matchIndex + query.length)
          li.innerHTML = `${beforeMatch}<strong>${match}</strong>${afterMatch}`
        }
  
        li.onclick = () => {
          searchBox.value = word
          suggestionsBox.classList.remove("active")
          searchInfo.className = "search-info success"
          searchInfo.textContent = `Selected: ${word}`
        }
  
        suggestionsBox.appendChild(li)
      })
  
      searchInfo.className = "search-info"
      searchInfo.textContent = `Found ${suggestions.length} suggestion${suggestions.length === 1 ? "" : "s"}`
    } else {
      suggestionsBox.classList.remove("active")
      searchInfo.className = "search-info warning"
      searchInfo.textContent = "No suggestions found"
    }
  }
  
  function handleKeyDown(e) {
    const suggestions = suggestionsBox.querySelectorAll("li")
  
    if (!suggestions.length || !suggestionsBox.classList.contains("active")) return
  
    // Down arrow
    if (e.key === "ArrowDown") {
      e.preventDefault()
      selectedIndex = (selectedIndex + 1) % suggestions.length
      updateSelection(suggestions)
    }
  
    // Up arrow
    else if (e.key === "ArrowUp") {
      e.preventDefault()
      selectedIndex = (selectedIndex - 1 + suggestions.length) % suggestions.length
      updateSelection(suggestions)
    }
  
    // Enter key
    else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault()
      searchBox.value = suggestions[selectedIndex].textContent
      suggestionsBox.classList.remove("active")
      searchInfo.className = "search-info success"
      searchInfo.textContent = `Selected: ${searchBox.value}`
    }
  
    // Escape key
    else if (e.key === "Escape") {
      suggestionsBox.classList.remove("active")
    }
  }
  
  function updateSelection(suggestions) {
    suggestions.forEach((suggestion, index) => {
      suggestion.classList.toggle("selected", index === selectedIndex)
      suggestion.setAttribute("aria-selected", index === selectedIndex ? "true" : "false")
  
      if (index === selectedIndex) {
        // Ensure the selected item is visible in the scrollable area
        const container = suggestionsBox
        const item = suggestion
  
        const containerRect = container.getBoundingClientRect()
        const itemRect = item.getBoundingClientRect()
  
        if (itemRect.bottom > containerRect.bottom) {
          container.scrollTop += itemRect.bottom - containerRect.bottom
        } else if (itemRect.top < containerRect.top) {
          container.scrollTop -= containerRect.top - itemRect.top
        }
      }
    })
  }
  
  // Debounce function to limit how often a function can be called
  function debounce(func, wait) {
    let timeout
    return function (...args) {
      clearTimeout(timeout)
      timeout = setTimeout(() => func.apply(this, args), wait)
    }
  }
  
  // Event listeners
  searchBox.addEventListener("input", debounce(handleSearches, 100))
  searchBox.addEventListener("keydown", handleKeyDown)
  searchBox.addEventListener("focus", handleSearches)
  
  // Close suggestions when clicking outside
  document.addEventListener("click", (e) => {
    if (!searchBox.contains(e.target) && !suggestionsBox.contains(e.target)) {
      suggestionsBox.classList.remove("active")
    }
  })
  
  // Add some visual feedback when clicking on the search box
  searchBox.addEventListener("click", () => {
    if (searchBox.value.trim() && !suggestionsBox.classList.contains("active")) {
      handleSearches()
    }
  })
  
  