using Xunit;
using Moq;
using Mulkchi.Api.Application.DTOs;
using Mulkchi.Api.Application.Interfaces;
using Mulkchi.Api.Application.Services;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Models.Foundations.Properties;
using System;
using System.Threading.Tasks;

namespace Mulkchi.Api.Tests.Application.Services
{
    /// <summary>
    /// PropertyService unit tests - Clean Architecture
    /// BMI: Business logic testing
    /// </summary>
    public class PropertyServiceTests
    {
        private readonly Mock<IRepository<Property>> _mockPropertyRepo;
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<IStorageBroker> _mockStorageBroker;
        private readonly PropertyService _propertyService;

        public PropertyServiceTests()
        {
            _mockPropertyRepo = new Mock<IRepository<Property>>();
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockStorageBroker = new Mock<IStorageBroker>();
            
            _propertyService = new PropertyService(
                _mockPropertyRepo.Object,
                _mockUnitOfWork.Object,
                _mockStorageBroker.Object);
        }

        [Fact]
        public async Task CreateAsync_WithValidData_ReturnsPropertyDto()
        {
            // Arrange
            var request = new CreatePropertyRequest
            {
                Title = "3-xonali kvartira",
                Description = "Markaziy qismda joylashgan",
                Price = 50000000,
                Rooms = 3,
                Bathrooms = 2,
                Area = 75.5,
                Floor = 5,
                TotalFloors = 9,
                PropertyType = PropertyType.Apartment,
                Address = "Amir Temur 45",
                City = "Toshkent",
                Region = nameof(UzbekistanRegion.ToshkentShahar),
                Latitude = 41.2995,
                Longitude = 69.2401
            };
            
            var ownerId = Guid.NewGuid();
            
            _mockPropertyRepo.Setup(r => r.AddAsync(It.IsAny<Property>()))
                .ReturnsAsync((Property p) => p);
            
            _mockUnitOfWork.Setup(u => u.BeginTransactionAsync())
                .Returns(Task.CompletedTask);
            _mockUnitOfWork.Setup(u => u.CommitTransactionAsync())
                .Returns(Task.CompletedTask);

            // Act
            var result = await _propertyService.CreateAsync(request, ownerId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(request.Title, result.Title);
            Assert.Equal(request.Price, result.Price);
            Assert.Equal(request.Rooms, result.Rooms);
            Assert.Equal(ownerId, result.OwnerId);
            
            _mockPropertyRepo.Verify(r => r.AddAsync(It.IsAny<Property>()), Times.Once);
            _mockUnitOfWork.Verify(u => u.CommitTransactionAsync(), Times.Once);
        }

        [Fact]
        public async Task GetByIdAsync_WithExistingId_ReturnsPropertyDto()
        {
            // Arrange
            var propertyId = Guid.NewGuid();
            var property = new Property
            {
                Id = propertyId,
                Title = "Test Property",
                Price = 100000000,
                Rooms = 4,
                OwnerId = Guid.NewGuid(),
                IsActive = true,
                IsVerified = true
            };
            
            _mockStorageBroker.Setup(broker => broker.SelectPropertyByIdAsync(propertyId))
                .ReturnsAsync(property);

            // Act
            var result = await _propertyService.GetByIdAsync(propertyId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(propertyId, result.Id);
            Assert.Equal(property.Title, result.Title);
        }

        [Fact]
        public async Task GetByIdAsync_WithNonExistingId_ReturnsNull()
        {
            // Arrange
            var propertyId = Guid.NewGuid();
            
            _mockStorageBroker.Setup(broker => broker.SelectPropertyByIdAsync(propertyId))
                .ReturnsAsync((Property)null!);

            // Act
            var result = await _propertyService.GetByIdAsync(propertyId);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task IsOwnerAsync_WithCorrectOwner_ReturnsTrue()
        {
            // Arrange
            var propertyId = Guid.NewGuid();
            var ownerId = Guid.NewGuid();
            
            var property = new Property
            {
                Id = propertyId,
                OwnerId = ownerId,
                IsActive = true
            };
            
            _mockPropertyRepo.Setup(r => r.GetByIdAsync(propertyId))
                .ReturnsAsync(property);

            // Act
            var result = await _propertyService.IsOwnerAsync(propertyId, ownerId);

            // Assert
            Assert.True(result);
        }

        [Fact]
        public async Task IsOwnerAsync_WithWrongOwner_ReturnsFalse()
        {
            // Arrange
            var propertyId = Guid.NewGuid();
            var ownerId = Guid.NewGuid();
            var wrongOwnerId = Guid.NewGuid();
            
            var property = new Property
            {
                Id = propertyId,
                OwnerId = wrongOwnerId,
                IsActive = true
            };
            
            _mockPropertyRepo.Setup(r => r.GetByIdAsync(propertyId))
                .ReturnsAsync(property);

            // Act
            var result = await _propertyService.IsOwnerAsync(propertyId, ownerId);

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task DeleteAsync_WithExistingProperty_SoftDeletes()
        {
            // Arrange
            var propertyId = Guid.NewGuid();
            var property = new Property
            {
                Id = propertyId,
                Title = "Test",
                IsActive = true,
                IsVerified = true
            };
            
            _mockPropertyRepo.Setup(r => r.GetByIdAsync(propertyId))
                .ReturnsAsync(property);
            _mockUnitOfWork.Setup(u => u.BeginTransactionAsync())
                .Returns(Task.CompletedTask);
            _mockUnitOfWork.Setup(u => u.CommitTransactionAsync())
                .Returns(Task.CompletedTask);

            // Act
            await _propertyService.DeleteAsync(propertyId);

            // Assert
            Assert.False(property.IsActive); // Soft delete
            Assert.NotNull(property.DeletedDate);
            
            _mockPropertyRepo.Verify(r => r.UpdateAsync(property), Times.Once);
        }
    }
}
