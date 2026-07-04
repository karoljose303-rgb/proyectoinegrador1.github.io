const themeBtn = document.getElementById("themeBtn");

if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    themeBtn.textContent = "☀";
} else {
    themeBtn.textContent = "☾";
}

themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");

    if (document.body.classList.contains("dark")) {
        themeBtn.textContent = "☀";
        localStorage.setItem("theme", "dark");
    } else {
        themeBtn.textContent = "☾";
        localStorage.setItem("theme", "light");
    }
});