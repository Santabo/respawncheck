# RespawnCheck 🎮

Accurate game server status tracker using real data sources.

## How It Works
- **Fortnite**: Uses fnqueue.com's actual data + DownDetector graph analysis
- **Brawl Stars**: Analyzes DownDetector outage reports and graph colors

## Status Determination
### Fortnite:
- **🟢 Online**: fnqueue.com shows online OR DownDetector green
- **🟡 Issues**: DownDetector orange graph = "Some users experiencing issues"  
- **🔴 Offline**: fnqueue.com shows offline OR DownDetector red graph

### Brawl Stars:
- **🟢 Online**: DownDetector green = "No problems"
- **🟡 Issues**: DownDetector orange = "Some users experiencing issues"
- **🔴 Offline**: DownDetector red = "Major outage"

## Data Sources
- **fnqueue.com** - Primary Fortnite source
- **DownDetector UK** - Outage reports and graph analysis
- **Real-time analysis** of server status indicators

## Deployment
1. Fork this repository
2. Deploy to Vercel
3. Your site will be live at `respawncheck.vercel.app`

## Note
Unofficial project - uses public data sources for server status determination.
