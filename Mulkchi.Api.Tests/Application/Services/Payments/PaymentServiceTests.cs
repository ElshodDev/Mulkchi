using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Bogus;
using FluentAssertions;
using Moq;
using Mulkchi.Api.Brokers.DateTimes;
using Mulkchi.Api.Brokers.Loggings;
using Mulkchi.Api.Brokers.Payments;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Models.Foundations.Payments;
using Mulkchi.Api.Models.Foundations.Payments.Exceptions;
using Mulkchi.Api.Services.Foundations.Payments;
using Xunit;

namespace Mulkchi.Api.Tests.Application.Services.Payments;

public class PaymentServiceTests
{
    private readonly Mock<IStorageBroker> storageBrokerMock;
    private readonly Mock<ILoggingBroker> loggingBrokerMock;
    private readonly Mock<IDateTimeBroker> dateTimeBrokerMock;
    private readonly Mock<IPaymeBroker> paymeBrokerMock;
    private readonly Mock<IClickBroker> clickBrokerMock;
    private readonly IPaymentService paymentService;

    public PaymentServiceTests()
    {
        this.storageBrokerMock = new Mock<IStorageBroker>();
        this.loggingBrokerMock = new Mock<ILoggingBroker>();
        this.dateTimeBrokerMock = new Mock<IDateTimeBroker>();
        this.paymeBrokerMock = new Mock<IPaymeBroker>();
        this.clickBrokerMock = new Mock<IClickBroker>();

        this.paymentService = new PaymentService(
            this.storageBrokerMock.Object,
            this.loggingBrokerMock.Object,
            this.dateTimeBrokerMock.Object,
            this.paymeBrokerMock.Object,
            this.clickBrokerMock.Object);
    }

    private static Payment CreateRandomPayment()
    {
        return new Faker<Payment>()
            .RuleFor(p => p.Id, f => Guid.NewGuid())
            .RuleFor(p => p.BookingId, f => Guid.NewGuid())
            .RuleFor(p => p.PayerId, f => Guid.NewGuid())
            .RuleFor(p => p.ReceiverId, f => Guid.NewGuid())
            .RuleFor(p => p.Amount, f => f.Random.Decimal(10, 1000))
            .RuleFor(p => p.ExternalTransactionId, f => f.Random.AlphaNumeric(10))
            .RuleFor(p => p.IdempotencyKey, f => Guid.NewGuid().ToString())
            .RuleFor(p => p.CreatedDate, f => f.Date.PastOffset())
            .RuleFor(p => p.UpdatedDate, f => f.Date.PastOffset())
            .Generate();
    }

    [Fact]
    public async Task AddPaymentAsync_WithValidPayment_ShouldAddPayment()
    {
        // Arrange
        var payment = CreateRandomPayment();
        var now = DateTimeOffset.UtcNow;

        this.dateTimeBrokerMock.Setup(broker => broker.GetCurrentDateTimeOffset())
            .Returns(now);
        this.storageBrokerMock.Setup(broker => broker.InsertPaymentAsync(payment))
            .ReturnsAsync(payment);

        // Act
        var result = await this.paymentService.AddPaymentAsync(payment);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(payment.Id);

        this.storageBrokerMock.Verify(broker => broker.InsertPaymentAsync(It.IsAny<Payment>()), Times.Once);
    }

    [Fact]
    public void RetrieveAllPayments_ShouldReturnPayments()
    {
        // Arrange
        var payments = new List<Payment>
        {
            CreateRandomPayment(),
            CreateRandomPayment()
        }.AsQueryable();

        this.storageBrokerMock.Setup(broker => broker.SelectAllPayments())
            .Returns(payments);

        // Act
        var result = this.paymentService.RetrieveAllPayments();

        // Assert
        result.Should().NotBeNull();
        result.Count().Should().Be(2);
    }

    [Fact]
    public async Task RetrievePaymentByIdAsync_WhenPaymentExists_ShouldReturnPayment()
    {
        // Arrange
        var paymentId = Guid.NewGuid();
        var payment = CreateRandomPayment();
        payment.Id = paymentId;

        this.storageBrokerMock.Setup(broker => broker.SelectPaymentByIdAsync(paymentId))
            .ReturnsAsync(payment);

        // Act
        var result = await this.paymentService.RetrievePaymentByIdAsync(paymentId);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(paymentId);
    }

    [Fact]
    public async Task RetrievePaymentByIdAsync_WhenPaymentDoesNotExist_ShouldThrowNotFoundPaymentException()
    {
        // Arrange
        var paymentId = Guid.NewGuid();

        this.storageBrokerMock.Setup(broker => broker.SelectPaymentByIdAsync(paymentId))
            .ReturnsAsync((Payment)null);

        // Act
        Func<Task> action = async () => await this.paymentService.RetrievePaymentByIdAsync(paymentId);

        // Assert
        var exception = await action.Should().ThrowAsync<PaymentDependencyValidationException>();
        exception.WithInnerException<NotFoundPaymentException>();
    }

    [Fact]
    public async Task RetrievePaymentByIdempotencyKeyAsync_WhenPaymentExists_ShouldReturnPayment()
    {
        // Arrange
        var idempotencyKey = Guid.NewGuid().ToString();
        var payment = CreateRandomPayment();
        payment.IdempotencyKey = idempotencyKey;

        this.storageBrokerMock.Setup(broker => broker.SelectPaymentByIdempotencyKeyAsync(idempotencyKey))
            .ReturnsAsync(payment);

        // Act
        var result = await this.paymentService.RetrievePaymentByIdempotencyKeyAsync(idempotencyKey);

        // Assert
        result.Should().NotBeNull();
        result.IdempotencyKey.Should().Be(idempotencyKey);
    }

    [Fact]
    public async Task RetrievePaymentByIdempotencyKeyAsync_WhenKeyIsNullOrWhiteSpace_ShouldReturnNull()
    {
        // Arrange
        string idempotencyKey = "   ";

        // Act
        var result = await this.paymentService.RetrievePaymentByIdempotencyKeyAsync(idempotencyKey);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task ModifyPaymentAsync_WithValidPayment_ShouldModifyPayment()
    {
        // Arrange
        var payment = CreateRandomPayment();
        var now = DateTimeOffset.UtcNow;

        this.dateTimeBrokerMock.Setup(broker => broker.GetCurrentDateTimeOffset())
            .Returns(now);
        this.storageBrokerMock.Setup(broker => broker.UpdatePaymentAsync(payment))
            .ReturnsAsync(payment);

        // Act
        var result = await this.paymentService.ModifyPaymentAsync(payment);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(payment.Id);

        this.storageBrokerMock.Verify(broker => broker.UpdatePaymentAsync(It.IsAny<Payment>()), Times.Once);
    }

    [Fact]
    public async Task RemovePaymentByIdAsync_WhenPaymentExists_ShouldRemovePayment()
    {
        // Arrange
        var paymentId = Guid.NewGuid();
        var payment = CreateRandomPayment();
        payment.Id = paymentId;

        this.storageBrokerMock.Setup(broker => broker.DeletePaymentByIdAsync(paymentId))
            .ReturnsAsync(payment);

        // Act
        var result = await this.paymentService.RemovePaymentByIdAsync(paymentId);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(paymentId);

        this.storageBrokerMock.Verify(broker => broker.DeletePaymentByIdAsync(paymentId), Times.Once);
    }
}
