FROM node:20-alpine AS frontend
WORKDIR /src
COPY client-react/package*.json ./
RUN npm ci
COPY client-react/ ./
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS backend
WORKDIR /src
COPY backend/*.csproj ./
RUN dotnet restore
COPY backend/ ./
RUN dotnet publish -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=backend /app/publish ./
COPY --from=frontend /src/dist ./wwwroot
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080
CMD ASPNETCORE_URLS=http://+:${PORT:-8080} dotnet backend.dll
