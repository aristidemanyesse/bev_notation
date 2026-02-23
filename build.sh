npm install
npm run build
docker-buildx build --platform linux/amd64 -t aristidemanyesse/bev_notation:0.3a --load .
# docker-buildx build --platform linux/amd64 -t aristidemanyesse/bev_notation:0.2b --load --push .
