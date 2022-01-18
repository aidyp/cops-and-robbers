FROM node:16-alpine


 # Create app directory 
 WORKDIR /app
 RUN apk add --no-cache \
    build-base \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev

 # Install app dependencies 
 COPY package*.json ./

 RUN apk --no-cache --virtual build-dependencies add python3 make g++ \
 && npm install -g nodemon \
 #&& node-gyp rebuild \
 #&& npm update \
 && npm install --build-from-source

 # Bundle app source
 COPY . .

 # Expose & Run
 EXPOSE 8081
 ENTRYPOINT [ "nodemon", "server/index.js"]
