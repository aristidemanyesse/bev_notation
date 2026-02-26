npm install
npm run build
# docker-buildx build --platform linux/amd64 -t aristidemanyesse/bev_notation:0.4 --load .
docker-buildx build --platform linux/amd64 -t aristidemanyesse/bev_notation:0.5 --load --push .
