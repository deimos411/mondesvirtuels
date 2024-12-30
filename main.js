// JavaScript to apply random animation speeds
document.querySelectorAll('.image-container').forEach((container) => {
  const randomDuration = (Math.random() * 8 + 4).toFixed(2) // Random duration between 4s and 8s
  container.style.setProperty('--animation-duration', `${randomDuration}s`)
})

// Show/Hide Scroll-to-Top Button
const scrollToTopButton = document.getElementById('scrollToTop')

window.addEventListener('scroll', () => {
  if (window.scrollY > 200) {
    scrollToTopButton.style.display = 'block'
  } else {
    scrollToTopButton.style.display = 'none'
  }
})

// Scroll to Top Smoothly
scrollToTopButton.addEventListener('click', () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
})
