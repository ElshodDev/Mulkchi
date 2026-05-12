# Script to organize all uncommitted changes into logical commits
# Follow Clean Architecture principles

Write-Host "Starting to organize commits..." -ForegroundColor Green

# Get current branch
$currentBranch = git rev-parse --abbrev-ref HEAD
Write-Host "Current branch: $currentBranch" -ForegroundColor Cyan

if ($currentBranch -ne "feature/development") {
    Write-Host "Creating feature/development branch..." -ForegroundColor Yellow
    git checkout -b feature/development
}

# 1. Auth & Security Changes
Write-Host "`n1. Committing Auth & Security improvements..." -ForegroundColor Cyan
git add `
    "Mulkchi.Api/Controllers/Auth/AccountController.cs" `
    "Mulkchi.Api/Controllers/Auth/SocialAuthController.cs" `
    "Mulkchi.Api/Controllers/Auth/TokenController.cs" `
    "Mulkchi.Api/Controllers/Auth/AuthCookieHelper.cs" `
    "Mulkchi.Api/Controllers/TelegramAuthController.cs" `
    "Mulkchi.Api/Services/Foundations/Auth/AuthService.cs" `
    "Mulkchi.Api/Services/Foundations/Auth/TelegramAuthService.cs" `
    "Mulkchi.Api/Services/Foundations/Auth/IRefreshTokenGuard.cs" `
    "Mulkchi.Api/Services/Foundations/Auth/NoOpRefreshTokenGuard.cs" `
    "Mulkchi.Api/Services/Foundations/Auth/RedisRefreshTokenGuard.cs" `
    "Mulkchi.Api/Models/Foundations/Auth/AuthResponse.cs" `
    "Mulkchi.Api/Models/Foundations/Auth/AuthUserInfo.cs" `
    "Mulkchi.Frontend/src/app/core/services/auth.service.ts" `
    "Mulkchi.Frontend/src/app/core/services/telegram-auth.service.ts" `
    "Mulkchi.Frontend/src/app/features/auth/login/login.component.ts" `
    "Mulkchi.Frontend/src/app/features/auth/register/register.component.ts" `
    "Mulkchi.Frontend/src/app/features/auth/forgot-password/forgot-password.component.ts" `
    "Mulkchi.Frontend/src/app/features/auth/telegram-login/telegram-login.component.ts"

git commit -m "feat: improve authentication and security mechanisms

- Add refresh token guard with Redis support
- Implement AuthCookieHelper for secure cookie handling
- Enhance Telegram authentication service
- Update auth controllers with better security practices
- Add NoOp and Redis implementations for token guards
- Update frontend auth services and components"

# 2. User Management
Write-Host "2. Committing User Management changes..." -ForegroundColor Cyan
git add `
    "Mulkchi.Api/Models/Foundations/Users/User.cs" `
    "Mulkchi.Api/Services/Foundations/Users/UserConnectionTracker.cs" `
    "Mulkchi.Api/Services/Foundations/Users/RedisUserConnectionTracker.cs" `
    "Mulkchi.Api/Brokers/Storages/Users/IStorageBroker.Users.cs" `
    "Mulkchi.Api/Brokers/Storages/Users/StorageBroker.Users.cs" `
    "Mulkchi.Api/Migrations/20260508171215_AddTelegramIdToUsers.Designer.cs" `
    "Mulkchi.Api/Migrations/20260508171215_AddTelegramIdToUsers.cs" `
    "Mulkchi.Frontend/src/app/core/models/user.model.ts" `
    "Mulkchi.Frontend/src/app/features/profile/profile.component.ts"

git commit -m "feat: enhance user management system

- Add Telegram ID to user model with migration
- Implement Redis-based user connection tracker
- Update storage broker with user operations
- Add connection tracking service
- Update frontend user model and profile component"

# 3. Analytics & Monitoring
Write-Host "3. Committing Analytics & Monitoring changes..." -ForegroundColor Cyan
git add `
    "Mulkchi.Api/Controllers/AnalyticsController.cs" `
    "Mulkchi.Api/Services/Foundations/Analytics/AnalyticsService.cs" `
    "Mulkchi.Api/Services/Foundations/Analytics/IAnalyticsService.cs" `
    "Mulkchi.Api/Services/Background/AnalyticsCollectionService.cs" `
    "Mulkchi.Api/Brokers/Storages/Analytics/" `
    "Mulkchi.Api/DataSeed/DevelopmentDataSeeder.cs" `
    "Mulkchi.Frontend/src/app/features/market-analytics/smart-analytics.component.ts"

git commit -m "feat: implement analytics and monitoring system

- Create analytics service with data collection
- Add analytics storage broker
- Implement background collection service
- Update development data seeder
- Add smart analytics frontend component
- Enhance market analytics visualization"

# 4. Properties & Bookings (with tests)
Write-Host "4. Committing Properties & Bookings changes..." -ForegroundColor Cyan
git add `
    "Mulkchi.Api/Application/Services/PropertyService.cs" `
    "Mulkchi.Api/Services/Foundations/Properties/PropertyService.cs" `
    "Mulkchi.Api/Services/Foundations/Properties/PropertyService.Validations.cs" `
    "Mulkchi.Api/Controllers/BookingsController.cs" `
    "Mulkchi.Api/Controllers/PropertyImagesUploadController.cs" `
    "Mulkchi.Api/Brokers/Storages/Properties/StorageBroker.Properties.cs" `
    "Mulkchi.Api.Tests/Application/Services/PropertyServiceTests.cs" `
    "Mulkchi.Api.Tests/Mulkchi.Api.Tests.csproj" `
    "Mulkchi.Frontend/src/app/features/properties/property-list/property-list.component.ts" `
    "Mulkchi.Frontend/src/app/features/properties/property-detail/property-detail.component.ts" `
    "Mulkchi.Frontend/src/app/features/properties/property-form/property-form.component.ts" `
    "Mulkchi.Frontend/src/app/features/properties/booking-panel/booking-panel.component.ts" `
    "Mulkchi.Frontend/src/app/features/properties/property-compare/property-compare.component.ts" `
    "Mulkchi.Frontend/src/app/features/bookings/booking-list/booking-list.component.ts" `
    "Mulkchi.Frontend/src/app/features/host/host-properties/host-properties.component.ts" `
    "Mulkchi.Frontend/src/app/features/host/host-bookings/host-bookings.component.ts"

git commit -m "feat: enhance properties and bookings management

- Refactor PropertyService with validation layer
- Improve property storage broker operations
- Add comprehensive PropertyServiceTests
- Update booking controller with better validation
- Enhance property image upload handling
- Update all property-related frontend components
- Improve comparison and detail views"

# 5. Favorites Management
Write-Host "5. Committing Favorites changes..." -ForegroundColor Cyan
git add `
    "Mulkchi.Api/Controllers/FavoritesController.cs" `
    "Mulkchi.Frontend/src/app/features/favorites/favorites.component.ts" `
    "Mulkchi.Frontend/src/app/core/services/favorites.service.ts"

git commit -m "feat: implement favorites management system

- Update favorites controller with better handling
- Create favorites service for frontend
- Enhance favorites component UI/UX
- Improve favorite operations"

# 6. Real-time Chat
Write-Host "6. Committing Real-time Chat changes..." -ForegroundColor Cyan
git add `
    "Mulkchi.Api/Hubs/ChatHub.cs" `
    "Mulkchi.Api/Services/Foundations/Chat/ChatService.cs" `
    "Mulkchi.Frontend/src/app/features/messages/messages.component.ts" `
    "Mulkchi.Frontend/src/app/core/services/chat.service.ts"

git commit -m "feat: enhance real-time chat system

- Improve ChatHub with better connection handling
- Update ChatService with message operations
- Enhance frontend messages component
- Add chat service for message operations"

# 7. Subscriptions
Write-Host "7. Committing Subscriptions changes..." -ForegroundColor Cyan
git add "Mulkchi.Api/Services/Foundations/Subscriptions/SubscriptionService.cs"

git commit -m "feat: update subscriptions service implementation"

# 8. Infrastructure & Middleware
Write-Host "8. Committing Infrastructure & Middleware changes..." -ForegroundColor Cyan
git add `
    "Mulkchi.Api/Brokers/Storages/StorageBroker.cs" `
    "Mulkchi.Api/Brokers/Storages/StorageBrokerDesignTimeFactory.cs" `
    "Mulkchi.Api/Brokers/Storages/IStorageBroker.Boosts.cs" `
    "Mulkchi.Api/Brokers/Storages/StorageBroker.Boosts.cs" `
    "Mulkchi.Api/Middleware/CorrelationIdMiddleware.cs" `
    "Mulkchi.Api/Middleware/RequestLoggingMiddleware.cs" `
    "Mulkchi.Api/Migrations/StorageBrokerModelSnapshot.cs" `
    "Mulkchi.Api/Services/Background/RedisPresenceCleanupService.cs"

git commit -m "chore: improve infrastructure and middleware

- Enhance StorageBroker with better factory pattern
- Add RequestLoggingMiddleware for request tracking
- Implement RedisPresenceCleanupService
- Update boost storage operations
- Improve correlation ID handling
- Update migration snapshots"

# 9. Frontend Architecture
Write-Host "9. Committing Frontend Architecture changes..." -ForegroundColor Cyan
git add `
    "Mulkchi.Frontend/src/app/app.config.ts" `
    "Mulkchi.Frontend/src/app/app.html" `
    "Mulkchi.Frontend/src/app/app.routes.ts" `
    "Mulkchi.Frontend/src/app/app.scss" `
    "Mulkchi.Frontend/src/app/app.ts" `
    "Mulkchi.Frontend/src/app/core/interceptors/auth.interceptor.ts" `
    "Mulkchi.Frontend/src/app/core/layout/layout/layout.component.ts" `
    "Mulkchi.Frontend/src/app/core/layout/navbar/navbar.component.ts" `
    "Mulkchi.Frontend/src/app/core/models/api.models.ts" `
    "Mulkchi.Frontend/src/app/core/models/index.ts" `
    "Mulkchi.Frontend/src/app/core/models/announcement.model.ts" `
    "Mulkchi.Frontend/src/app/core/services/index.ts" `
    "Mulkchi.Frontend/src/app/core/services/logger.service.ts" `
    "Mulkchi.Frontend/src/app/core/services/notifications.service.ts" `
    "Mulkchi.Frontend/src/app/core/services/seo.service.ts" `
    "Mulkchi.Frontend/src/app/core/services/announcement.service.ts" `
    "Mulkchi.Frontend/src/app/core/strategies/selective-preloading.strategy.ts" `
    "Mulkchi.Frontend/src/app/core/stores/ui.store.ts" `
    "Mulkchi.Frontend/src/app/features/admin/admin-dashboard/admin-dashboard.component.ts" `
    "Mulkchi.Frontend/src/app/features/admin/admin-dashboard/announcements-management.component.ts" `
    "Mulkchi.Frontend/src/app/features/admin/admin.routes.ts" `
    "Mulkchi.Frontend/src/app/features/home/home.component.ts" `
    "Mulkchi.Frontend/src/app/features/home/announcements-widget.component.ts" `
    "Mulkchi.Frontend/src/app/features/errors/not-found/not-found.component.ts" `
    "Mulkchi.Frontend/src/app/features/ai-tools/" `
    "Mulkchi.Frontend/src/app/features/market/" `
    "Mulkchi.Frontend/src/app/shared/components/index.ts" `
    "Mulkchi.Frontend/src/app/shared/components/google-login/google-login.component.ts" `
    "Mulkchi.Frontend/src/app/shared/components/image-upload/image-upload.component.ts" `
    "Mulkchi.Frontend/src/app/shared/components/optimized-image/" `
    "Mulkchi.Frontend/src/app/shared/components/progressive-disclosure/" `
    "Mulkchi.Frontend/src/app/shared/components/smart-loading/" `
    "Mulkchi.Frontend/src/app/shared/components/smart-search/" `
    "Mulkchi.Frontend/src/environments/environment.ts" `
    "Mulkchi.Frontend/src/styles.scss" `
    "Mulkchi.Frontend/tsconfig.app.json"

git commit -m "feat: refactor frontend architecture and components

- Restructure app routing and configuration
- Add announcement model and service
- Implement admin dashboard with announcements management
- Add AI tools feature module
- Add market analytics feature module
- Create reusable component library:
  * optimized-image component
  * progressive-disclosure component
  * smart-loading component
  * smart-search component
- Update layout components with navbar improvements
- Add announcement widget to home
- Enhance auth interceptor
- Improve service organization with index exports
- Update logger, notifications, and SEO services
- Add UI store with Pinia
- Improve selective preloading strategy
- Update TypeScript configuration
- Enhanced global styles"

# 10. Dependencies & Configuration
Write-Host "10. Committing Dependencies & Configuration changes..." -ForegroundColor Cyan
git add `
    ".gitignore" `
    "Mulkchi.Frontend/package.json" `
    "Mulkchi.Frontend/package-lock.json"

git commit -m "chore: update dependencies and configuration

- Update npm dependencies to latest compatible versions
- Update .gitignore for better coverage
- Update package-lock.json"

# 11. Documentation cleanup
Write-Host "11. Committing documentation changes..." -ForegroundColor Cyan
git add -u  # Stage deletions
git add ".github/" || $true  # If .github folder exists

git commit -m "docs: cleanup documentation files

- Remove outdated pull request template
- Remove project map (auto-generated)
- Remove Telegram webhook setup guide (moved to wiki)" --allow-empty

Write-Host "`n✅ All commits organized successfully!" -ForegroundColor Green
Write-Host "Current branch: $(git rev-parse --abbrev-ref HEAD)" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. git push origin $(git rev-parse --abbrev-ref HEAD)" -ForegroundColor White
Write-Host "2. Create Pull Request to main" -ForegroundColor White
Write-Host "3. Review and merge" -ForegroundColor White
