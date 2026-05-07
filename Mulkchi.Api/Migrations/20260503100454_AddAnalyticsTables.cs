using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Mulkchi.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAnalyticsTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DistrictStats",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Region = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    District = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CalculatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    AverageSalePrice = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    MedianSalePrice = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    MinSalePrice = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    MaxSalePrice = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    PriceQuartile25 = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    PriceQuartile75 = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    PricePerSqm = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    AverageRentPrice = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    RentalYieldPercent = table.Column<decimal>(type: "numeric", nullable: false),
                    TotalListings = table.Column<int>(type: "integer", nullable: false),
                    NewListingsThisMonth = table.Column<int>(type: "integer", nullable: false),
                    ClosedListingsThisMonth = table.Column<int>(type: "integer", nullable: false),
                    AverageDaysOnMarket = table.Column<double>(type: "double precision", nullable: false),
                    ApartmentCount = table.Column<int>(type: "integer", nullable: false),
                    HouseCount = table.Column<int>(type: "integer", nullable: false),
                    CommercialCount = table.Column<int>(type: "integer", nullable: false),
                    LandCount = table.Column<int>(type: "integer", nullable: false),
                    OverallScore = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    AffordabilityScore = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    InfrastructureScore = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    ConnectivityScore = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    AmenitiesScore = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    SafetyScore = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    InvestmentPotentialScore = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    GrowthScore = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    WifiCoveragePercent = table.Column<double>(type: "double precision", nullable: false),
                    ParkingCoveragePercent = table.Column<double>(type: "double precision", nullable: false),
                    MetroCoveragePercent = table.Column<double>(type: "double precision", nullable: false),
                    SchoolCoveragePercent = table.Column<double>(type: "double precision", nullable: false),
                    MarketCoveragePercent = table.Column<double>(type: "double precision", nullable: false),
                    HospitalCoveragePercent = table.Column<double>(type: "double precision", nullable: false),
                    Summary = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DistrictStats", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MarketTrends",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Region = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    District = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PropertyType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    YearMonth = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: false),
                    AverageSalePrice = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    AverageRentPrice = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    PricePerSqm = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    ListingsCount = table.Column<int>(type: "integer", nullable: false),
                    TransactionsCount = table.Column<int>(type: "integer", nullable: false),
                    PriceChangePercent = table.Column<double>(type: "double precision", nullable: false),
                    AverageDaysOnMarket = table.Column<double>(type: "double precision", nullable: false),
                    MarketSentiment = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CalculatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    DataPointsUsed = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MarketTrends", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PriceHistories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PropertyId = table.Column<Guid>(type: "uuid", nullable: false),
                    Price = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    RecordedDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Source = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PreviousPrice = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    ChangePercent = table.Column<double>(type: "double precision", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PriceHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PriceHistories_Properties_PropertyId",
                        column: x => x.PropertyId,
                        principalTable: "Properties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DistrictStats_CalculatedAt",
                table: "DistrictStats",
                column: "CalculatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_DistrictStats_OverallScore",
                table: "DistrictStats",
                column: "OverallScore");

            migrationBuilder.CreateIndex(
                name: "IX_DistrictStats_Region_District",
                table: "DistrictStats",
                columns: new[] { "Region", "District" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MarketTrends_Region_District_YearMonth",
                table: "MarketTrends",
                columns: new[] { "Region", "District", "YearMonth" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MarketTrends_YearMonth",
                table: "MarketTrends",
                column: "YearMonth");

            migrationBuilder.CreateIndex(
                name: "IX_PriceHistories_PropertyId_RecordedDate",
                table: "PriceHistories",
                columns: new[] { "PropertyId", "RecordedDate" });

            migrationBuilder.CreateIndex(
                name: "IX_PriceHistories_RecordedDate",
                table: "PriceHistories",
                column: "RecordedDate");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DistrictStats");

            migrationBuilder.DropTable(
                name: "MarketTrends");

            migrationBuilder.DropTable(
                name: "PriceHistories");
        }
    }
}
