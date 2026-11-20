const copyButton = document.getElementById('copy-email');
const copyStatus = document.getElementById('copy-status');
if (navigator.clipboard?.writeText) {
  copyButton.hidden = false;
  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText('aliparchekan@gmail.com');
      copyStatus.textContent = 'Email copied.';
    } catch {
      copyStatus.textContent = 'Select the email address to copy it, or click it to send a message.';
    }
  });
}
document.getElementById('year').textContent = new Date().getFullYear();
