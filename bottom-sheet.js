function openInfoModal(titleText) {
  const container = document.getElementById("transactionInfoContainer");
  const sheet = document.getElementById("sheet");
  const overlay = document.getElementById("overlay");
  const closeBtn = document.getElementById("sheetClose")
  const button = document.getElementById("sheetBtn")
  const title = document.getElementById("sheetTitle")

  title.textContent = titleText;

  function open() {
    container.classList.add("active");
    sheet.classList.add("active");
    overlay.classList.add("active");
  }

  function close() {
    container.classList.remove("active");
    sheet.classList.remove("active");
    overlay.classList.remove("active");
  }

  open();

  overlay.addEventListener("click", () => {
    close();
  })

  closeBtn.addEventListener("click", () => {
    window.playHapticNavigation();
    close();
  })

  button.addEventListener("click", () => {
    window.playHapticNavigation();
    close();
  })
}

window.openInfoModal = openInfoModal;