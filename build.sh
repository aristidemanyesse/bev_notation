npm install
npm run build
docker-buildx build --platform linux/amd64 -t aristidemanyesse/bev_notation:0.2a --load --push .
