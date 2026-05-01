# Stage 1 — build frontend (React Router SPA)
FROM node:20-alpine AS frontend
WORKDIR /src
COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN npm install --prefix frontend
COPY frontend ./frontend
COPY scripts ./scripts
RUN npm run build --prefix frontend

# Stage 2 — build backend (.NET 8) and copy frontend bundle into wwwroot
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS backend
WORKDIR /src
COPY backend/backend.csproj ./backend/
RUN dotnet restore ./backend/backend.csproj
COPY backend ./backend
COPY --from=frontend /src/frontend/build/client ./backend/wwwroot
RUN dotnet publish ./backend/backend.csproj -c Release -o /app/publish \
    -p:SkipFrontendBuild=true

# Stage 3 — runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=backend /app/publish ./
ENV ASPNETCORE_URLS=http://0.0.0.0:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "backend.dll"]
