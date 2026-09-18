# Daily Task Scheduler

A simple, responsive daily task scheduler (to-do list) web application built with plain HTML, CSS, and JavaScript. No frameworks, no build step, no dependencies. Deployed to GitHub Pages.

Live site: https://iosinnii.github.io/daily-task-scheduler/

## Features

- Add tasks with due dates and categories (Personal, Work, Shopping, Health, Other)
- Mark tasks as complete
- Delete tasks
- Filter tasks by category and status (all / active / completed)
- Clear completed tasks or all tasks
- Two switchable themes: **Blue-white** (light blue, default) and **Sage** (soft green)
- Task and theme persistence using local storage
- Responsive design for mobile and desktop

## Files

- `index.html` - Main HTML structure
- `styles.css` - CSS styling and theme definitions (CSS variables)
- `script.js` - Application logic, theme switching, and local storage
- `.github/workflows/deploy-pages.yml` - GitHub Actions workflow that deploys the site

## Local Usage

Open `index.html` in any modern web browser. Data is stored in your browser's local storage, so it stays on that browser and device, and clearing site data removes your tasks.

## Deployment

The site deploys automatically to GitHub Pages through GitHub Actions on every push to `main` (or manually via **Actions > Deploy static content to Pages > Run workflow**).

To deploy your own copy:

1. Fork or clone the repository
2. In the repository, go to **Settings > Pages** and set **Source** to **GitHub Actions**
3. Push to `main`; the workflow publishes the repository root

## Browser Compatibility

Works in all modern browsers on desktop and mobile.
