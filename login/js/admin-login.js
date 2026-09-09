const adminLoginForm = document.getElementById("adminLoginForm");
adminLoginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = document.getElementById("adminMessage");
  const button = adminLoginForm.querySelector("button");
  message.textContent = "";
  if ([...adminLoginForm.querySelectorAll("input[required]")].some((field) => !field.value.trim())) { message.textContent = "Please complete all required fields."; return; }
  button.disabled = true; button.textContent = "Please wait…";
  try {
    const response = await fetch(adminLoginForm.action, { method:"POST", headers:{"Content-Type":"application/json"}, credentials:"include", body:JSON.stringify(Object.fromEntries(new FormData(adminLoginForm))) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Unable to log in. Please try again.");
    window.location.assign(typeof data.redirectUrl === "string" && data.redirectUrl.startsWith("/") ? data.redirectUrl : "/admin/dashboard");
  } catch (error) { message.textContent = error.message; } finally { button.disabled = false; button.textContent = "Log in →"; }
});
