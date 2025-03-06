import {AppController} from "../src/controllers/appController.js"

document.addEventListener('DOMContentLoaded', () => {
  loadAnimationStyles()
  const app = new AppController()
})

function loadAnimationStyles() {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = './assets/styles/animations.css';
  document.head.appendChild(link);
}