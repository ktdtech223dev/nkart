FROM node:18-alpine
WORKDIR /app
COPY server/ .
RUN npm install
EXPOSE 3001
CMD ["node", "index.js"]
