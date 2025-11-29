# EcoTrack - Personal Carbon Footprint Tracker

A web application that helps users track and reduce their daily carbon footprint. Built specifically for the Kitchener-Waterloo-Cambridge community.

## Features

### Core Functionality
- **Dashboard**: Real-time visualization of daily carbon emissions with interactive charts
- **Activity Logging**: Track transportation, food, and energy consumption with one click
- **Insights**: Personalized recommendations based on your usage patterns
- **KWC Resources**: Local eco-friendly resources specific to the Kitchener-Waterloo-Cambridge region
- **Goals & Challenges**: Weekly challenges and community leaderboard

### Technical Features
- Responsive design for desktop and mobile
- Data persistence with localStorage
- Export data as JSON, CSV, or HTML report
- Modular JavaScript architecture
- CSS custom properties for theming

## Project Structure

```
ecotrack/
├── index.html              # Main HTML file
├── styles.css              # Main stylesheet
├── app.js                  # Main application logic
├── css/
│   ├── variables.css       # CSS custom properties
│   └── components.css      # Reusable component styles
├── js/
│   ├── utils.js            # Utility functions
│   ├── storage.js          # LocalStorage management
│   ├── carbon.js           # Carbon calculation logic
│   ├── charts.js           # Chart.js configuration
│   ├── ui.js               # UI update functions
│   └── export.js           # Data export functionality
├── README.md               # Documentation
└── vercel.json             # Vercel deployment config
```

## Tech Stack

- HTML5
- CSS3 (Custom Properties, Flexbox, Grid)
- Vanilla JavaScript (ES6+)
- Chart.js for data visualization
- LocalStorage for data persistence

## Getting Started

1. Clone the repository
2. Open `index.html` in a web browser
3. Start logging your daily activities

No build process or dependencies required.

## Demo Mode

Press `Ctrl+D` to load sample data for demonstration purposes.

## Deployment

This is a static site that can be deployed to:
- Vercel (recommended)
- Netlify
- GitHub Pages

### Deploy to Vercel

1. Push code to GitHub
2. Import repository on vercel.com
3. Deploy automatically

## Carbon Calculations

Carbon values are based on average emissions data:

| Activity | CO2 (kg) | Source |
|----------|----------|--------|
| Car (per km) | 0.23 | Transport Canada |
| Bus (per km) | 0.08 | GRT Data |
| Beef meal | 6.5 | Environmental Research |
| Chicken meal | 1.8 | Environmental Research |
| Vegetarian meal | 0.5 | Environmental Research |

## KWC Regional Data

- Regional average: 14.2 kg CO2 per person per day
- GRT serves 70,000+ daily riders
- 100+ km of cycling infrastructure

## Built For

Region Hacks 2025 - Kitchener-Waterloo-Cambridge

A beginner-friendly hackathon focused on bringing high school students together to build innovative projects.

## License

MIT License - feel free to use and modify for your own projects.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## Acknowledgments

- Region of Waterloo environmental data
- Grand River Transit
- Chart.js library
