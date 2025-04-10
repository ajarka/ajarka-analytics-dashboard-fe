# Smartelco Dashboard

GitHub team analytics and progress tracking dashboard built with SolidJS.

## Prerequisites

- Node.js 18+
- npm/pnpm/yarn
- Docker (optional)

## Development Setup

1. Install dependencies:
```bash
npm install # or pnpm install or yarn install
```

2. Create `.env.local` file in the root directory:
```env
VITE_GITHUB_TOKEN=your_github_token_here
```

3. Start development server:
```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

## Docker Deployment

### Building and Pushing to DockerHub

We use semantic versioning (MAJOR.MINOR.PATCH) with the following format:
```
smartelco/dashboard:<version>[-<variant>]
```

Examples:
- `smartelco/dashboard:1.0.0` - Release version
- `smartelco/dashboard:1.0.0-alpine` - Alpine variant
- `smartelco/dashboard:latest` - Latest stable version

1. Build with version tag:
```bash
docker build --build-arg GITHUB_TOKEN=your_token_here -t smartelco/dashboard:1.0.0 .
```

2. Tag also as latest:
```bash
docker tag smartelco/dashboard:1.0.0 smartelco/dashboard:latest
```

3. Push to DockerHub:
```bash
# Push specific version
docker push smartelco/dashboard:1.0.0

# Push latest tag
docker push smartelco/dashboard:latest
```

### Running Container

1. Pull from DockerHub:
```bash
docker pull smartelco/dashboard:latest
```

2. Run container:
```bash
docker run -d -p 80:80 -e GITHUB_TOKEN=your_token_here smartelco/dashboard:latest
```

### Using Docker Compose

1. Create `.env` file:
```env
GITHUB_TOKEN=your_github_token_here
```

2. Update docker-compose.yml:
```yaml
version: '3.8'
services:
  dashboard:
    image: smartelco/dashboard:1.0.0  # Specify version here
    ports:
      - "80:80"
    environment:
      - GITHUB_TOKEN=${GITHUB_TOKEN}
```

3. Run with docker-compose:
```bash
docker-compose up -d
```

## Version Format

We follow semantic versioning:

- MAJOR version (X.0.0) - Incompatible API changes
- MINOR version (0.X.0) - Add functionality in a backward compatible manner
- PATCH version (0.0.X) - Backward compatible bug fixes

Tag variants:
- No suffix - Standard release (e.g., 1.0.0)
- -alpine - Alpine-based image for smaller size
- latest - Always points to the most recent stable release

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| GITHUB_TOKEN | GitHub Personal Access Token | Yes |

Make sure your GitHub token has the following permissions:
- repo
- read:org
- read:user

## Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build locally