# EmpirBus Project Viewer (ebp2docs)

A straightforward web tool for EmpirBus `.ebp` files. Upload your project and get an instant overview of units, channels, IO mappings, and memory locations. Built to catch configuration issues early and generate clean documentation.

## What it does

- **Upload & parse** - Drop in your `.ebp` file, see everything laid out
- **IO overview** - Units, channels (in/out)
- **Collision detection** - Spot memory conflicts, channel overlaps and Alarm ID conflicts
- **Export options** - PDF or JSON for documentation
- **Zero setup** - Pure browser-based, no installation needed

## Quick start

Live version: `https://remcohalman.github.io/ebp2docs/`

Or run locally:

### Option 1:
```bash
python -m http.server 8000
# Open http://localhost:8000
```

### Option 2:
Clone the repo and open the `index.html` in a modern browser

## Built for marine electronics work

This came out of needing a faster way to review EmpirBus configurations without diving into the full studio environment. Particularly useful when you’re debugging NMEA2000 networks or validating channel assignments across multiple units.

The parser handles the XML structure, pulls out what matters, and presents it in a way that makes issues obvious. Export to PDF when you need to document the setup or share configurations with the team.

## Tech stack

- Vanilla JavaScript (ES6 modules)
- No dependencies, no build step
- Client-side XML parsing
- Works offline once loaded

## Current features

- [x] Unit information extraction  
- [ ] Channel mapping (input/output)  
- [ ] Project metadata display  
- [ ] Search/filter across units  
- [ ] Export to PDF/JSON  
- [ ] Responsive design

## Roadmap

Next up: Enhanced collision detection, memory location visualization, alarm configuration display, and schema tab extraction. 

Built this to scratch my own itch - if it helps your workflow too, that’s a bonus.

## Development

Standard HTML/CSS/JS structure. Check `docs/` for detailed setup and contribution guidelines if you want to extend it.

Issues and PRs welcome if you’re working with EmpirBus and have ideas.