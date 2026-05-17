# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy solution and project files
COPY ["Mulkchi.sln", "./"]
COPY ["Mulkchi.Api/Mulkchi.Api.csproj", "Mulkchi.Api/"]
COPY ["Mulkchi.Api.Tests/Mulkchi.Api.Tests.csproj", "Mulkchi.Api.Tests/"]

# Restore dependencies
RUN dotnet restore "Mulkchi.sln"

# Copy full source code
COPY . .
WORKDIR "/src/Mulkchi.Api"

# Publish the application
RUN dotnet publish "Mulkchi.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

# Expose port and configure environment
EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production

# Run the application
ENTRYPOINT ["dotnet", "Mulkchi.Api.dll"]
