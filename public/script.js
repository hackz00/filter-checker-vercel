async function checkLinks() {
  const resultDiv = document.getElementById("result")
  const loadingDiv = document.getElementById("loading")
  const progressContainer = document.getElementById("progress-container")
  const progressBar = document.getElementById("progress-bar")
  const controlsDiv = document.getElementById("controls")

  resultDiv.innerHTML = ""
  loadingDiv.style.display = "block"
  progressContainer.style.display = "block"
  progressBar.style.width = "0%"
  controlsDiv.style.display = "none"

  const inputText = document.getElementById("inputText").value
  const domainRegex = /([a-zA-Z0-9-]+(\.[a-zA-Z]{2,}){1,2})/g
  const extractedDomains = inputText.match(domainRegex)
  const uniqueDomains = [...new Set(extractedDomains || [])]

  if (uniqueDomains.length === 0) {
    resultDiv.innerHTML = "Please enter URLs to check."
    loadingDiv.style.display = "none"
    progressContainer.style.display = "none"
    return
  }

  try {
    const response = await fetch("/check-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls: uniqueDomains }),
    })

    const data = await response.json()

    console.log("Received data:", data)

    loadingDiv.style.display = "none"
    progressContainer.style.display = "none"

    if (!data || !data.domains || data.domains.length === 0) {
      resultDiv.innerHTML = "No domains found or error processing domains."
      return
    }

    const table = document.createElement("table")
    table.innerHTML = `
      <thead>
        <tr>
          <th>Domain</th>
          <th>Lightspeed Status</th>
          <th>Lightspeed Category</th>
          <th>FortiGuard Status</th>
          <th>FortiGuard Category</th>
        </tr>
      </thead>
      <tbody>
        ${data.domains
        .map(
          (domain) => `
          <tr>
            <td>${domain.url}</td>
            <td class="${domain.lightspeed.status === "Unblocked" ? "unblocked" : "blocked"}">${domain.lightspeed.status}</td>
            <td>${domain.lightspeed.category || "N/A"}</td>
            <td class="${domain.fortiguard.status === "Unblocked" ? "unblocked" : "blocked"}">${domain.fortiguard.status}</td>
            <td>${domain.fortiguard.category || "N/A"}</td>
          </tr>
        `,
        )
        .join("")}
      </tbody>
    `

    resultDiv.appendChild(table)

    // Show controls after results are loaded
    controlsDiv.style.display = "flex"

    // Add event listeners for the copy buttons
    document.getElementById("copyLightspeedUnblocked").addEventListener("click", () => {
      copyUnblockedDomains(data.domains, "lightspeed")
    })

    document.getElementById("copyFortiguardUnblocked").addEventListener("click", () => {
      copyUnblockedDomains(data.domains, "fortiguard")
    })
  } catch (error) {
    resultDiv.innerHTML = "Error checking links. Please try again."
    console.error("Error fetching data:", error)
  }
}

function copyUnblockedDomains(domains, filter) {
  const unblockedDomains = domains
    .filter((domain) => domain[filter].status === "Unblocked")
    .map((domain) => domain.url)
    .join("\n")

  navigator.clipboard.writeText(unblockedDomains).then(
    () => {
      alert(`Unblocked domains for ${filter} copied to clipboard!`)
    },
    (err) => {
      console.error("Could not copy text: ", err)
    },
  )
}

const progressSource = new EventSource("/progress")
progressSource.onmessage = (event) => {
  const progress = JSON.parse(event.data)
  const progressBar = document.getElementById("progress-bar")
  progressBar.style.width = progress.percentage + "%"
}

