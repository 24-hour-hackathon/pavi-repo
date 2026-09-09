const registrationForm = document.getElementById("userRegistrationForm");
registrationForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = document.getElementById("registerMessage");
  const button = registrationForm.querySelector("button");
  message.textContent = "";
  if ([...registrationForm.querySelectorAll("input[required]")].some((field) => !field.value.trim())) { message.textContent = "Please complete all required fields."; return; }
  button.disabled = true; button.textContent = "Creating account…";
  try {
    const response = await fetch(registrationForm.action, { method:"POST", headers:{"Content-Type":"application/json"}, credentials:"include", body:JSON.stringify(Object.fromEntries(new FormData(registrationForm))) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Unable to create your account. Please try again.");
    window.location.assign(typeof data.redirectUrl === "string" && data.redirectUrl.startsWith("/") ? data.redirectUrl : "user-login.html");
  } catch (error) { message.textContent = error.message; } finally { button.disabled = false; button.textContent = "Register →"; }
});
