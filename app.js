// ResumeAI frontend logic
// Payment: Gumroad product page — buyer receives access code in download

const API_URL = "/api/generate";
// TODO: Replace with your Gumroad product URL after creating the product
const PAYHIP_URL = "https://dzyntwrk.gumroad.com";

let usesRemaining = parseInt(localStorage.getItem("resumeai_uses") ?? "1");

function scrollToApp() {
  document.getElementById("app").scrollIntoView({ behavior: "smooth" });
}

function countChars(el, countId) {
  document.getElementById(countId).textContent = `${el.value.length.toLocaleString()} characters`;
}

function showLoader(text) {
  const loader = document.getElementById("loader");
  loader.classList.add("visible");
  document.getElementById("loader-text").textContent = text;
}

function hideLoader() {
  document.getElementById("loader").classList.remove("visible");
}

function showError(msg) {
  const el = document.getElementById("error-box");
  el.textContent = msg;
  el.classList.add("visible");
  setTimeout(() => el.classList.remove("visible"), 6000);
}

function switchTab(tabId) {
  document.querySelectorAll(".output-tab").forEach((t, i) => {
    t.classList.toggle("active", (i === 0 && tabId === "resume-out") || (i === 1 && tabId === "cover-out"));
  });
  document.querySelectorAll(".output-content").forEach(c => c.classList.remove("active"));
  document.getElementById(tabId).classList.add("active");
}

function copyOutput(id) {
  const text = document.getElementById(id).textContent;
  navigator.clipboard.writeText(text).then(() => {
    const btn = event.target;
    btn.textContent = "✅ Copied!";
    setTimeout(() => { btn.textContent = "📋 Copy"; }, 2000);
  });
}

function downloadOutput(id, filename) {
  const text = document.getElementById(id).textContent;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  a.download = `${filename}.txt`;
  a.click();
}

function startCheckout() {
  window.open(PAYHIP_URL, "_blank");
}

function redeemCode() {
  const input = document.getElementById("access-code");
  const code = input.value.trim().toUpperCase();

  if (!code) {
    input.focus();
    return;
  }

  // Validate code against API
  fetch("/api/redeem", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code })
  })
    .then(r => r.json())
    .then(data => {
      if (data.valid) {
        usesRemaining += 10;
        localStorage.setItem("resumeai_uses", usesRemaining.toString());
        // track redeemed codes so same code can only be used once per browser
        const used = JSON.parse(localStorage.getItem("resumeai_redeemed") || "[]");
        used.push(code);
        localStorage.setItem("resumeai_redeemed", JSON.stringify(used));
        document.getElementById("paywall").classList.remove("visible");
        document.getElementById("free-note").textContent = `✅ ${usesRemaining} tailorings remaining`;
        input.value = "";
      } else {
        input.style.borderColor = "#ef4444";
        input.value = "";
        input.placeholder = "Invalid code — check your Gumroad download";
        setTimeout(() => {
          input.style.borderColor = "";
          input.placeholder = "Paste your access code here…";
        }, 3000);
      }
    })
    .catch(() => {
      showError("Could not validate code. Please try again.");
    });
}

function typeText(elementId, text, speed = 8) {
  const el = document.getElementById(elementId);
  el.textContent = "";
  let i = 0;
  const interval = setInterval(() => {
    el.textContent += text[i];
    i++;
    if (i >= text.length) clearInterval(interval);
  }, speed);
}

async function generate() {
  const resume = document.getElementById("resume").value.trim();
  const jobDesc = document.getElementById("job-desc").value.trim();
  const name = document.getElementById("name").value.trim();
  const role = document.getElementById("role").value.trim();
  const tone = document.getElementById("tone").value;
  const outputType = document.getElementById("output-type").value;

  if (!resume) { showError("Please paste your resume."); return; }
  if (!jobDesc) { showError("Please paste the job description."); return; }

  if (usesRemaining <= 0) {
    document.getElementById("paywall").classList.add("visible");
    document.getElementById("paywall").scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  document.getElementById("generate-btn").disabled = true;
  document.getElementById("output-section").classList.remove("visible");
  document.getElementById("error-box").classList.remove("visible");
  document.getElementById("paywall").classList.remove("visible");

  const loaderTexts = [
    "Analyzing job description…",
    "Extracting key requirements…",
    "Tailoring your experience…",
    "Writing cover letter…",
    "Polishing output…"
  ];
  let loaderIdx = 0;
  showLoader(loaderTexts[0]);
  const loaderInterval = setInterval(() => {
    loaderIdx = (loaderIdx + 1) % loaderTexts.length;
    document.getElementById("loader-text").textContent = loaderTexts[loaderIdx];
  }, 2000);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume, jobDesc, name, role, tone, outputType })
    });

    clearInterval(loaderInterval);
    hideLoader();

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Server error ${response.status}`);
    }

    const data = await response.json();

    usesRemaining--;
    localStorage.setItem("resumeai_uses", usesRemaining.toString());
    updateUsesNote();

    document.getElementById("output-section").classList.add("visible");

    if (data.resume) {
      typeText("resume-output", data.resume);
    } else {
      document.getElementById("resume-output").textContent = "(Resume tailoring not requested)";
    }

    if (data.coverLetter) {
      document.getElementById("cover-output").textContent = data.coverLetter;
    } else {
      document.getElementById("cover-output").textContent = "(Cover letter not requested)";
    }

    if (outputType === "cover") {
      switchTab("cover-out");
    } else {
      switchTab("resume-out");
    }

  } catch (err) {
    clearInterval(loaderInterval);
    hideLoader();
    showError(`Error: ${err.message}`);
  } finally {
    document.getElementById("generate-btn").disabled = false;
  }
}

function updateUsesNote() {
  const note = document.getElementById("free-note");
  if (usesRemaining <= 0) {
    note.textContent = "No tailorings left — unlock more below";
    note.style.color = "#f87171";
  } else if (usesRemaining === 1) {
    note.textContent = "1 free tailoring remaining";
  } else {
    note.textContent = `${usesRemaining} tailorings remaining`;
  }
}

// Init
updateUsesNote();
