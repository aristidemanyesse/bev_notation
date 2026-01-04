npm install
npm run build
docker-buildx build --platform linux/amd64 -t aristidemanyesse/bev_notation:0.0.0c --load --push .
