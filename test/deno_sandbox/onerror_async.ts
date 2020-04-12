async function errAsync() {
  await new Promise((res) => setTimeout(res, 10));
  throw new Error("async");
}

window.addEventListener("unload", (e: Event) => console.error(e));
window.addEventListener("uncaughtException", (e: Event) => console.error(e));
window.addEventListener("unhandledRejection", (e: Event) => console.error(e));
errAsync();
