const userLoginForm = document.getElementById("userLoginForm");
userLoginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await submitAuthForm(userLoginForm, "loginMessage");
});

async function submitAuthForm(form, messageId) {
  const message = document.getElementById(messageId);
  const button = form.querySelector("button");
  message.textContent = "";
  if ([...form.querySelectorAll("input[required]")].some((field) => !field.value.trim())) { message.textContent = "Please complete all required fields."; return; }
  button.disabled = true;
  const originalText = button.textContent;
  button.textContent = "Please wait…";
  try {
    const response = await fetch(form.action, { method:"POST", headers:{"Content-Type":"application/json"}, credentials:"include", body:JSON.stringify(Object.fromEntries(new FormData(form))) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Unable to log in. Please try again.");
    window.location.assign(typeof data.redirectUrl === "string" && data.redirectUrl.startsWith("/") ? data.redirectUrl : "/dashboard");
  } catch (error) { message.textContent = error.message; } finally { button.disabled = false; button.textContent = originalText; }
}
